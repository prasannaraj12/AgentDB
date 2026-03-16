import os
import json
import uuid
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

SHARES_FILE = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "databases", "shares.json"
)


def _load_shares() -> dict:
    if os.path.exists(SHARES_FILE):
        try:
            with open(SHARES_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def _save_shares(data: dict):
    with open(SHARES_FILE, "w") as f:
        json.dump(data, f)


shared_dashboards: dict = _load_shares()


class ShareRequest(BaseModel):
    charts: list
    title: str = "Shared Dashboard"


@router.post("")
async def create_share(request: ShareRequest):
    token = uuid.uuid4().hex[:10]
    shared_dashboards[token] = {
        "charts": request.charts,
        "title": request.title,
        "created_at": __import__('datetime').datetime.utcnow().isoformat()
    }
    _save_shares(shared_dashboards)
    return {"token": token, "url": f"/share/{token}"}


@router.get("/{token}")
async def get_share(token: str):
    if token not in shared_dashboards:
        raise HTTPException(status_code=404, detail="Shared dashboard not found.")
    return shared_dashboards[token]
