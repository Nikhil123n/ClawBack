import logging
from typing import Optional, Tuple

import fitz  # PyMuPDF
from docx import Document as DocxDocument

from agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)


class DocumentParserAgent(BaseAgent):
    """
    Step 1 of the pipeline.
    Extracts raw text from a file, then uses the LLM to structure it
    into entities, transactions, and key facts — each with citations.
    """

    def __init__(self):
        super().__init__("document_parser_v1.txt")

    # ── Text extraction (no LLM involved — deterministic) ────────────────────

    def extract_text(self, file_path: str, doc_type: str) -> Tuple[str, Optional[int]]:
        """Returns (raw_text, page_count). Pure file parsing, no AI."""
        if doc_type == "pdf":
            return self._extract_pdf(file_path)
        elif doc_type in ("docx", "doc"):
            return self._extract_docx(file_path), None
        elif doc_type in ("txt", "csv"):
            text = open(file_path, encoding="utf-8", errors="ignore").read()
            return text, None
        else:
            raise ValueError(f"Unsupported doc type: {doc_type}")

    def _extract_pdf(self, path: str) -> Tuple[str, int]:
        doc = fitz.open(path)
        pages = [page.get_text() for page in doc]
        return "\n\n--- PAGE BREAK ---\n\n".join(pages), len(pages)

    def _extract_docx(self, path: str) -> str:
        doc = DocxDocument(path)
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

    # ── LLM analysis ─────────────────────────────────────────────────────────

    def run(self, document_text: str, filename: str) -> dict:
        """
        Takes raw extracted text, returns structured facts with citations.
        Truncates to 12k chars to stay within context — sufficient for most docs.
        """
        truncated = document_text[:12000]
        if len(document_text) > 12000:
            logger.warning("Document '%s' truncated to 12k chars for LLM context", filename)

        prompt = self.prompt_template.replace("{document_text}", truncated)
        raw = self._call_llm(prompt)
        result = self._parse_json(raw)

        # Inject source filename into every citation for traceability
        for fact in result.get("key_facts", []):
            fact["source_file"] = filename
        for txn in result.get("transactions", []):
            txn["source_file"] = filename

        result["prompt_version"] = self.prompt_version
        result["model_version"] = self.model
        return result
