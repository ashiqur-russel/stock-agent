"""Unauthenticated endpoints for the marketing landing page (cached, read-only)."""

from __future__ import annotations

import time

from fastapi import APIRouter

from services import market_data

router = APIRouter(prefix="/api/v1/public", tags=["public"])

# Must match frontend `LANDING_TICKERS` in app/page.tsx
LANDING_TICKERS: tuple[str, ...] = (
    "AAPL",
    "TSLA",
    "NVDA",
    "MSFT",
    "GOOGL",
    "AMZN",
    "META",
    "BTC-USD",
    "ETH-USD",
    "SPY",
    "QQQ",
    "AMD",
)

_CACHE: dict = {"t": 0.0, "payload": None}
_TTL_SEC = 45.0


@router.get("/landing-quotes")
def get_landing_quotes() -> dict:
    """Batch quotes for the home page ticker (yfinance; short server-side cache)."""
    now = time.time()
    if _CACHE["payload"] is not None and now - _CACHE["t"] < _TTL_SEC:
        return _CACHE["payload"]

    quotes: list[dict] = []
    for sym in LANDING_TICKERS:
        try:
            q = market_data.fetch_quote(sym)
            price = float(q.get("current_price_usd") or 0)
            if price <= 0:
                raise ValueError("no price")
            quotes.append({**q, "ok": True})
        except Exception:
            quotes.append({"ticker": sym.upper(), "ok": False})

    payload = {"quotes": quotes, "cache_ttl_sec": int(_TTL_SEC)}
    _CACHE["t"] = now
    _CACHE["payload"] = payload
    return payload
