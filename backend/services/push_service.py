"""
Browser Web Push notification service (RFC 8030 + VAPID).

Requires VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, and VAPID_SUBJECT in .env.
Run tools/generate_vapid_keys.py once to produce them.
"""

import json

import config
from database import get_connection


def _push_enabled() -> bool:
    return bool(config.VAPID_PRIVATE_KEY and config.VAPID_PUBLIC_KEY)


# ── subscription CRUD ─────────────────────────────────────────────────────────


def save_subscription(user_id: int, endpoint: str, p256dh: str, auth: str) -> None:
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(endpoint) DO UPDATE SET
                   user_id  = excluded.user_id,
                   p256dh   = excluded.p256dh,
                   auth     = excluded.auth""",
            (user_id, endpoint, p256dh, auth),
        )
        conn.commit()


def delete_subscription(user_id: int, endpoint: str) -> None:
    with get_connection() as conn:
        conn.execute(
            "DELETE FROM push_subscriptions WHERE user_id=? AND endpoint=?",
            (user_id, endpoint),
        )
        conn.commit()


def get_subscriptions(user_id: int) -> list[dict]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id=?",
            (user_id,),
        ).fetchall()
    return [dict(r) for r in rows]


def has_subscription(user_id: int) -> bool:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT 1 FROM push_subscriptions WHERE user_id=? LIMIT 1",
            (user_id,),
        ).fetchone()
    return row is not None


# ── send ──────────────────────────────────────────────────────────────────────


def _purge_dead(endpoints: list[str]) -> None:
    if not endpoints:
        return
    with get_connection() as conn:
        for ep in endpoints:
            conn.execute("DELETE FROM push_subscriptions WHERE endpoint=?", (ep,))
        conn.commit()


def send_push_to_user(user_id: int, title: str, body: str, url: str = "/user/alerts") -> None:
    """Send a Web Push notification to all registered browsers for a user."""
    if not _push_enabled():
        return

    subs = get_subscriptions(user_id)
    if not subs:
        return

    try:
        from pywebpush import WebPushException, webpush  # lazy import — optional dep
    except ImportError:
        print("[push] pywebpush not installed — skipping browser push")
        return

    payload = json.dumps({"title": title, "body": body, "url": url})
    dead: list[str] = []

    for sub in subs:
        info = {
            "endpoint": sub["endpoint"],
            "keys": {"p256dh": sub["p256dh"], "auth": sub["auth"]},
        }
        try:
            webpush(
                subscription_info=info,
                data=payload,
                vapid_private_key=config.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": config.VAPID_SUBJECT},
            )
        except WebPushException as exc:
            resp = exc.response
            if resp is not None and resp.status_code in (404, 410):
                # Subscription expired / user unsubscribed in browser
                dead.append(sub["endpoint"])
            else:
                print(f"[push] send failed ({sub['endpoint'][:40]}…): {exc}")
        except Exception as exc:
            print(f"[push] unexpected error: {exc}")

    _purge_dead(dead)
