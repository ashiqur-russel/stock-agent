from fastapi import APIRouter, Depends
from middleware.auth import get_current_user
from database import get_connection

router = APIRouter(prefix="/api/v1", tags=["alerts"])


@router.get("/alerts")
def get_alerts(user=Depends(get_current_user)):
    user_id = user["user_id"]
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM alerts WHERE user_id=? ORDER BY created_at DESC LIMIT 50",
            (user_id,),
        ).fetchall()
    return [dict(r) for r in rows]


@router.get("/alerts/unread-count")
def get_unread_count(user=Depends(get_current_user)):
    user_id = user["user_id"]
    with get_connection() as conn:
        count = conn.execute(
            "SELECT COUNT(*) as cnt FROM alerts WHERE user_id=? AND is_read=0",
            (user_id,),
        ).fetchone()["cnt"]
    return {"count": count}


@router.patch("/alerts/read-all")
def mark_all_read(user=Depends(get_current_user)):
    user_id = user["user_id"]
    with get_connection() as conn:
        conn.execute("UPDATE alerts SET is_read=1 WHERE user_id=?", (user_id,))
        conn.commit()
    return {"ok": True}


@router.patch("/alerts/{alert_id}/read")
def mark_read(alert_id: int, user=Depends(get_current_user)):
    user_id = user["user_id"]
    with get_connection() as conn:
        conn.execute(
            "UPDATE alerts SET is_read=1 WHERE id=? AND user_id=?",
            (alert_id, user_id),
        )
        conn.commit()
    return {"ok": True}


@router.get("/settings/notifications")
def get_notification_settings(user=Depends(get_current_user)):
    user_id = user["user_id"]
    with get_connection() as conn:
        row = conn.execute(
            "SELECT notify_email, email_alerts FROM user_settings WHERE user_id=?",
            (user_id,),
        ).fetchone()
    if row:
        return {"notify_email": row["notify_email"], "email_alerts": bool(row["email_alerts"])}
    return {"notify_email": None, "email_alerts": True}


@router.put("/settings/notifications")
def update_notification_settings(body: dict, user=Depends(get_current_user)):
    user_id = user["user_id"]
    notify_email = body.get("notify_email")
    email_alerts = 1 if body.get("email_alerts", True) else 0
    with get_connection() as conn:
        conn.execute(
            """INSERT INTO user_settings (user_id, notify_email, email_alerts)
               VALUES (?, ?, ?)
               ON CONFLICT(user_id) DO UPDATE SET
                   notify_email=excluded.notify_email,
                   email_alerts=excluded.email_alerts""",
            (user_id, notify_email, email_alerts),
        )
        conn.commit()
    return {"ok": True}
