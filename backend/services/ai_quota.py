"""Fair-share limits: split org-level Groq caps across users with AI chat enabled."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

import config
from database import get_connection


def _utc_now_str() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def _today_utc_date() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _minute_cutoff_str() -> str:
    return (datetime.now(timezone.utc) - timedelta(minutes=1)).strftime("%Y-%m-%d %H:%M:%S")


def count_ai_enabled_users() -> int:
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT COUNT(*) AS n FROM users u
            LEFT JOIN user_settings s ON s.user_id = u.id
            WHERE COALESCE(s.ai_chat_enabled, 1) = 1
            """
        ).fetchone()
    return max(1, int(row["n"]))


def user_ai_chat_allowed(user_id: int) -> bool:
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT COALESCE(s.ai_chat_enabled, 1) AS e
            FROM users u
            LEFT JOIN user_settings s ON s.user_id = u.id
            WHERE u.id = ?
            """,
            (user_id,),
        ).fetchone()
    if not row:
        return False
    return bool(row["e"])


@dataclass(frozen=True)
class UserGroqShares:
    rpm: int
    rpd: int
    tpm: int
    tpd: int


def per_user_shares() -> UserGroqShares:
    n = count_ai_enabled_users()
    return UserGroqShares(
        rpm=max(1, config.GROQ_ORG_RPM // n),
        rpd=max(1, config.GROQ_ORG_RPD // n),
        tpm=max(1, config.GROQ_ORG_TPM // n),
        tpd=max(1, config.GROQ_ORG_TPD // n),
    )


def groq_call_allowed(user_id: int) -> tuple[bool, str | None]:
    """Return (ok, user_message) before each Groq chat.completions call."""
    if not config.GROQ_QUOTA_ENABLED:
        return True, None
    if not user_ai_chat_allowed(user_id):
        return False, "AI chat is turned off in your settings."

    shares = per_user_shares()
    today = _today_utc_date()
    cutoff = _minute_cutoff_str()

    with get_connection() as conn:
        row_min = conn.execute(
            """
            SELECT
              COALESCE(SUM(groq_calls), 0) AS calls,
              COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS tokens
            FROM ai_chat_usage
            WHERE user_id = ? AND created_at >= ?
            """,
            (user_id, cutoff),
        ).fetchone()
        row_day = conn.execute(
            """
            SELECT
              COALESCE(SUM(groq_calls), 0) AS calls,
              COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS tokens
            FROM ai_chat_usage
            WHERE user_id = ? AND substr(created_at, 1, 10) = ?
            """,
            (user_id, today),
        ).fetchone()

    calls_min = int(row_min["calls"])
    tok_min = int(row_min["tokens"])
    calls_day = int(row_day["calls"])
    tok_day = int(row_day["tokens"])

    if calls_min >= shares.rpm:
        return (
            False,
            f"Your per-minute request limit ({shares.rpm} Groq calls, shared pool) was reached. Try again shortly.",
        )
    if tok_min >= shares.tpm:
        return (
            False,
            f"Your per-minute token limit ({shares.tpm} tokens, shared pool) was reached. Try again in about a minute.",
        )
    if calls_day >= shares.rpd:
        return (
            False,
            f"Your daily Groq request limit ({shares.rpd} calls, UTC day) was reached. Try again tomorrow or ask an admin to raise the org tier.",
        )
    if tok_day >= shares.tpd:
        return (
            False,
            f"Your daily token limit ({shares.tpd} tokens, UTC day) was reached. Try again tomorrow.",
        )
    return True, None


def record_groq_usage(
    user_id: int,
    *,
    prompt_tokens: int,
    completion_tokens: int,
    groq_calls: int = 1,
) -> None:
    now = _utc_now_str()
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO ai_chat_usage (user_id, created_at, prompt_tokens, completion_tokens, groq_calls)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, now, prompt_tokens, completion_tokens, groq_calls),
        )
        conn.commit()
