from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from middleware.auth import get_current_user
from database import get_connection
from services.market_data import fetch_quote, get_usd_to_eur_rate

router = APIRouter(prefix="/api/v1/paper", tags=["paper"])

# Starting balance for a new paper account.
#
# Stored internally in EUR. When the user creates their account in USD-display
# mode, we seed the EUR balance such that the *displayed* value is exactly
# $1,000,000 — i.e. EUR_balance × (1 / eur_rate) ≈ 1,000,000. EUR users get
# €1,000,000 flat.
STARTING_BALANCE_DISPLAY = 1_000_000.0


def _starting_balance_eur(currency: str) -> float:
    """EUR amount to seed so the user's currency view shows exactly 1M."""
    if (currency or "EUR").upper() == "USD":
        rate = get_usd_to_eur_rate() or 0.91  # USD → EUR
        return round(STARTING_BALANCE_DISPLAY * rate, 2)
    return STARTING_BALANCE_DISPLAY


def _ensure_account(user_id: int, conn, currency: str = "EUR") -> float:
    row = conn.execute(
        "SELECT balance_eur FROM paper_accounts WHERE user_id=?", (user_id,)
    ).fetchone()
    if not row:
        starting = _starting_balance_eur(currency)
        conn.execute(
            "INSERT INTO paper_accounts (user_id, balance_eur) VALUES (?,?)",
            (user_id, starting),
        )
        conn.commit()
        return starting
    return row["balance_eur"]


def _calc_holdings(user_id: int, conn) -> dict:
    rows = conn.execute(
        "SELECT ticker, type, shares, price_eur FROM paper_transactions WHERE user_id=? ORDER BY executed_at",
        (user_id,),
    ).fetchall()
    holdings: dict[str, dict] = {}
    for tx in rows:
        t = tx["ticker"]
        if t not in holdings:
            holdings[t] = {"shares": 0.0, "avg_cost": 0.0, "realized_pnl": 0.0}
        h = holdings[t]
        if tx["type"] == "BUY":
            total = h["shares"] * h["avg_cost"] + tx["shares"] * tx["price_eur"]
            h["shares"] += tx["shares"]
            h["avg_cost"] = total / h["shares"]
        else:
            h["realized_pnl"] += (tx["price_eur"] - h["avg_cost"]) * tx["shares"]
            h["shares"] -= tx["shares"]
            if h["shares"] < 0:
                h["shares"] = 0.0
    return {k: v for k, v in holdings.items() if v["shares"] > 0.0001}


@router.get("/account")
def get_account(
    user=Depends(get_current_user),
    currency: str = Query("EUR", regex="^(USD|EUR)$"),
):
    user_id = user["user_id"]
    with get_connection() as conn:
        balance_eur = _ensure_account(user_id, conn, currency=currency)
        holdings_raw = _calc_holdings(user_id, conn)

    eur_rate = get_usd_to_eur_rate() or 0.91  # USD → EUR
    usd_per_eur = (1 / eur_rate) if eur_rate else 1.0

    holdings = []
    portfolio_value_eur = 0.0
    for ticker, h in holdings_raw.items():
        quote = fetch_quote(ticker)
        price_eur = quote.get("current_price", 0.0) or 0.0
        price_usd = quote.get("current_price_usd", 0.0) or 0.0
        shares = h["shares"]
        avg_cost_eur = h["avg_cost"]
        value_eur = round(shares * price_eur, 2)
        value_usd = round(shares * price_usd, 2)
        pnl_eur = round((price_eur - avg_cost_eur) * shares, 2)
        pnl_usd = round(pnl_eur * usd_per_eur, 2)
        pnl_pct = round(
            (pnl_eur / (avg_cost_eur * shares) * 100) if avg_cost_eur and shares else 0,
            2,
        )
        portfolio_value_eur += value_eur
        holdings.append({
            "ticker": ticker,
            "shares": round(shares, 6),
            "avg_cost": round(avg_cost_eur, 4),
            "current_price": price_eur,
            "current_price_usd": price_usd,
            "value": value_eur,
            "value_usd": value_usd,
            "pnl": pnl_eur,
            "pnl_usd": pnl_usd,
            "pnl_pct": pnl_pct,
            "day_change_pct": quote.get("day_change_pct", 0),
            "realized_pnl": round(h.get("realized_pnl", 0), 2),
        })

    cash_eur = round(balance_eur, 2)
    cash_usd = round(cash_eur * usd_per_eur, 2)
    portfolio_value_usd = round(portfolio_value_eur * usd_per_eur, 2)

    return {
        "cash": cash_eur,
        "cash_usd": cash_usd,
        "portfolio_value": round(portfolio_value_eur, 2),
        "portfolio_value_usd": portfolio_value_usd,
        "holdings": holdings,
        "eur_rate": eur_rate,
    }


