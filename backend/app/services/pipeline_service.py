import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.case import Case
from app.models.document import Document
from app.models.finding import Finding

logger = logging.getLogger(__name__)


async def run_pipeline(db: AsyncSession, case: Case) -> Case:
    """
    Fetches documents for the case, runs the agent pipeline in a thread
    (agents are sync/blocking), persists findings, updates case status.
    """
    from agents.orchestrator import PipelineOrchestrator  # local import — keeps startup fast

    # Get all documents for this case
    result = await db.execute(
        select(Document).where(Document.case_id == case.id)
    )
    documents = list(result.scalars().all())

    if not documents:
        raise ValueError("Cannot run pipeline: case has no uploaded documents")

    # Mark case as processing
    case.status = "processing"
    case.updated_at = datetime.now(timezone.utc)
    await db.flush()

    doc_inputs = [
        {"file_path": d.file_path, "filename": d.filename, "doc_type": d.doc_type}
        for d in documents
    ]

    # Run blocking pipeline in thread pool so we don't block the event loop
    orchestrator = PipelineOrchestrator()
    pipeline_result = await asyncio.get_event_loop().run_in_executor(
        None,
        lambda: orchestrator.run(
            case_id=case.id,
            documents=doc_inputs,
            tip_text=case.tip_text or "",
        ),
    )

    if pipeline_result.status == "failed":
        case.status = "failed"
        case.updated_at = datetime.now(timezone.utc)
        await db.flush()
        raise RuntimeError(f"Pipeline failed: {pipeline_result.error}")

    # Persist all findings to DB
    for f in pipeline_result.findings:
        finding = Finding(
            case_id=case.id,
            fraud_type=f.get("fraud_type", "unknown"),
            severity=f.get("severity", "LOW"),
            description=f.get("description", ""),
            citation=f.get("citation", ""),
            confidence=float(f.get("confidence", 0.0)),
            applicable_statutes=json.dumps(f.get("applicable_statutes", [])),
            source_type=f.get("source_type", "DOCUMENT_EVIDENCE"),
            verification_status=f.get("verification_status", "document_supported"),
            peer_benchmark=json.dumps(f["peer_benchmark"]) if f.get("peer_benchmark") else None,
            model_version=f.get("model_version") or pipeline_result.findings[0].get("model_version"),
            prompt_version=f.get("prompt_version"),
        )
        db.add(finding)

    # Persist brief and update case
    case.confidence_floor_met = pipeline_result.confidence_floor_met
    case.attorney_brief = json.dumps(pipeline_result.attorney_brief) if pipeline_result.attorney_brief else None
    case.status = "review_pending" if pipeline_result.confidence_floor_met else "blocked"
    case.updated_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(case)

    logger.info(
        "Pipeline saved: case=%s status=%s findings=%d",
        case.id, case.status, len(pipeline_result.findings),
    )
    return case


async def get_findings(db: AsyncSession, case_id: str) -> List[Finding]:
    result = await db.execute(
        select(Finding)
        .where(Finding.case_id == case_id)
        .order_by(Finding.confidence.desc())
    )
    return list(result.scalars().all())
