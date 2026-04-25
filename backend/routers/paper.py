from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from middleware.auth import get_current_user
from database import get_connection
from services.market_data import fetch_quote

router = APIRouter(prefix="/api/v1/paper", tags=["paper"])

STARTING_BALANCE = 100_000.0


def _ensure_account(user_id: int, conn) -> float:
    row = conn.execute("SELECT balance_eur FROM paper_accounts WHERE user_id=?", (user_id,)).fetchone()
    if not row:
        conn.execute("INSERT INTO paper_accounts (user_id, balance_eur) VALUES (?,?)", (user_id, STARTING_BALANCE))
        conn.commit()
        return STARTING_BALANCE
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
            holdings[t] = {"shares": 0.0, "avg_cost": 0.0}
        h = holdings[t]
        if tx["type"] == "BUY":
            total = h["shares"] * h["avg_cost"] + tx["shares"] * tx["price_eur"]
            h["shares"] += tx["shares"]
            h["avg_cost"] = total / h["shares"]
        else:
            h["shares"] -= tx["shares"]
            if h["shares"] < 0:
                h["shares"] = 0.0
    return {k: v for k, v in holdings.items() if v["shares"] > 0.0001}


@router.get("/account")
def get_account(user=Depends(get_current_user)):
    user_id = user["user_id"]
    with get_connection() as conn:
        balance = _ensure_account(user_id, conn)
        holdings_raw = _calc_holdings(user_id, conn)
        rows = conn.execute(
            "SELECT * FROM paper_transactions WHERE user_id=? ORDER BY executed_at DESC",
            (user_id,),
        ).fetchall()

    holdings = []
    total_value = balance
    for ticker, h in holdings_raw.items():
        quote = fetch_quote(ticker)
        price = quote["current_price"]
        market_val = round(h["shares"] * price, 2)
        unrealized = round((price - h["avg_cost"]) * h["shares"], 2)
        unrealized_pct = round(unrealized / (h["avg_cost"] * h["shares"]) * 100, 2) if h["avg_cost"] and h["shares"] else 0
        total_value += market_val
        holdings.append({
            "ticker": ticker,
            "shares": round(h["shares"], 6),
            "avg_cost": round(h["avg_cost"], 4),
            "current_price": price,
            "market_value": market_val,
            "unrealized_pnl": unrealized,
            "unrealized_pnl_pct": unrealized_pct,
            "day_change_pct": quote["day_change_pct"],
        })

    return {
        "balance_eur": round(balance, 2),
        "total_value": round(total_value, 2),
        "pnl": round(total_value - STARTING_BALANCE, 2),
        "pnl_pct": round((total_value - STARTING_BALANCE) / STARTING_BALANCE * 100, 2),
        "holdings": holdings,
        "transactions": [dict(r) for r in rows],
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


@router.post("/reset")
def reset_account(user=Depends(get_current_user)):
    user_id = user["user_id"]
    with get_connection() as conn:
        conn.execute("DELETE FROM paper_transactions WHERE user_id=?", (user_id,))
        conn.execute(
            "INSERT INTO paper_accounts (user_id, balance_eur) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET balance_eur=?",
            (user_id, STARTING_BALANCE, STARTING_BALANCE),
        )
        conn.commit()
    return {"ok": True, "balance_eur": STARTING_BALANCE}


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
