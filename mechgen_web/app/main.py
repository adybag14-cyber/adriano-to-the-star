from __future__ import annotations

import asyncio
import json
import os
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

import sys

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field


try:
    from mechgen.engine import health as mechgen_health
    from mechgen.engine import run_attempt as mechgen_run_attempt
    from mechgen.engine import write_json_atomic as mechgen_write_json_atomic
except Exception:
    REPO_ROOT = Path(__file__).resolve().parents[2]
    MECHGEN_PROJECT_DIR = REPO_ROOT / "mechgen"
    if MECHGEN_PROJECT_DIR.exists():
        sys.path.insert(0, str(MECHGEN_PROJECT_DIR))
    else:
        sys.path.insert(0, str(REPO_ROOT))
    from mechgen.engine import health as mechgen_health
    from mechgen.engine import run_attempt as mechgen_run_attempt
    from mechgen.engine import write_json_atomic as mechgen_write_json_atomic

load_dotenv()
NODE_ENV = os.getenv("NODE_ENV", "development")

ROOT_DIR = Path(__file__).resolve().parents[1]
RUNS_DIR = ROOT_DIR / "runs"
STATIC_DIR = Path(__file__).resolve().parent / "static"

RUNS_DIR.mkdir(parents=True, exist_ok=True)

JOB_ID_RE = re.compile(r"^[0-9a-f]{32}$")

app = FastAPI(title="MechGen Web", version="0.1.0")

# CORS Configuration
allow_origins = os.getenv("CORS_ALLOW_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


class PredictRequest(BaseModel):
    reactants: str = Field(..., min_length=1)
    conditions: str | None = None
    input_kind: Literal["auto", "smiles", "english"] = "auto"


class ExplainRequest(BaseModel):
    reactants: str = Field(..., min_length=1)
    products: str = Field(..., min_length=1)
    conditions: str | None = None
    input_kind: Literal["auto", "smiles", "english"] = "auto"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _write_json(path: Path, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(obj, indent=2, ensure_ascii=False), encoding="utf-8")
    tmp.replace(path)


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _validate_job_id(job_id: str) -> None:
    if not JOB_ID_RE.match(job_id):
        raise HTTPException(status_code=400, detail="Invalid job_id")


def _job_dir(job_id: str) -> Path:
    _validate_job_id(job_id)
    return RUNS_DIR / job_id


def _ensure_job_exists(job_id: str) -> Path:
    d = _job_dir(job_id)
    if not d.exists():
        raise HTTPException(status_code=404, detail="Job not found")
    return d


def _execute_job(job_id: str) -> None:
    d = _job_dir(job_id)
    request_path = d / "request.json"
    status_path = d / "status.json"
    result_path = d / "result.json"

    req = _read_json(request_path)
    mode = req.get("mode")
    payload = req.get("payload", {})

    _write_json(
        status_path,
        {
            "job_id": job_id,
            "mode": mode,
            "state": "running",
            "created_at": req.get("created_at"),
            "updated_at": _now_iso(),
        },
    )

    try:
        result = mechgen_run_attempt(
            mode=str(mode),
            reactants=str(payload.get("reactants", "")),
            products=str(payload.get("products")) if payload.get("products") is not None else None,
            conditions=str(payload.get("conditions")) if payload.get("conditions") is not None else None,
            input_kind=str(payload.get("input_kind", "auto")),
            out_dir=d,
        )

        result = {"job_id": job_id, **result}

        for st in result.get("steps", []):
            try:
                idx = int(st.get("index", 0))
            except Exception:
                idx = 0
            st["image_url"] = f"/api/jobs/{job_id}/unverified/steps/{idx}.png"

        mechgen_write_json_atomic(result_path, result)

        _write_json(
            status_path,
            {
                "job_id": job_id,
                "mode": mode,
                "state": "succeeded",
                "created_at": req.get("created_at"),
                "updated_at": _now_iso(),
                "verified": False,
                "status": "unverified",
            },
        )

    except Exception as e:
        fatal_error = "Fatal error" if NODE_ENV == "production" else f"Fatal error: {e}"
        result = {
            "job_id": job_id,
            "mode": str(mode),
            "verified": False,
            "status": "fatal",
            "errors": [fatal_error],
            "steps": [
                {
                    "index": 0,
                    "title": "Mechanism attempt failed",
                    "description": "See errors",
                    "image_url": f"/api/jobs/{job_id}/unverified/steps/0.png",
                }
            ],
        }
        mechgen_write_json_atomic(result_path, result)

        _write_json(
            status_path,
            {
                "job_id": job_id,
                "mode": mode,
                "state": "failed",
                "created_at": req.get("created_at"),
                "updated_at": _now_iso(),
                "verified": False,
                "status": "fatal",
            },
        )


async def _run_job(job_id: str) -> None:
    await asyncio.to_thread(_execute_job, job_id)


def _create_job(mode: str, payload: dict[str, Any]) -> str:
    job_id = uuid.uuid4().hex
    d = RUNS_DIR / job_id
    d.mkdir(parents=True, exist_ok=False)

    req = {"job_id": job_id, "mode": mode, "payload": payload, "created_at": _now_iso()}
    _write_json(d / "request.json", req)

    _write_json(
        d / "status.json",
        {
            "job_id": job_id,
            "mode": mode,
            "state": "queued",
            "created_at": req["created_at"],
            "updated_at": req["created_at"],
        },
    )

    return job_id


@app.get("/", response_class=HTMLResponse)
def index() -> HTMLResponse:
    index_path = STATIC_DIR / "index.html"
    if not index_path.exists():
        raise HTTPException(status_code=500, detail="UI not found")
    return HTMLResponse(index_path.read_text(encoding="utf-8"))


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"ok": True, **mechgen_health()}


