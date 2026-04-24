import json
import logging
from dataclasses import dataclass, field
from typing import List, Optional

from agents.document_parser import DocumentParserAgent
from agents.fraud_pattern import FraudPatternAgent
from agents.narrative_generator import NarrativeGeneratorAgent

logger = logging.getLogger(__name__)


@dataclass
class PipelineResult:
    case_id: str
    status: str                          # completed | blocked | failed
    parsed_documents: List[dict] = field(default_factory=list)
    findings: List[dict] = field(default_factory=list)
    high_finding_count: int = 0
    confidence_floor_met: bool = False
    attorney_brief: Optional[dict] = None
    error: Optional[str] = None


class PipelineOrchestrator:
    """
    Runs the 3-agent DAG: parse → fraud_pattern → narrative.
    Agents never talk to each other — all data flows through this class.
    """

    def __init__(self):
        self.parser = DocumentParserAgent()
        self.fraud = FraudPatternAgent()
        self.narrative = NarrativeGeneratorAgent()

    def run(
        self,
        case_id: str,
        documents: List[dict],   # [{"file_path": str, "filename": str, "doc_type": str}]
        tip_text: str = "",
    ) -> PipelineResult:
        result = PipelineResult(case_id=case_id, status="processing")

        try:
            # ── Stage 1: Parse all documents ─────────────────────────────────
            logger.info("[%s] Stage 1 — parsing %d document(s)", case_id, len(documents))
            parsed_docs = []
            for doc in documents:
                logger.info("[%s] Parsing: %s", case_id, doc["filename"])
                raw_text, page_count = self.parser.extract_text(
                    doc["file_path"], doc["doc_type"]
                )
                parsed = self.parser.run(
                    document_text=raw_text,
                    filename=doc["filename"],
                )
                parsed["filename"] = doc["filename"]
                parsed["page_count"] = page_count
                parsed_docs.append(parsed)

            result.parsed_documents = parsed_docs

            # ── Stage 2: Fraud pattern detection ────────────────────────────
            logger.info("[%s] Stage 2 — fraud pattern analysis", case_id)
            fraud_result = self.fraud.run(parsed_documents=parsed_docs)

            result.findings = fraud_result.get("findings", [])
            result.high_finding_count = fraud_result.get("high_finding_count", 0)
            result.confidence_floor_met = fraud_result.get("confidence_floor_met", False)

            if not result.confidence_floor_met:
                result.status = "blocked"
                logger.warning(
                    "[%s] Confidence floor not met (%d HIGH findings). "
                    "Brief generation blocked.",
                    case_id, result.high_finding_count,
                )
                return result

            # ── Stage 3: Narrative generation ───────────────────────────────
            logger.info("[%s] Stage 3 — generating attorney brief", case_id)
            brief = self.narrative.run(
                findings=result.findings,
                tip_text=tip_text,
            )
            result.attorney_brief = brief
            result.status = "completed"
            logger.info("[%s] Pipeline complete.", case_id)

        except Exception as e:
            result.status = "failed"
            result.error = str(e)
            logger.exception("[%s] Pipeline failed: %s", case_id, e)

        return result
