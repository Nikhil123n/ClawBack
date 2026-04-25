import json
import logging
from typing import List

from agents.base_agent import BaseAgent
from agents.cpt_benchmarks import build_benchmark_context, extract_cpt_counts

logger = logging.getLogger(__name__)

SEVERITY_RANK = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}


class FraudPatternAgent(BaseAgent):
    """
    Step 2 of the pipeline.
    Receives all extracted facts from all documents in a case,
    runs them against the fraud typology library, returns scored findings.
    """

    def __init__(self):
        super().__init__("fraud_pattern_v1.txt")

    def run(self, parsed_documents: List[dict]) -> dict:
        """
        parsed_documents: list of outputs from DocumentParserAgent.run()
        Returns findings sorted by severity, with confidence floor applied.
        """
        # Merge all facts from all documents into one evidence bundle
        all_facts = []
        all_transactions = []
        for doc in parsed_documents:
            all_facts.extend(doc.get("key_facts", []))
            all_transactions.extend(doc.get("transactions", []))

        # Build peer benchmark context from CPT codes found in transactions
        cpt_counts = extract_cpt_counts(all_transactions)
        benchmark_context, deviation_map = build_benchmark_context(cpt_counts)

        extracted_facts = json.dumps({
            "key_facts": all_facts,
            "transactions": all_transactions,
        }, indent=2)

        prompt = self.prompt_template.replace("{extracted_facts}", extracted_facts)
        prompt = prompt.replace("{peer_benchmark_context}", benchmark_context or "No CPT codes detected in transactions.")

        raw = self._call_llm(prompt)
        result = self._parse_json(raw)

        findings = result.get("findings", [])

        # Remove LOW confidence findings (< 0.4) — reduce noise
        findings = [f for f in findings if f.get("confidence", 0) >= 0.4]

        # Hard enforcement: HIGH is only valid for DOCUMENT_EVIDENCE
        # If the LLM ignores the prompt rule, we catch it here
        for f in findings:
            source = f.get("source_type", "DOCUMENT_EVIDENCE")
            if f.get("severity") == "HIGH" and source != "DOCUMENT_EVIDENCE":
                logger.warning(
                    "Downgraded finding from HIGH to MEDIUM: source_type=%s citation=%s",
                    source, f.get("citation", "")[:80],
                )
                f["severity"] = "MEDIUM"
                f["verification_status"] = "unverified"

        # Default source/verification fields if LLM omitted them
        for f in findings:
            f.setdefault("source_type", "DOCUMENT_EVIDENCE")
            f.setdefault("verification_status", "document_supported")

        # Attach peer benchmark data to findings whose citation mentions a known CPT code
        if deviation_map:
            import re
            _cpt_re = re.compile(r'\b(\d{5})\b')
            for f in findings:
                citation_text = f.get("citation", "") + " " + f.get("description", "")
                for match in _cpt_re.finditer(citation_text):
                    code = match.group(1)
                    if code in deviation_map:
                        f["peer_benchmark"] = deviation_map[code]
                        break
            # Also attach to any duplicate_billing finding if any outlier CPT exists
            outliers = {c: d for c, d in deviation_map.items() if (d.get("deviation_multiplier") or 0) >= 2.0}
            for f in findings:
                if f.get("fraud_type") == "duplicate_billing" and "peer_benchmark" not in f and outliers:
                    top = max(outliers.values(), key=lambda x: x.get("deviation_multiplier", 0))
                    f["peer_benchmark"] = top

        # Sort by severity then confidence
        findings.sort(
            key=lambda f: (SEVERITY_RANK.get(f.get("severity", "LOW"), 0), f.get("confidence", 0)),
            reverse=True,
        )

        high_count = sum(1 for f in findings if f.get("severity") == "HIGH")

        result["findings"] = findings
        result["high_finding_count"] = high_count
        result["confidence_floor_met"] = high_count >= 1  # MVP: 1 HIGH required
        result["prompt_version"] = self.prompt_version
        result["model_version"] = self.model
        return result
