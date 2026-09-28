import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from lib.db import db
from routers.owner import _verify

router = APIRouter()

TTL_DAYS = 30
MAX_SOURCE = 200_000


class ScriptUpload(BaseModel):
    source: str


@router.post("/scripts")
async def upload_script(req: ScriptUpload):
    source = req.source
    if not source or len(source) > MAX_SOURCE:
        raise HTTPException(status_code=400, detail="Invalid source")
    now = datetime.now(timezone.utc)
    doc = {
        "id": str(uuid.uuid4()),
        "source": source,
        "size": len(source),
        "created_at": now.isoformat(),
        "expires_at": now + timedelta(days=TTL_DAYS),
    }
    await db.owner_scripts.insert_one(doc)
    return {"id": doc["id"], "expires_in_days": TTL_DAYS}


@router.get("/scripts")
async def list_scripts(request: Request):
    _verify(request)
    docs = await db.owner_scripts.find(
        {}, {"_id": 0, "id": 1, "source": 1, "size": 1, "created_at": 1}
    ).sort("created_at", -1).to_list(50)
    return {"scripts": docs, "retention_days": TTL_DAYS}
