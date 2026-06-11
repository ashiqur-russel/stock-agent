"""
Browser Web Push notification service (RFC 8030 + VAPID).

Requires VAPID_PRIVATE_KEY, VAPID_PUBLIC_KEY, and VAPID_SUBJECT in .env.
Run tools/generate_vapid_keys.py once to produce them.
"""

import json
import logging

import config
from database import get_connection

logger = logging.getLogger("stockagent.push")


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


def send_push_to_user(
    user_id: int,
    title: str,
    body: str,
    url: str = "/user/alerts",
    tag: str | None = None,
) -> None:
    """Send a Web Push notification to all registered browsers for a user.

    ``tag`` groups notifications in the browser: pushes with the same tag
    replace each other, different tags stack. Pass a per-ticker tag so an
    AAPL alert never overwrites a GOOGL alert.
    """
    if not _push_enabled():
        return

    subs = get_subscriptions(user_id)
    if not subs:
        return

    try:
        from pywebpush import WebPushException, webpush  # lazy import — optional dep
    except ImportError:
        logger.warning("pywebpush not installed — skipping browser push")
        return

    payload = json.dumps({"title": title, "body": body, "url": url, "tag": tag})
    dead: list[str] = []
    failed = 0

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
            status = resp.status_code if resp is not None else None
            if status in (404, 410):
                # Subscription expired / user unsubscribed in browser
                dead.append(sub["endpoint"])
                logger.info("removing expired subscription %s…", sub["endpoint"][:40])
            else:
                failed += 1
                logger.error(
                    "send failed (status=%s, endpoint=%s…): %s",
                    status,
                    sub["endpoint"][:40],
                    exc,
                )
        except Exception:
            failed += 1
            logger.exception("unexpected push error (endpoint=%s…)", sub["endpoint"][:40])

    _purge_dead(dead)
    if failed:
        logger.warning("push to user %s: %d/%d sends failed", user_id, failed, len(subs))