class PaperTradeBody(BaseModel):
    ticker: str
    type: str  # BUY or SELL
    shares: float
    notes: str = ""


@router.post("/trade")
def paper_trade(body: PaperTradeBody, user=Depends(get_current_user)):
    user_id = user["user_id"]
    ticker = body.ticker.upper()
    if body.type not in ("BUY", "SELL"):
        raise HTTPException(400, "type must be BUY or SELL")
    if body.shares <= 0:
        raise HTTPException(400, "shares must be positive")

    quote = fetch_quote(ticker)
    price_eur = quote["current_price"]
    if price_eur <= 0:
        raise HTTPException(400, f"Could not get price for {ticker}")

    cost = price_eur * body.shares

    with get_connection() as conn:
        balance = _ensure_account(user_id, conn)
        holdings = _calc_holdings(user_id, conn)

        if body.type == "BUY":
            if cost > balance:
                raise HTTPException(400, f"Insufficient funds. Need €{cost:.2f}, have €{balance:.2f}")
            new_balance = balance - cost
        else:
            held = holdings.get(ticker, {}).get("shares", 0)
            if body.shares > held:
                raise HTTPException(400, f"Not enough shares. Held: {held:.4f}, trying to sell: {body.shares}")
            new_balance = balance + cost

        conn.execute(
            "INSERT INTO paper_transactions (user_id, ticker, type, shares, price_eur, notes) VALUES (?,?,?,?,?,?)",
            (user_id, ticker, body.type, body.shares, price_eur, body.notes),
        )
        conn.execute("UPDATE paper_accounts SET balance_eur=? WHERE user_id=?", (new_balance, user_id))
        conn.commit()

    return {
        "ok": True,
        "ticker": ticker,
        "type": body.type,
        "shares": body.shares,
        "price_eur": price_eur,
        "total": round(cost, 2),
        "new_balance": round(new_balance, 2),
    }


class ResetBody(BaseModel):
    currency: str = "EUR"  # USD or EUR — picks how much to seed


@router.post("/reset")
def reset_account(body: ResetBody | None = None, user=Depends(get_current_user)):
    """Wipe paper transactions and reset balance to the 1M starter (in the
    user's currently selected currency, so the displayed value is exactly 1M)."""
    user_id = user["user_id"]
    currency = (body.currency if body else "EUR").upper()
    if currency not in ("USD", "EUR"):
        currency = "EUR"
    starting = _starting_balance_eur(currency)
    with get_connection() as conn:
        conn.execute("DELETE FROM paper_transactions WHERE user_id=?", (user_id,))
        conn.execute(
            "INSERT INTO paper_accounts (user_id, balance_eur) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET balance_eur=?",
            (user_id, starting, starting),
        )
        conn.commit()
    return {"ok": True, "balance_eur": starting, "currency": currency}


# ---------------------------------------------------------------------------
# Watchlist persistence
# ---------------------------------------------------------------------------

class WatchlistBody(BaseModel):
    ticker: str


def _normalize_ticker(raw: str) -> str:
    return raw.strip().upper()


@router.get("/watchlist")
def list_watchlist(user=Depends(get_current_user)):
    user_id = user["user_id"]
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT ticker FROM paper_watchlist WHERE user_id=? ORDER BY created_at ASC",
            (user_id,),
        ).fetchall()
    return {"tickers": [r["ticker"] for r in rows]}


@router.post("/watchlist")
def add_to_watchlist(body: WatchlistBody, user=Depends(get_current_user)):
    user_id = user["user_id"]
    ticker = _normalize_ticker(body.ticker)
    if not ticker:
        raise HTTPException(400, "ticker is required")
    with get_connection() as conn:
        conn.execute(
            "INSERT OR IGNORE INTO paper_watchlist (user_id, ticker) VALUES (?,?)",
            (user_id, ticker),
        )
        conn.commit()
    return {"ok": True, "ticker": ticker}


@router.delete("/watchlist/{ticker}")
def remove_from_watchlist(ticker: str, user=Depends(get_current_user)):
    user_id = user["user_id"]
    ticker = _normalize_ticker(ticker)
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM paper_watchlist WHERE user_id=? AND ticker=?",
            (user_id, ticker),
        )
        conn.commit()
    return {"ok": True, "ticker": ticker}
