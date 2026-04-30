import time
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from threading import Lock

from database import get_connection
from services.market_data import fetch_quote
from services.technical import run_swing_analysis
from services.user_prefs import get_user_market_region

# In-memory cache for swing-setup signals.
#
# `run_swing_analysis` is expensive (downloads price history, computes
# indicators, fetches news) so we keep the result for SIGNAL_TTL seconds.
# Memory only — clears on process restart, which is fine for dev. For prod
# this should move to Redis or be persisted.
SIGNAL_TTL = 600  # 10 minutes
_signal_cache: dict[str, tuple[float, str]] = {}
_signal_lock = Lock()


def invalidate_swing_signal_cache(ticker: str | None = None) -> None:
    """Drop cached swing labels so the next portfolio load recomputes (e.g. after an alert scan)."""
    with _signal_lock:
        if ticker:
            _signal_cache.pop(ticker.upper(), None)
        else:
            _signal_cache.clear()


def _db_last_signal(user_id: int, ticker: str) -> str | None:
    """Latest row from periodic alert scans — used when live analysis fails transiently."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT signal FROM signal_history WHERE user_id=? AND ticker=? ORDER BY checked_at DESC LIMIT 1",
            (user_id, ticker),
        ).fetchone()
    return row["signal"] if row else None


def _signal_for(user_id: int, ticker: str) -> str | None:
    """
    Live swing_setup_quality from run_swing_analysis. Only successful runs are cached;
    errors are not cached (avoids a 10-minute blank badge after a transient yfinance failure).
    """
    now = time.time()
    tk = ticker.upper()
    with _signal_lock:
        cached = _signal_cache.get(tk)
        if cached and now - cached[0] < SIGNAL_TTL:
            return cached[1]
    try:
        analysis = run_swing_analysis(ticker)
    except Exception:
        return None
    if not isinstance(analysis, dict) or "error" in analysis:
        return None
    try:
        region = get_user_market_region(user_id)
        q = fetch_quote(ticker, display_region=region)
        q_usd = float(q.get("current_price_usd") or 0)
        a_usd = float(analysis.get("current_price") or 0)
        if q_usd > 0.05 and a_usd > 0.05:
            lo, hi = (q_usd, a_usd) if q_usd <= a_usd else (a_usd, q_usd)
            if hi / lo > 4.0:
                return None
    except Exception:
        pass
    sig = analysis.get("swing_setup_quality")
    if not sig:
        return None
    with _signal_lock:
        _signal_cache[tk] = (now, sig)
    return sig


def add_transaction(
    user_id: int,
    ticker: str,
    tx_type: str,
    shares: float,
    price: float,
    executed_at: str,
    notes: str = None,
) -> dict:
    ticker = ticker.upper()
    with get_connection() as conn:
        cur = conn.execute(
            "INSERT INTO transactions (user_id, ticker, type, shares, price, executed_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id",
            (user_id, ticker, tx_type, shares, price, executed_at, notes),
        )
        row = cur.fetchone()
        conn.commit()
        if not row:
            raise RuntimeError("insert transaction failed")
        return {"id": row["id"]}


def delete_transaction(tx_id: int, user_id: int) -> bool:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id)
        ).fetchone()
        if not row:
            return False
        conn.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
        conn.commit()
        return True


def update_transaction(
    tx_id: int,
    user_id: int,
    ticker: str,
    tx_type: str,
    shares: float,
    price: float,
    executed_at: str,
    notes: str = None,
) -> bool:
    """Update an existing transaction. Returns False if it doesn't belong to user."""
    ticker = ticker.upper()
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id FROM transactions WHERE id = ? AND user_id = ?",
            (tx_id, user_id),
        ).fetchone()
        if not row:
            return False
        conn.execute(
            """UPDATE transactions
               SET ticker = ?, type = ?, shares = ?, price = ?, executed_at = ?, notes = ?
               WHERE id = ?""",
            (ticker, tx_type, shares, price, executed_at, notes, tx_id),
        )
        conn.commit()
        return True


