import os
import time
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from lib.db import db
from lib.ownerlog import log_event

router = APIRouter(prefix="/owner")

# Brute-force protection: 5 failed codes per IP within 15 minutes locks that IP for the window.
_attempts: dict[str, list[float]] = {}
MAX_FAILS = 5
WINDOW_S = 900
TOKEN_TTL_MIN = 30


def _jwt_secret() -> str:
    secret = os.environ.get("OWNER_JWT_SECRET") or os.environ.get("WEBHOOK_SECRET")
    if not secret:
        raise HTTPException(status_code=503, detail="Owner auth is not configured on this deployment")
    return secret


def _owner_code() -> str:
    code = os.environ.get("OWNER_CODE")
    if not code:
        raise HTTPException(status_code=503, detail="Owner access code is not configured on this deployment")
    return code


class UnlockRequest(BaseModel):
    code: str


class UnlockResponse(BaseModel):
    token: str
    expires_in: int


@router.post("/unlock", response_model=UnlockResponse)
async def unlock(req: UnlockRequest, request: Request):
    ip = request.client.host if request.client else "unknown"
    now = time.time()
    fails = [t for t in _attempts.get(ip, []) if now - t < WINDOW_S]
    if len(fails) >= MAX_FAILS:
        raise HTTPException(status_code=429, detail="Too many attempts — locked for 15 minutes")
    if req.code != _owner_code():
        fails.append(now)
        _attempts[ip] = fails
        raise HTTPException(status_code=401, detail="Invalid access code")
    _attempts.pop(ip, None)
    exp = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_TTL_MIN)
    token = jwt.encode({"sub": "owner", "type": "access", "exp": exp}, _jwt_secret(), algorithm="HS256")
    await log_event("owner_unlock", "Owner panel unlocked")
    return UnlockResponse(token=token, expires_in=TOKEN_TTL_MIN * 60)


def _verify(request: Request) -> None:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else ""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if payload.get("sub") != "owner":
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/logs")
async def get_logs(request: Request):
    _verify(request)
    docs = await db.owner_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(50)
    return {"logs": docs, "notify": bool(os.environ.get("OWNER_WEBHOOK"))}
