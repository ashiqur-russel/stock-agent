"""
Live quotes for the app.

**US (and fallbacks):** Yahoo Finance via ``yfinance`` — no API key, typically a few
minutes behind a true tick feed.

**DE reference:** Prefer Yahoo’s ``TICKER.DE`` line when present (EUR / Xetra hours
on Yahoo). Same delay class as other Yahoo quotes.

**Deutsche Börse Group (official):** Real-time feeds are **commercial**. Their
**compliance delayed** products are often ~15 minutes behind — too stale for many
UIs. This app does **not** use those; it uses **Yahoo via yfinance**, which is
typically **seconds to a few minutes** behind real time (still not tick-perfect,
but much fresher than 15-minute exchange delay).

For **sub-second or guaranteed low-latency** data you need a **paid** vendor
(Polygon, Finnhub, Tradier, Alpaca, etc. for US; EU listings often need a
separate EU-capable plan).
"""

import contextlib
import io
import logging
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
            with _suppress_yfinance_stderr():
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

    with _suppress_yfinance_stderr():
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


def _safe_float(val) -> float | None:
    if val is None:
        return None
    try:
        x = float(val)
        if x != x:  # NaN
            return None
        return x
    except (TypeError, ValueError):
        return None


@contextlib.contextmanager
def _suppress_yfinance_stderr():
    """Quiet yfinance 'possibly delisted' noise (stderr prints and log records)."""
    buf = io.StringIO()
    log_names = (
        "yfinance",
        "yfinance.base",
        "yfinance.ticker",
        "yfinance.scrapers",
        "yfinance.scrapers.quote",
        "yfinance.scrapers.history",
    )
    loggers = [logging.getLogger(n) for n in log_names]
    saved = [(lg, lg.level) for lg in loggers]
    for lg in loggers:
        lg.setLevel(logging.CRITICAL)
    try:
        with contextlib.redirect_stderr(buf):
            yield
    finally:
        for lg, lev in saved:
            lg.setLevel(lev)


def _german_yahoo_symbol_candidates(base_ticker: str) -> list[str]:
    """Yahoo symbols to try for a German/EUR listing (order matters)."""
    b = base_ticker.upper().strip()
    if "-" in b:
        return []
    if any(b.endswith(suf) for suf in (".DE", ".F", ".MU", ".BE", ".HA", ".SG", ".VI")):
        return [b]
    if "." in b:
        return []
    return [f"{b}.DE", f"{b}.F", f"{b}.MU"]


def _explicit_german_yahoo_listing(ticker_u: str) -> bool:
    """User (or DB) used an explicit German Yahoo suffix; otherwise we quote the US line in DE mode."""
    b = ticker_u.upper().strip()
    return any(b.endswith(suf) for suf in (".DE", ".F", ".MU", ".BE", ".HA", ".SG", ".VI"))


def _german_listing_has_usable_data(sym: str) -> bool:
    """True only if Yahoo returns both a last price and recent daily OHLC (avoids .DE ghost symbols)."""
    with _suppress_yfinance_stderr():
        try:
            tk = yf.Ticker(sym)
            fi = tk.fast_info
            lp = _safe_float(getattr(fi, "last_price", None))
            if lp is None or lp <= 0:
                return False
            df = tk.history(period="5d", interval="1d", prepost=False, auto_adjust=True)
            return df is not None and not df.empty
        except Exception:
            return False


def _pick_de_quote_symbol(base_ticker: str) -> tuple[str, bool]:
    """(yahoo_symbol, use_german_listing). Falls back to US `base` when no DE line works."""
    b = base_ticker.upper().strip()
    for cand in _german_yahoo_symbol_candidates(b):
        if _german_listing_has_usable_data(cand):
            return cand, True
    return b, False


def _native_to_eur_usd(
    amount_native: float | None, native_ccy: str, eur_per_usd: float
) -> tuple[float | None, float | None]:
    """Convert a quote in native currency to EUR and USD (eur_per_usd = EUR for 1 USD)."""
    if amount_native is None:
        return None, None
    c = (native_ccy or "USD").upper()
    if c == "EUR":
        eur = float(amount_native)
        usd = eur / eur_per_usd if eur_per_usd else None
        return eur, usd
    # USD and other CCY: treat as USD for conversion (common for US listings)
    usd = float(amount_native)
    eur = usd * eur_per_usd if eur_per_usd else None
    return eur, usd


def _round_quote_price(val: float) -> float:
    """Extra precision for sub-$10 names (penny stocks)."""
    if not val or not (val == val):
        return 0.0
    a = abs(val)
    if a < 10:
        return round(val, 4)
    return round(val, 2)