def get_transactions(user_id: int) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM transactions WHERE user_id = ? ORDER BY executed_at DESC, created_at DESC",
            (user_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def _calculate_holdings(transactions: list[dict]) -> dict:
    holdings: dict[str, dict] = {}
    for tx in sorted(transactions, key=lambda t: (t["executed_at"], t["created_at"])):
        ticker = tx["ticker"]
        if ticker not in holdings:
            holdings[ticker] = {
                "shares_held": 0.0,
                "avg_cost": 0.0,
                "realized_pnl": 0.0,
            }
        h = holdings[ticker]

        if tx["type"] == "BUY":
            total_cost = h["shares_held"] * h["avg_cost"] + tx["shares"] * tx["price"]
            h["shares_held"] += tx["shares"]
            h["avg_cost"] = total_cost / h["shares_held"] if h["shares_held"] else 0.0
        elif tx["type"] == "SELL":
            h["realized_pnl"] += (tx["price"] - h["avg_cost"]) * tx["shares"]
            h["shares_held"] -= tx["shares"]
            if h["shares_held"] < 0:
                h["shares_held"] = 0.0

    return {k: v for k, v in holdings.items() if v["shares_held"] > 0.0001}


def get_portfolio_for_user(user_id: int) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT ticker, type, shares, price, executed_at, created_at FROM transactions WHERE user_id = ? ORDER BY executed_at, created_at",
            (user_id,),
        ).fetchall()

    transactions = [dict(r) for r in rows]
    holdings = _calculate_holdings(transactions)

    # Pre-fetch signals in parallel so the response time stays bearable when
    # several tickers are uncached. Each call is cached for SIGNAL_TTL.
    tickers = list(holdings.keys())
    signals: dict[str, str | None] = {}
    if tickers:
        _fn = partial(_signal_for, user_id)
        with ThreadPoolExecutor(max_workers=min(8, len(tickers))) as pool:
            for tk, sig in zip(tickers, pool.map(_fn, tickers)):
                signals[tk] = sig

    display_region = get_user_market_region(user_id)

    # Fetch all quotes in parallel (mirrors what the WebSocket does via asyncio.gather).
    # Sequential fetching was causing rate-limit cascades in DE mode (5-6 Yahoo
    # requests per ticker × N tickers back-to-back) that made every ticker return 0.
    quotes: dict[str, dict] = {}
    if tickers:
        _qfn = partial(fetch_quote, display_region=display_region)
        with ThreadPoolExecutor(max_workers=min(8, len(tickers))) as pool:
            for tk, q in zip(tickers, pool.map(_qfn, tickers)):
                quotes[tk] = q

    result = []
    for ticker, h in holdings.items():
        quote = quotes.get(ticker, {})
        # current_price from fetch_quote is already in EUR
        current_price_eur = quote["current_price"]
        current_price_usd = float(quote.get("current_price_usd") or 0.0)
        eur_rate = float(quote.get("eur_rate") or 0.91)  # EUR per 1 USD (same as quote payload)
        shares_held = h["shares_held"]
        avg_cost_eur = h["avg_cost"]  # user enters price in EUR (Scalable Capital shows EUR)
        market_value = shares_held * current_price_eur
        unrealized_pnl = (current_price_eur - avg_cost_eur) * shares_held
        unrealized_pnl_pct = (
            (unrealized_pnl / (avg_cost_eur * shares_held) * 100)
            if avg_cost_eur and shares_held
            else 0.0
        )
        # USD columns for UI currency toggle (avg_cost / realized P&L are stored in EUR)
        avg_cost_usd = (avg_cost_eur / eur_rate) if eur_rate else 0.0
        market_value_usd = shares_held * current_price_usd
        unrealized_pnl_usd = (current_price_usd - avg_cost_usd) * shares_held
        realized_pnl_eur = float(h["realized_pnl"])
        realized_pnl_usd = (realized_pnl_eur / eur_rate) if eur_rate else 0.0

        result.append(
            {
                "ticker": ticker,
                "shares_held": round(shares_held, 6),
                "avg_cost": round(avg_cost_eur, 4),  # EUR
                "current_price": current_price_eur,  # EUR
                "current_price_usd": current_price_usd,
                "market_value": round(market_value, 2),  # EUR
                "market_value_usd": round(market_value_usd, 2),
                "unrealized_pnl": round(unrealized_pnl, 2),
                "unrealized_pnl_usd": round(unrealized_pnl_usd, 2),
                "unrealized_pnl_pct": round(unrealized_pnl_pct, 2),
                "realized_pnl": round(realized_pnl_eur, 2),
                "realized_pnl_usd": round(realized_pnl_usd, 2),
                "day_change_pct": quote["day_change_pct"],
                "currency": "EUR",
                "eur_rate": quote.get("eur_rate", 0.92),
                "quote_session": quote.get("quote_session"),
                "market_state": quote.get("market_state"),
                "pre_market_price": quote.get("pre_market_price"),
                "pre_market_price_usd": quote.get("pre_market_price_usd"),
                "post_market_price": quote.get("post_market_price"),
                "post_market_price_usd": quote.get("post_market_price_usd"),
                "regular_market_price": quote.get("regular_market_price"),
                "regular_market_price_usd": quote.get("regular_market_price_usd"),
                "us_listing": quote.get("us_listing"),
                "signal": signals.get(ticker) or _db_last_signal(user_id, ticker),
            }
        )

    return result
