"""Lightweight reads of per-user UI preferences stored in `user_settings`."""

from database import get_connection


def get_user_market_region(user_id: int) -> str:
    """Returns 'DE' or 'US' (default DE if unset)."""
    with get_connection() as conn:
        row = conn.execute(
            "SELECT market_region FROM user_settings WHERE user_id = ?",
            (user_id,),
        ).fetchone()
    if row and row["market_region"] in ("DE", "US"):
        return row["market_region"]
    return "DE"
