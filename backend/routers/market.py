import asyncio

from fastapi import APIRouter, Depends, Query

from middleware.auth import get_current_user
from services import market_data
from services.user_prefs import get_user_market_region
from utils.validation import normalize_ticker

router = APIRouter(prefix="/api/v1/market", tags=["market"])

# Endpoints are async + to_thread: each request does multiple blocking yfinance
# HTTP calls, and running them on the default executor keeps the shared
# sync-endpoint threadpool free under concurrent load.


@router.get("/quote/{ticker}")
async def get_quote(ticker: str, user=Depends(get_current_user)):
    symbol = normalize_ticker(ticker)
    region = await asyncio.to_thread(get_user_market_region, user["user_id"])
    return await asyncio.to_thread(market_data.fetch_quote, symbol, region)


@router.get("/history/{ticker}")
async def get_history(
    ticker: str,
    period: str = Query("3mo"),
    interval: str = Query("1d"),
    currency: str = Query(
        "EUR",
        description="EUR: convert Yahoo USD OHLC with spot rate; USD: raw Yahoo USD (matches US portals better)",
    ),
    user=Depends(get_current_user),
):
    symbol = normalize_ticker(ticker)
    ccy = (currency or "EUR").upper()
    if ccy not in ("EUR", "USD"):
        ccy = "EUR"
    return await asyncio.to_thread(
        market_data.fetch_ohlcv, symbol, period, interval, target_ccy=ccy
    )


@router.get("/news/{ticker}")
async def get_news(ticker: str, user=Depends(get_current_user)):
    symbol = normalize_ticker(ticker)
    return await asyncio.to_thread(market_data.fetch_news, symbol)
