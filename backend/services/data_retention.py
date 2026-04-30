"""Scheduled pruning for append-only alert / signal tables."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import config
from database import get_connection


def prune_alert_tables() -> None:
    """
    Delete rows older than configured retention. Uses UTC cutoffs vs TEXT timestamps
    (SQLite/Postgres schemas store ISO-like strings from datetime('now')).

    Set DATA_RETENTION_DAYS_SIGNAL_HISTORY=0 or DATA_RETENTION_DAYS_ALERTS=0 to skip
    that table.
    """
    sd = config.DATA_RETENTION_DAYS_SIGNAL_HISTORY
    ad = config.DATA_RETENTION_DAYS_ALERTS
    if sd <= 0 and ad <= 0:
        return

    now = datetime.now(timezone.utc)
    with get_connection() as conn:
        if sd > 0:
            cutoff = (now - timedelta(days=sd)).strftime("%Y-%m-%d %H:%M:%S")
            conn.execute("DELETE FROM signal_history WHERE checked_at < ?", (cutoff,))
        if ad > 0:
            cutoff_a = (now - timedelta(days=ad)).strftime("%Y-%m-%d %H:%M:%S")
            conn.execute("DELETE FROM alerts WHERE created_at < ?", (cutoff_a,))
        conn.commit()

    parts = []
    if sd > 0:
        parts.append(f"signal_history>{sd}d")
    if ad > 0:
        parts.append(f"alerts>{ad}d")
    print(f"[retention] pruned ({', '.join(parts)})")
