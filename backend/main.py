import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import create_tables

logging.basicConfig(level=settings.log_level)

app = FastAPI(
    title="CaseFile AI",
    description="Whistleblower Fraud Intelligence Platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    os.makedirs(settings.upload_dir, exist_ok=True)
    await create_tables()


from app.api.v1 import cases, documents, findings, pipeline

app.include_router(cases.router,    prefix="/api/v1/cases",    tags=["cases"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["documents"])
app.include_router(findings.router,  prefix="/api/v1/findings",  tags=["findings"])
app.include_router(pipeline.router,  prefix="/api/v1/pipeline",  tags=["pipeline"])


@app.get("/health")
async def health():
    return {"status": "ok", "env": settings.environment}
