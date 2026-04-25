from fastapi import APIRouter, Depends, Query

from middleware.auth import get_current_user
from services import market_data

router = APIRouter(prefix="/api/v1/market", tags=["market"])


@router.get("/quote/{ticker}")
def get_quote(ticker: str, user=Depends(get_current_user)):
    return market_data.fetch_quote(ticker.upper())


@router.get("/history/{ticker}")
def get_history(
    ticker: str,
    period: str = Query("3mo"),
    interval: str = Query("1d"),
    user=Depends(get_current_user),
):
    return market_data.fetch_ohlcv(ticker.upper(), period, interval)


@router.get("/news/{ticker}")
def get_news(ticker: str, user=Depends(get_current_user)):
    return market_data.fetch_news(ticker.upper())
