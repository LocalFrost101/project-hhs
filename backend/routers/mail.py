import httpx
from fastapi import APIRouter, Request, Response

router = APIRouter()

UPSTREAM = "https://api.mail.tm"


@router.api_route("/mail/{path:path}", methods=["GET", "POST", "DELETE"])
async def mail_proxy(path: str, request: Request):
    # Thin pass-through to the keyless disposable-mail API so browser CORS can't block it.
    headers = {"Accept": "application/json"}
    auth = request.headers.get("authorization")
    if auth:
        headers["Authorization"] = auth
    body = await request.body()
    if body:
        headers["Content-Type"] = "application/json"
    query = f"?{request.url.query}" if request.url.query else ""
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.request(
            request.method,
            f"{UPSTREAM}/{path}{query}",
            content=body or None,
            headers=headers,
        )
    return Response(content=resp.content, status_code=resp.status_code, media_type="application/json")
