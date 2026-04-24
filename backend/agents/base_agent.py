import json
import logging
import os
import re
from pathlib import Path

from groq import Groq

from app.core.config import settings

logger = logging.getLogger(__name__)

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"


class BaseAgent:
    """Shared Groq client + prompt loading + JSON parsing for all agents."""

    def __init__(self, prompt_file: str):
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = settings.groq_model
        self.prompt_template = (PROMPTS_DIR / prompt_file).read_text()
        self.prompt_version = prompt_file  # stored on every finding for provenance

    def _call_llm(self, user_message: str, temperature: float = 0.0) -> str:
        """Call Groq. temperature=0 → deterministic, fewer hallucinations."""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": user_message}],
            temperature=temperature,
            max_tokens=4096,
        )
        return response.choices[0].message.content

    def _parse_json(self, raw: str) -> dict:
        """
        Extract JSON from LLM output reliably.
        LLMs sometimes wrap JSON in markdown fences — this strips them.
        """
        # Strip markdown code fences if present
        cleaned = re.sub(r"^```(?:json)?\s*", "", raw.strip(), flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned.strip(), flags=re.MULTILINE)
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError as e:
            logger.error("JSON parse failed. Raw output:\n%s", raw)
            raise ValueError(f"LLM returned invalid JSON: {e}") from e

    def run(self, **kwargs) -> dict:
        raise NotImplementedError("Each agent must implement run()")
