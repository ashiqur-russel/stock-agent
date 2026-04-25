import threading
import time
from datetime import datetime

import yfinance as yf

# Cache the EUR rate for 5 minutes to avoid fetching on every request
_eur_cache: dict = {"rate": None, "fetched_at": 0}
_eur_lock = threading.Lock()


def get_usd_to_eur_rate() -> float:
    """Returns how many EUR you get for 1 USD (e.g. 0.91 if 1 USD = 0.91 EUR)."""
    with _eur_lock:
        now = time.time()
        if _eur_cache["rate"] and now - _eur_cache["fetched_at"] < 300:
            return _eur_cache["rate"]
        try:
            # EURUSD=X gives USD per 1 EUR (e.g. 1.10 means 1 EUR = 1.10 USD)
            # We want USD→EUR, so: 1 USD = 1/1.10 EUR = 0.909 EUR
            t = yf.Ticker("EURUSD=X")
            eurusd = float(t.fast_info.last_price)
            rate = 1.0 / eurusd if eurusd else 0.91
            _eur_cache["rate"] = rate
            _eur_cache["fetched_at"] = now
            return rate
        except Exception:
            return _eur_cache["rate"] or 0.91  # fallback


def usd_to_eur(usd: float) -> float:
    return round(usd * get_usd_to_eur_rate(), 4)


def fetch_ohlcv(ticker: str, period: str = "3mo", interval: str = "1d") -> list[dict]:
    import pandas as pd

    df = yf.download(ticker, period=period, interval=interval, progress=False, auto_adjust=True)
    if df.empty:
        return []
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)
    eur_rate = get_usd_to_eur_rate()
    df = df.reset_index()
    records = []
    for _, row in df.iterrows():
        date_val = row["Date"] if "Date" in row.index else row.get("Datetime")
        records.append(
            {
                "time": date_val.strftime("%Y-%m-%d")
                if hasattr(date_val, "strftime")
                else str(date_val)[:10],
                "open": round(float(row["Open"]) * eur_rate, 4),
                "high": round(float(row["High"]) * eur_rate, 4),
                "low": round(float(row["Low"]) * eur_rate, 4),
                "close": round(float(row["Close"]) * eur_rate, 4),
                "volume": int(row["Volume"]),
            }
        )
    return records


def fetch_quote(ticker: str) -> dict:
    t = yf.Ticker(ticker)
    info = t.fast_info
    try:
        current_price_usd = float(info.last_price)
        prev_close_usd = float(info.previous_close)
        day_change_pct = (
            ((current_price_usd - prev_close_usd) / prev_close_usd) * 100 if prev_close_usd else 0.0
        )
        eur_rate = get_usd_to_eur_rate()
        return {
            "ticker": ticker.upper(),
            "current_price": round(current_price_usd * eur_rate, 4),  # EUR
            "current_price_usd": round(current_price_usd, 4),
            "prev_close": round(prev_close_usd * eur_rate, 4),
            "day_change_pct": round(day_change_pct, 2),
            "currency": "EUR",
            "eur_rate": round(eur_rate, 6),
        }
    except Exception:
        return {
            "ticker": ticker.upper(),
            "current_price": 0.0,
            "current_price_usd": 0.0,
            "prev_close": 0.0,
            "day_change_pct": 0.0,
            "currency": "EUR",
            "eur_rate": 0.91,
        }


def fetch_news(ticker: str) -> list[dict]:
    t = yf.Ticker(ticker)
    news = t.news or []
    results = []
    for item in news[:10]:
        # yfinance >= 0.2.50 wraps news in a "content" key
        content = item.get("content", item)
        title = content.get("title") or item.get("title", "")
        publisher = content.get("provider", {}).get("displayName") or item.get("publisher", "")
        pub_time = content.get("pubDate") or item.get("providerPublishTime")
        url = (content.get("canonicalUrl") or {}).get("url") or item.get("link", "")
        try:
            if isinstance(pub_time, (int, float)):
                published_at = datetime.fromtimestamp(pub_time).isoformat()
            elif pub_time:
                published_at = str(pub_time)
            else:
                published_at = ""
        except Exception:
            published_at = ""
        if title:
            results.append(
                {
                    "title": title,
                    "publisher": publisher,
                    "published_at": published_at,
                    "url": url,
                }
            )
    return results
