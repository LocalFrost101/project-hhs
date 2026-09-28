import os
import uuid
from datetime import datetime, timezone

import httpx

from lib.db import db


async def log_event(event: str, detail: str) -> None:
    """Record an owner-visible event: Mongo history (when available) + Discord webhook ping."""
    ts = datetime.now(timezone.utc).isoformat()
    try:
        await db.owner_logs.insert_one(
            {"id": str(uuid.uuid4()), "event": event, "detail": detail, "timestamp": ts}
        )
    except Exception:
        pass
    hook = os.environ.get("OWNER_WEBHOOK")
    if hook:
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(
                    hook,
                    json={
                        "embeds": [
                            {
                                "title": f"BLUES DET · {event}",
                                "description": detail,
                                "color": 3716088,
                                "footer": {"text": ts},
                            }
                        ]
                    },
                )
        except Exception:
            pass
