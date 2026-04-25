# CaseFile AI — Fraud Intelligence Platform

An AI-powered multi-agent platform for False Claims Act (FCA) whistleblower fraud investigations. Automatically parses case documents, detects fraud patterns, classifies evidence, and produces attorney-ready briefs with human-in-the-loop approval.

---

## What It Does

1. **Upload documents** — PDF, DOCX, TXT, or CSV case files
2. **Run the pipeline** — 3-agent DAG processes every document in parallel
3. **Review findings** — each finding is severity-graded, evidence-classified, and citation-backed
4. **Attorney approval gate** — an AI-drafted brief is held behind a human approve/reject decision before delivery

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI 0.111 · SQLAlchemy 2.0 async · asyncpg |
| Database | Neon (cloud PostgreSQL) |
| LLM | Groq — `llama-3.3-70b-versatile` (temperature = 0) |
| Document parsing | PyMuPDF (PDF) · python-docx (DOCX) |
| Auth | JWT via python-jose + passlib/bcrypt |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · React Router v6 |
| Deployment | Vercel (Python runtime + static build) |

---

## Agent Pipeline

```
Document Upload
      │
      ▼
┌─────────────────┐
│  Stage 1        │  DocumentParserAgent  ×  (one per file, parallel)
│  Parse Docs     │  → extracts structured facts + transactions
│                 │  → tags every fact with source_file
└────────┬────────┘
         │  merged fact list
         ▼
┌─────────────────┐
│  Stage 2        │  FraudPatternAgent
│  Detect Fraud   │  → identifies fraud typologies per FCA
│                 │  → classifies each finding by evidence source
│                 │  → enforces HIGH severity only for DOCUMENT_EVIDENCE
└────────┬────────┘
         │  findings + confidence_floor_met flag
         ▼
┌─────────────────┐   (skipped if no HIGH evidence-backed findings)
│  Stage 3        │  NarrativeGeneratorAgent
│  Draft Brief    │  → attorney-ready executive summary
│                 │  → allegations with statutory basis
│                 │  → recommended next steps
└────────┬────────┘
         │
         ▼
   ReviewGate  →  Approve / Reject
```

### Anti-Hallucination Architecture

- `temperature=0` on all LLM calls
- Prompts instruct citation-only output (no inferred facts)
- JSON fence stripping + strict schema validation on every response
- Confidence < 0.4 findings are dropped
- **Hard Python enforcement**: any `HIGH` severity finding that is not `DOCUMENT_EVIDENCE` is downgraded to `MEDIUM` regardless of what the LLM outputs

---

## Evidence Classification

Every finding carries two classification fields:

| Field | Values |
|---|---|
| `source_type` | `DOCUMENT_EVIDENCE` · `TIP_ALLEGATION` · `AI_INFERENCE` |
| `verification_status` | `document_supported` · `ai_inferred` · `unverified` |

Only `DOCUMENT_EVIDENCE` findings can reach `HIGH` severity. This is enforced in the prompt **and** in Python code.

---

## Fraud Typologies Detected

- Phantom Billing
- Duplicate Billing
- Upcoding
- Unbundling
- Kickbacks
- Medically Unnecessary Services
- Identity Theft
- Corporate Shell Schemes

---

## Case Status State Machine

```
intake → processing → review_pending → approved
                   ↘              ↘→ rejected
                    → blocked (no HIGH evidence-backed findings)
                    → failed (pipeline error)
```

---

## Project Structure

```
Clawback/
├── backend/
│   ├── agents/
│   │   ├── base_agent.py          # shared Groq client + JSON parser
│   │   ├── document_parser.py     # Stage 1 — extract facts from files
│   │   ├── fraud_pattern.py       # Stage 2 — detect + classify fraud
│   │   ├── narrative_generator.py # Stage 3 — draft attorney brief
│   │   └── orchestrator.py        # DAG runner + PipelineResult
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── cases.py           # CRUD for cases
│   │   │   ├── documents.py       # file upload + list
│   │   │   ├── findings.py        # findings retrieval
│   │   │   └── pipeline.py        # run + status endpoints
│   │   ├── core/
│   │   │   ├── config.py          # Pydantic settings from .env
│   │   │   ├── database.py        # async engine + idempotent migrations
│   │   │   └── security.py        # JWT helpers
│   │   ├── models/                # SQLAlchemy ORM models
│   │   ├── schemas/               # Pydantic request/response schemas
│   │   └── services/              # business logic layer
│   ├── prompts/
│   │   ├── document_parser_v1.txt
│   │   ├── fraud_pattern_v1.txt   # defines evidence classification rules
│   │   └── narrative_v1.txt
│   ├── main.py                    # FastAPI app + CORS + startup
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/                   # App.tsx routing
│       ├── features/
│       │   ├── cases/             # CasesPage, CaseDetail, NewCaseForm
│       │   ├── documents/         # drag-and-drop upload + list
│       │   ├── findings/          # FindingCard with confidence bar
│       │   └── review/            # ReviewGate (attorney approval)
│       ├── services/              # typed API clients
│       └── shared/                # types, components, hooks, utils
├── api/index.py                   # Vercel Python entrypoint
├── vercel.json                    # Vercel build + routing config
└── docker/                        # Docker Compose (local dev)
```

---

## Local Development

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Neon](https://neon.tech) PostgreSQL database
- A [Groq](https://console.groq.com) API key

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# create backend/.env
cp ../.env.example backend/.env
# fill in DATABASE_URL, GROQ_API_KEY, SECRET_KEY

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # starts on :5173 (proxies /api → :8000)
```

### Environment Variables

```env
DATABASE_URL=postgresql+asyncpg://<user>:<pass>@<host>/<db>?ssl=require
GROQ_API_KEY=gsk_...
SECRET_KEY=<random-hex-string>
UPLOAD_DIR=uploads
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/cases` | List all cases |
| `POST` | `/api/v1/cases` | Create new case |
| `GET` | `/api/v1/cases/{id}` | Get case by ID |
| `PATCH` | `/api/v1/cases/{id}/approve` | Approve or reject after review |
| `POST` | `/api/v1/documents/{case_id}/upload` | Upload a document |
| `GET` | `/api/v1/documents/{case_id}` | List documents for a case |
| `GET` | `/api/v1/findings/{case_id}` | List findings (ordered by confidence) |
| `POST` | `/api/v1/pipeline/{case_id}/run` | Trigger the agent pipeline |
| `GET` | `/api/v1/pipeline/{case_id}/status` | Poll pipeline status + brief |

---

## Deployment (Vercel)

```bash
# from project root
vercel --prod
```

Set environment variables in the Vercel dashboard under **Settings → Environment Variables**:
- `DATABASE_URL`
- `GROQ_API_KEY`
- `SECRET_KEY`

The `vercel.json` routes `/api/*` to the Python runtime and all other paths to the React static build.

---

## Key Design Decisions

**Why Groq?** Llama 3.3 70B via Groq gives near-zero inference latency, which keeps the pipeline fast enough for a real-time UI with live polling.

**Why temperature=0?** Fraud evidence requires deterministic, reproducible outputs. Non-zero temperature introduces fabricated details that cannot be citation-verified.

**Why a human approval gate?** The FCA requires attorney certification of whistleblower submissions. The `ReviewGate` component enforces this as a hard UI block — the brief is never delivered to the case record without explicit approve/reject.

**Why no Alembic?** For MVP speed, schema migrations are idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements that run on every server startup. Alembic can replace this as the schema stabilises.