def fetch_quote(ticker: str, display_region: str = "US") -> dict:
    """Latest quote. DE preference: try `.DE` / `.F` / `.MU` when Yahoo has usable history, else US symbol.

    Session **price** follows Yahoo ``marketState`` (pre / regular / post live quote).

    **day_change_pct** (“today”) is **vs previous regular close** when that close is known:
    ``(live_price - prev_close) / prev_close`` — above yesterday’s close → **+**, below → **-**.
    If Yahoo omits previous close, we fall back to its session change fields.

    **DE:** Plain tickers (e.g. ``BYND``) use the **US Yahoo line** converted to EUR so **today %**
    matches US pre/RTH/post. For **Xetra / German line** prices and %, use an explicit suffix
    (``BYND.DE``, ``.F``, ``.MU``, …). Pre-market badge: DE hides pre only (frontend).
    """
    region = (display_region or "US").upper()
    if region not in ("DE", "US"):
        region = "US"

    ticker_u = ticker.upper()
    eur_rate = get_usd_to_eur_rate()

    use_xetra = False
    quote_sym = ticker_u
    if region == "DE":
        if not _explicit_german_yahoo_listing(ticker_u):
            return fetch_quote(ticker_u, "US")
        quote_sym, use_xetra = _pick_de_quote_symbol(ticker_u)

    t = yf.Ticker(quote_sym)

    detail: dict = {}
    try:
        with _suppress_yfinance_stderr():
            raw = t.info
        detail = raw if isinstance(raw, dict) else {}
    except Exception:
        detail = {}

    market_state_raw = detail.get("marketState") or detail.get("market_state") or ""
    market_state = str(market_state_raw).upper() if market_state_raw else ""

    native_ccy = str(detail.get("currency") or ("EUR" if use_xetra else "USD")).upper()

    pre_n = _safe_float(detail.get("preMarketPrice"))
    post_n = _safe_float(detail.get("postMarketPrice"))
    reg_n = _safe_float(detail.get("regularMarketPrice"))
    prev_close_n = _safe_float(detail.get("regularMarketPreviousClose"))

    info_fast = None
    try:
        with _suppress_yfinance_stderr():
            info_fast = t.fast_info
    except Exception:
        pass

    if prev_close_n is None and info_fast is not None:
        try:
            prev_close_n = _safe_float(getattr(info_fast, "previous_close", None))
        except Exception:
            pass

    if reg_n is None and info_fast is not None:
        try:
            reg_n = _safe_float(getattr(info_fast, "last_price", None))
        except Exception:
            pass

    if (prev_close_n is None or prev_close_n <= 0) and detail:
        prev_close_n = _safe_float(detail.get("previousClose")) or prev_close_n

    pre_pct = _safe_float(detail.get("preMarketChangePercent"))
    reg_pct = _safe_float(detail.get("regularMarketChangePercent"))
    post_pct = _safe_float(detail.get("postMarketChangePercent"))

    fast_last = None
    if info_fast is not None:
        try:
            fast_last = _safe_float(getattr(info_fast, "last_price", None))
        except Exception:
            pass

    primary_native: float | None = None
    quote_session = "unknown"

    if market_state == "PRE":
        primary_native = pre_n or reg_n or fast_last
        quote_session = "pre_market"
    elif market_state in ("POST", "POSTPOST"):
        primary_native = post_n or reg_n or fast_last
        quote_session = "after_hours"
    elif market_state == "REGULAR":
        primary_native = reg_n or fast_last
        quote_session = "regular"
    elif market_state == "CLOSED":
        primary_native = reg_n or fast_last
        quote_session = "closed"
    else:
        primary_native = reg_n or fast_last
        quote_session = "regular" if primary_native is not None else "unknown"

    if primary_native is None:
        primary_native = 0.0

    prev_basis_native = prev_close_n if prev_close_n and prev_close_n > 0 else None

    def computed_day_pct() -> float:
        if prev_basis_native:
            return ((primary_native - prev_basis_native) / prev_basis_native) * 100
        return 0.0

    day_change_pct = computed_day_pct()
    if prev_basis_native is None:
        if quote_session == "after_hours":
            day_change_pct = (
                post_pct
                if post_pct is not None
                else (reg_pct if reg_pct is not None else day_change_pct)
            )
        elif quote_session == "pre_market":
            day_change_pct = (
                pre_pct
                if pre_pct is not None
                else (reg_pct if reg_pct is not None else day_change_pct)
            )
        elif quote_session == "closed":
            day_change_pct = reg_pct if reg_pct is not None else day_change_pct
        else:
            day_change_pct = reg_pct if reg_pct is not None else day_change_pct

    day_change_pct = round(float(day_change_pct), 2)

    def dual(native_amt: float | None) -> tuple[float | None, float | None]:
        e, u = _native_to_eur_usd(native_amt, native_ccy, eur_rate)
        if e is not None:
            e = _round_quote_price(e)
        if u is not None:
            u = _round_quote_price(u)
        return e, u

    pe, pu = dual(prev_basis_native)
    ce, cu = dual(primary_native)
    pre_eur, pre_usd_o = dual(pre_n)
    post_eur, post_usd_o = dual(post_n)
    reg_eur, reg_usd_o = dual(reg_n)

    return {
        "ticker": ticker_u,
        "current_price": ce or 0.0,
        "current_price_usd": cu or 0.0,
        "prev_close": pe or 0.0,
        "day_change_pct": day_change_pct,
        "currency": "EUR",
        "eur_rate": round(eur_rate, 6),
        "quote_session": quote_session,
        "market_state": market_state.lower() if market_state else None,
        "pre_market_price": pre_eur,
        "pre_market_price_usd": pre_usd_o,
        "post_market_price": post_eur,
        "post_market_price_usd": post_usd_o,
        "regular_market_price": reg_eur,
        "regular_market_price_usd": reg_usd_o,
        "quote_listing": "XETRA" if use_xetra else "US",
    }


def fetch_news(ticker: str) -> list[dict]:
    with _suppress_yfinance_stderr():
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
