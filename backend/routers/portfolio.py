import asyncio

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from middleware.auth import get_current_user
from services import portfolio_service
from services.portfolio_service import OversellError

router = APIRouter(prefix="/api/v1/portfolio", tags=["portfolio"])


class TransactionRequest(BaseModel):
    ticker: str
    type: str
    shares: float
    price: float
    executed_at: str
    notes: str = None


@router.get("")
async def get_portfolio(user=Depends(get_current_user)):
    # Heaviest endpoint in the app (quote fetches + swing analysis per holding);
    # run on the default executor so it never starves the sync-endpoint pool.
    return await asyncio.to_thread(portfolio_service.get_portfolio_for_user, user["user_id"])


@router.get("/transactions")
def get_transactions(user=Depends(get_current_user)):
    return portfolio_service.get_transactions(user["user_id"])


@router.post("/transaction", status_code=201)
def add_transaction(body: TransactionRequest, user=Depends(get_current_user)):
    if body.type not in ("BUY", "SELL"):
        raise HTTPException(status_code=400, detail="type must be BUY or SELL")
    if body.shares <= 0 or body.price <= 0:
        raise HTTPException(status_code=400, detail="shares and price must be positive")
    try:
        return portfolio_service.add_transaction(
            user_id=user["user_id"],
            ticker=body.ticker.upper(),
            tx_type=body.type,
            shares=body.shares,
            price=body.price,
            executed_at=body.executed_at,
            notes=body.notes,
        )
    except OversellError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/transaction/{tx_id}")
def update_transaction(tx_id: int, body: TransactionRequest, user=Depends(get_current_user)):
    if body.type not in ("BUY", "SELL"):
        raise HTTPException(status_code=400, detail="type must be BUY or SELL")
    if body.shares <= 0 or body.price <= 0:
        raise HTTPException(status_code=400, detail="shares and price must be positive")
    try:
        updated = portfolio_service.update_transaction(
            tx_id=tx_id,
            user_id=user["user_id"],
            ticker=body.ticker.upper(),
            tx_type=body.type,
            shares=body.shares,
            price=body.price,
            executed_at=body.executed_at,
            notes=body.notes,
        )
    except OversellError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not updated:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"updated": True}


@router.delete("/transaction/{tx_id}")
def delete_transaction(tx_id: int, user=Depends(get_current_user)):
    try:
        deleted = portfolio_service.delete_transaction(tx_id, user["user_id"])
    except OversellError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Deleting this BUY would orphan a later SELL: {e}",
        )
    if not deleted:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"deleted": True}
