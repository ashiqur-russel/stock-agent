"""Shared request-input validation helpers."""

from __future__ import annotations

import re

from fastapi import HTTPException

# Yahoo-style symbols: letters/digits plus . - ^ = separators
# (e.g. AAPL, BMW.DE, BRK-B, ^GDAXI, EURUSD=X).
_TICKER_RE = re.compile(r"^[A-Z0-9][A-Z0-9.\-^=]{0,14}$")


def normalize_ticker(raw: str) -> str:
    """Uppercase and validate a user-supplied ticker symbol.

    Raises HTTP 400 for anything that is not a plausible exchange symbol, so
    arbitrary strings never reach yfinance or get stored.
    """
    ticker = (raw or "").strip().upper()
    if not _TICKER_RE.match(ticker):
        raise HTTPException(400, f"Invalid ticker symbol: {raw!r}")
    return ticker
