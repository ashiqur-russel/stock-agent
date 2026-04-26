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


def _window_cutoff_str(hours: int) -> str:
    return (datetime.now(timezone.utc) - timedelta(hours=hours)).strftime("%Y-%m-%d %H:%M:%S")


def _bucket_hours() -> int | None:
    """None = calendar UTC day; int = rolling window length in hours."""
    b = config.GROQ_QUOTA_BUCKET
    if b == "1h":
        return 1
    if b == "2h":
        return 2
    return None


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
    cutoff_min = _minute_cutoff_str()
    wh = _bucket_hours()

    with get_connection() as conn:
        row_min = conn.execute(
            """
            SELECT
              COALESCE(SUM(groq_calls), 0) AS calls,
              COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS tokens
            FROM ai_chat_usage
            WHERE user_id = ? AND created_at >= ?
            """,
            (user_id, cutoff_min),
        ).fetchone()
        if wh is None:
            row_period = conn.execute(
                """
                SELECT
                  COALESCE(SUM(groq_calls), 0) AS calls,
                  COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS tokens
                FROM ai_chat_usage
                WHERE user_id = ? AND substr(created_at, 1, 10) = ?
                """,
                (user_id, today),
            ).fetchone()
            cap_calls = shares.rpd
            cap_tokens = shares.tpd
            period_desc = "this UTC calendar day"
        else:
            cutoff_w = _window_cutoff_str(wh)
            row_period = conn.execute(
                """
                SELECT
                  COALESCE(SUM(groq_calls), 0) AS calls,
                  COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS tokens
                FROM ai_chat_usage
                WHERE user_id = ? AND created_at >= ?
                """,
                (user_id, cutoff_w),
            ).fetchone()
            # Proportional slice of each user's daily fair share (resets as the window rolls).
            cap_calls = max(1, (shares.rpd * wh) // 24)
            cap_tokens = max(1, (shares.tpd * wh) // 24)
            period_desc = "the last hour" if wh == 1 else "the last 2 hours"

    calls_min = int(row_min["calls"])
    tok_min = int(row_min["tokens"])
    calls_period = int(row_period["calls"])
    tok_period = int(row_period["tokens"])

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
    if calls_period >= cap_calls:
        return (
            False,
            f"Your Groq request limit for {period_desc} ({cap_calls} calls, fair share) was reached. Wait for the window to roll forward or try again tomorrow.",
        )
    if tok_period >= cap_tokens:
        return (
            False,
            f"Your token limit for {period_desc} ({cap_tokens} tokens, fair share) was reached. Wait for the window to roll forward or try again tomorrow.",
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


def _parse_utc_ts(value: object) -> datetime | None:
    if value is None:
        return None
    raw = str(value).strip()
    if not raw:
        return None
    # "YYYY-MM-DD HH:MM:SS" or Postgres text with fractional / TZ — take first 19 chars
    head = raw[:19].replace("T", " ")
    try:
        return datetime.strptime(head, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _next_utc_midnight() -> datetime:
    now = datetime.now(timezone.utc)
    nxt = (now + timedelta(days=1)).date()
    return datetime(nxt.year, nxt.month, nxt.day, 0, 0, 0, tzinfo=timezone.utc)


def get_groq_quota_snapshot(user_id: int) -> dict:
    """Per-user limits, current usage, and estimated next time capacity returns (server fair-share)."""
    ai_ok = user_ai_chat_allowed(user_id)
    n_sharing = count_ai_enabled_users()
    base: dict = {
        "quota_enabled": config.GROQ_QUOTA_ENABLED,
        "ai_chat_enabled": ai_ok,
        "bucket": config.GROQ_QUOTA_BUCKET,
        "users_sharing_pool": n_sharing,
    }

    if not config.GROQ_QUOTA_ENABLED:
        return {
            **base,
            "can_use": ai_ok,
            "shares": None,
            "used": None,
            "block_reason": None if ai_ok else "AI chat is turned off in your settings.",
            "next_capacity_utc": None,
            "seconds_until_capacity": None,
            "period_label": None,
            "utc_day_resets_at": None,
            "info": "Per-user fair-share is disabled; Groq org limits still apply.",
        }

    if not ai_ok:
        return {
            **base,
            "can_use": False,
            "shares": None,
            "used": None,
            "block_reason": "AI chat is turned off in your settings.",
            "next_capacity_utc": None,
            "seconds_until_capacity": None,
            "period_label": None,
            "utc_day_resets_at": None,
            "info": None,
        }

    shares = per_user_shares()
    today = _today_utc_date()
    cutoff_min = _minute_cutoff_str()
    wh = _bucket_hours()

    with get_connection() as conn:
        row_min = conn.execute(
            """
            SELECT
              COALESCE(SUM(groq_calls), 0) AS calls,
              COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS tokens
            FROM ai_chat_usage
            WHERE user_id = ? AND created_at >= ?
            """,
            (user_id, cutoff_min),
        ).fetchone()
        if wh is None:
            row_period = conn.execute(
                """
                SELECT
                  COALESCE(SUM(groq_calls), 0) AS calls,
                  COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS tokens
                FROM ai_chat_usage
                WHERE user_id = ? AND substr(created_at, 1, 10) = ?
                """,
                (user_id, today),
            ).fetchone()
            cap_calls = shares.rpd
            cap_tokens = shares.tpd
            period_label = "UTC calendar day"
            cutoff_w = None
        else:
            cutoff_w = _window_cutoff_str(wh)
            row_period = conn.execute(
                """
                SELECT
                  COALESCE(SUM(groq_calls), 0) AS calls,
                  COALESCE(SUM(prompt_tokens + completion_tokens), 0) AS tokens
                FROM ai_chat_usage
                WHERE user_id = ? AND created_at >= ?
                """,
                (user_id, cutoff_w),
            ).fetchone()
            cap_calls = max(1, (shares.rpd * wh) // 24)
            cap_tokens = max(1, (shares.tpd * wh) // 24)
            period_label = "last hour" if wh == 1 else "last 2 hours"

        min_row_minute = conn.execute(
            """
            SELECT MIN(created_at) AS m
            FROM ai_chat_usage
            WHERE user_id = ? AND created_at >= ?
            """,
            (user_id, cutoff_min),
        ).fetchone()
        min_row_period = None
        if wh is None:
            min_row_period = conn.execute(
                """
                SELECT MIN(created_at) AS m
                FROM ai_chat_usage
                WHERE user_id = ? AND substr(created_at, 1, 10) = ?
                """,
                (user_id, today),
            ).fetchone()
        elif cutoff_w is not None:
            min_row_period = conn.execute(
                """
                SELECT MIN(created_at) AS m
                FROM ai_chat_usage
                WHERE user_id = ? AND created_at >= ?
                """,
                (user_id, cutoff_w),
            ).fetchone()

    calls_min = int(row_min["calls"])
    tok_min = int(row_min["tokens"])
    calls_period = int(row_period["calls"])
    tok_period = int(row_period["tokens"])

    blocked_min_calls = calls_min >= shares.rpm
    blocked_min_tokens = tok_min >= shares.tpm
    blocked_period_calls = calls_period >= cap_calls
    blocked_period_tokens = tok_period >= cap_tokens

    allowed = not (
        blocked_min_calls or blocked_min_tokens or blocked_period_calls or blocked_period_tokens
    )

    period_desc = (
        "this UTC calendar day"
        if wh is None
        else ("the last hour" if wh == 1 else "the last 2 hours")
    )
    block_reason: str | None = None
    if not allowed:
        if blocked_min_calls:
            block_reason = (
                f"Your per-minute request limit ({shares.rpm} Groq calls, shared pool) was reached."
            )
        elif blocked_min_tokens:
            block_reason = (
                f"Your per-minute token limit ({shares.tpm} tokens, shared pool) was reached."
            )
        elif blocked_period_calls:
            block_reason = f"Your Groq request limit for {period_desc} ({cap_calls} calls, fair share) was reached."
        elif blocked_period_tokens:
            block_reason = (
                f"Your token limit for {period_desc} ({cap_tokens} tokens, fair share) was reached."
            )

    reset_times: list[datetime] = []
    if blocked_min_calls and min_row_minute and min_row_minute["m"]:
        t0 = _parse_utc_ts(min_row_minute["m"])
        if t0:
            reset_times.append(t0 + timedelta(minutes=1))
    if blocked_min_tokens and min_row_minute and min_row_minute["m"]:
        t0 = _parse_utc_ts(min_row_minute["m"])
        if t0:
            reset_times.append(t0 + timedelta(minutes=1))
    if blocked_period_calls or blocked_period_tokens:
        if wh is None:
            reset_times.append(_next_utc_midnight())
        elif min_row_period and min_row_period["m"]:
            t0 = _parse_utc_ts(min_row_period["m"])
            if t0:
                reset_times.append(t0 + timedelta(hours=wh))

    now = datetime.now(timezone.utc)
    next_cap: datetime | None = None
    if reset_times:
        next_cap = min(reset_times)
        if next_cap <= now:
            next_cap = now + timedelta(seconds=1)

    seconds_until: int | None = None
    if next_cap is not None:
        seconds_until = max(0, int((next_cap - now).total_seconds()))

    info_bits = [
        "Limits are your share of the server Groq budget, split across users who enabled AI chat.",
        f"Period: {period_label}. Per-minute caps match Groq-style bursts.",
    ]
    if wh is None:
        info_bits.append("Daily counts reset at 00:00 UTC (same clock most Groq daily quotas use).")

    utc_day_resets_at: str | None = None
    if wh is None:
        utc_day_resets_at = _next_utc_midnight().isoformat().replace("+00:00", "Z")

    return {
        **base,
        "can_use": allowed,
        "shares": {
            "rpm": shares.rpm,
            "tpm": shares.tpm,
            "period_calls_cap": cap_calls,
            "period_tokens_cap": cap_tokens,
            "rpd_daily_share": shares.rpd,
            "tpd_daily_share": shares.tpd,
        },
        "used": {
            "minute": {"groq_calls": calls_min, "tokens": tok_min},
            "period": {"groq_calls": calls_period, "tokens": tok_period},
        },
        "block_reason": block_reason if not allowed else None,
        "next_capacity_utc": next_cap.isoformat().replace("+00:00", "Z") if next_cap else None,
        "seconds_until_capacity": seconds_until,
        "period_label": period_label,
        "utc_day_resets_at": utc_day_resets_at,
        "info": " ".join(info_bits),
    }
