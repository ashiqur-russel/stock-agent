from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from middleware.auth import get_current_user
from services.agent_service import stream_agent_response

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


class ChatRequest(BaseModel):
    messages: list[dict]
    """Must match the in-app currency toggle: EUR (€) or USD ($)."""
    currency: str = "EUR"


@router.post("")
async def chat(body: ChatRequest, user=Depends(get_current_user)):
    c = (body.currency or "EUR").upper()
    if c not in ("EUR", "USD"):
        c = "EUR"
    return StreamingResponse(
        stream_agent_response(body.messages, user["user_id"], currency=c),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
