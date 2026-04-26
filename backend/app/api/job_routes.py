"""
Job queue for async certificate generation.
POST /api/jobs/generate      -> starts a job, returns { job_id }
GET  /api/jobs/{job_id}      -> returns { status, progress, total, zip_url, error }
"""
from __future__ import annotations

import threading
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException, Request

from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

# In-memory job store (survives for the process lifetime on Render)
_JOBS: dict[str, dict[str, Any]] = {}
_JOBS_LOCK = threading.Lock()


def _get_job(job_id: str) -> dict[str, Any]:
    with _JOBS_LOCK:
        job = _JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


def _update_job(job_id: str, **kwargs) -> None:
    with _JOBS_LOCK:
        if job_id in _JOBS:
            _JOBS[job_id].update(kwargs)


@router.get("/{job_id}")
def get_job_status(job_id: str):
    return _get_job(job_id)


# This function is called from generate_certificates.py to run the job
def run_generate_job(job_id: str, generate_fn, *args, **kwargs):
    def _worker():
        try:
            _update_job(job_id, status="running")
            result = generate_fn(job_id=job_id, update_fn=_update_job, *args, **kwargs)
            _update_job(
                job_id,
                status="done",
                zip_url=result["zip_url"],
                certificates=result["certificates"],
            )
        except Exception as exc:
            _update_job(job_id, status="error", error=str(exc))

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()


def create_job() -> str:
    job_id = uuid.uuid4().hex
    with _JOBS_LOCK:
        _JOBS[job_id] = {
            "status": "queued",
            "progress": 0,
            "total": 0,
            "zip_url": None,
            "error": None,
        }
    return job_id
