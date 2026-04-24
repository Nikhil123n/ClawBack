import sys
import os

# Make backend/ importable from Vercel's serverless runtime
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from main import app  # noqa: F401 — Vercel picks up the `app` symbol
