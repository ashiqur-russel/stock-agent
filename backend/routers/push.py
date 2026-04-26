from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

import config
from middleware.auth import get_current_user
from services.push_service import (
    delete_subscription,
    has_subscription,
    save_subscription,
)

router = APIRouter(prefix="/api/v1/push", tags=["push"])


class SubscribeRequest(BaseModel):
    endpoint: str
    keys: dict  # {"p256dh": "...", "auth": "..."}


class UnsubscribeRequest(BaseModel):
    endpoint: str


@router.get("/vapid-public-key")
def vapid_public_key():
    """Return the VAPID public key so the browser can subscribe."""
    if not config.VAPID_PUBLIC_KEY:
        raise HTTPException(503, "Push notifications not configured on this server")
    return {"public_key": config.VAPID_PUBLIC_KEY}


@router.post("/subscribe")
def subscribe(body: SubscribeRequest, user=Depends(get_current_user)):
    p256dh = body.keys.get("p256dh", "")
    auth = body.keys.get("auth", "")
    if not body.endpoint or not p256dh or not auth:
        raise HTTPException(400, "endpoint, keys.p256dh and keys.auth are required")
    save_subscription(user["user_id"], body.endpoint, p256dh, auth)
    return {"ok": True}


@router.delete("/unsubscribe")
def unsubscribe(body: UnsubscribeRequest, user=Depends(get_current_user)):
    delete_subscription(user["user_id"], body.endpoint)
    return {"ok": True}


@router.get("/status")
def status(user=Depends(get_current_user)):
    """Whether this user has at least one active push subscription."""
    return {
        "server_enabled": bool(config.VAPID_PUBLIC_KEY),
        "subscribed": has_subscription(user["user_id"]),
    }