@app.post("/api/predict")
async def api_predict(req: PredictRequest) -> dict[str, str]:
    job_id = _create_job("predict", req.model_dump())
    asyncio.create_task(_run_job(job_id))
    return {"job_id": job_id}


@app.post("/api/explain")
async def api_explain(req: ExplainRequest) -> dict[str, str]:
    job_id = _create_job("explain", req.model_dump())
    asyncio.create_task(_run_job(job_id))
    return {"job_id": job_id}


@app.get("/api/jobs/{job_id}")
def api_job_status(job_id: str) -> dict[str, Any]:
    d = _ensure_job_exists(job_id)
    status_path = d / "status.json"
    if not status_path.exists():
        raise HTTPException(status_code=404, detail="status.json not found")
    status = _read_json(status_path)
    status["has_result"] = (d / "result.json").exists()
    return status


@app.get("/api/jobs/{job_id}/result.json")
def api_job_result(job_id: str) -> JSONResponse:
    d = _ensure_job_exists(job_id)
    p = d / "result.json"
    if not p.exists():
        raise HTTPException(status_code=404, detail="result.json not found")
    result = _read_json(p)
    if NODE_ENV == "production" and isinstance(result, dict):
        result.pop("diagnostics", None)
        steps = result.get("steps")
        if isinstance(steps, list):
            for st in steps:
                if isinstance(st, dict):
                    st.pop("image_path", None)

        raw_errors = result.get("errors")
        status = str(result.get("status", ""))
        if status == "fatal":
            result["errors"] = ["An error occurred while processing this job."]
        else:
            safe_errors: list[str] = []
            if isinstance(raw_errors, list):
                for msg in raw_errors:
                    if not isinstance(msg, str):
                        continue
                    msg = msg.strip()
                    if msg.startswith("Mechanism is not verified:"):
                        safe_errors.append(msg)
            result["errors"] = safe_errors
    return JSONResponse(content=result)


@app.get("/api/jobs/{job_id}/steps/{n}.png")
def api_job_step_verified(job_id: str, n: int) -> FileResponse:
    d = _ensure_job_exists(job_id)
    p = d / "steps" / f"{n}.png"
    if not p.exists():
        raise HTTPException(status_code=404, detail="step not found")
    return FileResponse(path=str(p), media_type="image/png")


@app.get("/api/jobs/{job_id}/unverified/steps/{n}.png")
def api_job_step_unverified(job_id: str, n: int) -> FileResponse:
    d = _ensure_job_exists(job_id)
    p = d / "unverified" / "steps" / f"{n}.png"
    if not p.exists():
        raise HTTPException(status_code=404, detail="step not found")
    return FileResponse(path=str(p), media_type="image/png")
