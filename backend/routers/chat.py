from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from middleware.auth import get_current_user
from services.agent_service import stream_agent_response
from services.ai_quota import get_groq_quota_snapshot, user_ai_chat_allowed

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


class ChatRequest(BaseModel):
    messages: list[dict]
    """Must match the in-app currency toggle: EUR (€) or USD ($)."""
    currency: str = "EUR"


@router.get("/quota")
def chat_quota(user=Depends(get_current_user)):
    """Fair-share Groq usage and limits for the current user (when quota is enabled)."""
    return get_groq_quota_snapshot(user["user_id"])


@router.post("")
async def chat(body: ChatRequest, user=Depends(get_current_user)):
    if not user_ai_chat_allowed(user["user_id"]):
        raise HTTPException(
            status_code=403,
            detail="AI chat is disabled in your settings. Enable it under Settings → AI advisor.",
        )
    c = (body.currency or "EUR").upper()
    if c not in ("EUR", "USD"):
        c = "EUR"
    return StreamingResponse(
        stream_agent_response(body.messages, user["user_id"], currency=c),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
