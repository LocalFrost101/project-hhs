import base64
import hashlib
import os
import re

import httpx
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import APIRouter, HTTPException, Request, Response
from pydantic import BaseModel

from lib.db import db
from lib.ownerlog import log_event

router = APIRouter()

WEBHOOK_RE = re.compile(r"^https://(?:(?:canary|ptb)\.)?discord(?:app)?\.com/api/webhooks/\d+/[\w-]+/?$")


def _key() -> bytes:
    secret = os.environ.get("WEBHOOK_SECRET")
    if not secret:
        raise HTTPException(status_code=503, detail="WEBHOOK_SECRET is not configured on this deployment")
    return hashlib.sha256(secret.encode()).digest()


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _b64url_decode(token: str) -> bytes:
    return base64.urlsafe_b64decode(token + "=" * (-len(token) % 4))


class ProtectRequest(BaseModel):
    url: str


class ProtectResponse(BaseModel):
    token: str
    proxy_url: str


@router.post("/protect", response_model=ProtectResponse)
async def protect(req: ProtectRequest, request: Request):
    url = req.url.strip()
    if not WEBHOOK_RE.match(url):
        raise HTTPException(status_code=400, detail="Not a valid Discord webhook URL")
    nonce = os.urandom(12)
    ciphertext = AESGCM(_key()).encrypt(nonce, url.encode(), None)
    token = _b64url_encode(nonce + ciphertext)
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    proto = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("x-forwarded-host", request.headers.get("host", ""))
    await log_event("webhook_protected", f"New proxy issued · token `{token[:10]}…`", token_hash)
    return ProtectResponse(token=token, proxy_url=f"{proto}://{host}/api/hook/{token}")


@router.post("/hook/{token}")
async def hook(token: str, request: Request):
    try:
        raw = _b64url_decode(token)
        url = AESGCM(_key()).decrypt(raw[:12], raw[12:], None).decode()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or corrupted token")
    if not WEBHOOK_RE.match(url):
        raise HTTPException(status_code=400, detail="Invalid token payload")
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    if await db.revoked_tokens.find_one({"token_hash": token_hash}):
        raise HTTPException(status_code=403, detail="Token revoked by owner")
    if request.url.query:
        url = f"{url}?{request.url.query}"
    body = await request.body()
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, content=body, headers={"Content-Type": "application/json"})
    await log_event("hook_relay", f"Token `{token[:10]}…` → Discord {resp.status_code}", token_hash)
    return Response(
        content=resp.content or b"{}",
        status_code=resp.status_code,
        media_type="application/json",
    )
