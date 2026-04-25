import yfinance as yf
from datetime import datetime
import threading
import time

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
    df = yf.download(ticker, period=period, interval=interval, progress=False, auto_adjust=True)
    if df.empty:
        return []
    eur_rate = get_usd_to_eur_rate()
    df = df.reset_index()
    records = []
    for _, row in df.iterrows():
        date_val = row["Date"] if "Date" in row else row["Datetime"]
        records.append({
            "time": date_val.strftime("%Y-%m-%d") if hasattr(date_val, "strftime") else str(date_val)[:10],
            "open": round(float(row["Open"]) * eur_rate, 4),
            "high": round(float(row["High"]) * eur_rate, 4),
            "low": round(float(row["Low"]) * eur_rate, 4),
            "close": round(float(row["Close"]) * eur_rate, 4),
            "volume": int(row["Volume"]),
        })
    return records


def fetch_quote(ticker: str) -> dict:
    t = yf.Ticker(ticker)
    info = t.fast_info
    try:
        current_price_usd = float(info.last_price)
        prev_close_usd = float(info.previous_close)
        day_change_pct = ((current_price_usd - prev_close_usd) / prev_close_usd) * 100 if prev_close_usd else 0.0
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
        return {"ticker": ticker.upper(), "current_price": 0.0, "current_price_usd": 0.0, "prev_close": 0.0, "day_change_pct": 0.0, "currency": "EUR", "eur_rate": 0.91}


def fetch_news(ticker: str) -> list[dict]:
    t = yf.Ticker(ticker)
    news = t.news or []
    results = []
    for item in news[:10]:
        results.append({
            "title": item.get("title", ""),
            "publisher": item.get("publisher", ""),
            "published_at": datetime.fromtimestamp(item.get("providerPublishTime", 0)).isoformat(),
            "url": item.get("link", ""),
        })
    return results
