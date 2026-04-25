from database import get_connection
from services.market_data import fetch_quote


def add_transaction(user_id: int, ticker: str, tx_type: str, shares: float, price: float, executed_at: str, notes: str = None) -> dict:
    ticker = ticker.upper()
    with get_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO transactions (user_id, ticker, type, shares, price, executed_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_id, ticker, tx_type, shares, price, executed_at, notes),
        )
        conn.commit()
        return {"id": cursor.lastrowid}


def delete_transaction(tx_id: int, user_id: int) -> bool:
    with get_connection() as conn:
        row = conn.execute("SELECT id FROM transactions WHERE id = ? AND user_id = ?", (tx_id, user_id)).fetchone()
        if not row:
            return False
        conn.execute("DELETE FROM transactions WHERE id = ?", (tx_id,))
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
            holdings[ticker] = {"shares_held": 0.0, "avg_cost": 0.0, "realized_pnl": 0.0}
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

    result = []
    for ticker, h in holdings.items():
        quote = fetch_quote(ticker)
        # current_price from fetch_quote is already in EUR
        current_price_eur = quote["current_price"]
        shares_held = h["shares_held"]
        avg_cost_eur = h["avg_cost"]  # user enters price in EUR (Scalable Capital shows EUR)
        market_value = shares_held * current_price_eur
        unrealized_pnl = (current_price_eur - avg_cost_eur) * shares_held
        unrealized_pnl_pct = (unrealized_pnl / (avg_cost_eur * shares_held) * 100) if avg_cost_eur and shares_held else 0.0

        result.append({
            "ticker": ticker,
            "shares_held": round(shares_held, 6),
            "avg_cost": round(avg_cost_eur, 4),      # EUR
            "current_price": current_price_eur,       # EUR
            "current_price_usd": quote.get("current_price_usd", 0),
            "market_value": round(market_value, 2),   # EUR
            "unrealized_pnl": round(unrealized_pnl, 2),
            "unrealized_pnl_pct": round(unrealized_pnl_pct, 2),
            "realized_pnl": round(h["realized_pnl"], 2),
            "day_change_pct": quote["day_change_pct"],
            "currency": "EUR",
            "eur_rate": quote.get("eur_rate", 0.92),
        })

    return result
