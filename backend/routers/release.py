"""App version and What's New (release notes + per-user dismiss state)."""

from fastapi import APIRouter, Depends, HTTPException, Query

from app_version import get_app_version
from database import get_connection
from middleware.auth import get_current_user
from services.release_notes import notes_for_version, should_show_whats_new

router = APIRouter(prefix="/api/v1", tags=["release"])


@router.get("/release/version")
def public_version():
    """Public app version (matches frontend package.json when synced)."""
    return {"version": get_app_version()}


@router.get("/release/whats-new")
def get_whats_new(
    user=Depends(get_current_user),
    lang: str = Query("en", pattern="^(en|de)$"),
):
    v = get_app_version()
    user_id = user["user_id"]
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT whats_new_cleared_version, whats_new_read_version
            FROM user_settings WHERE user_id=?
            """,
            (user_id,),
        ).fetchone()
    cleared = None
    read_v = None
    if row:
        cleared = row["whats_new_cleared_version"]
        read_v = row["whats_new_read_version"]
        if cleared is not None and not str(cleared).strip():
            cleared = None
        if read_v is not None and not str(read_v).strip():
            read_v = None

    notes = notes_for_version(v, lang=lang)
    show = bool(notes) and should_show_whats_new(v, cleared, read_v)
    return {
        "app_version": v,
        "should_show": show,
        "release": notes,
        "cleared_up_to": cleared,
        "read_up_to": read_v,
    }


@router.post("/release/whats-new/dismiss")
def dismiss_whats_new(
    body: dict,
    user=Depends(get_current_user),
):
    """
    * action=done — user finished reading; hide until next app version (marks read + cleared).
    * action=suppress — user chose \"don't show this version\"; hide until next version (does not mark read).
    """
    action: str | None = body.get("action")
    if action not in ("done", "suppress"):
        raise HTTPException(status_code=400, detail="action must be 'done' or 'suppress'")

    v = get_app_version()
    user_id = user["user_id"]

    with get_connection() as conn:
        row = conn.execute(
            "SELECT user_id FROM user_settings WHERE user_id=?",
            (user_id,),
        ).fetchone()
        if not row:
            conn.execute(
                """INSERT INTO user_settings (user_id, market_region, whats_new_cleared_version, whats_new_read_version)
                   VALUES (?, 'DE', ?, ?)""",
                (
                    user_id,
                    v,
                    v if action == "done" else None,
                ),
            )
        else:
            if action == "done":
                conn.execute(
                    """UPDATE user_settings SET
                         whats_new_cleared_version=?,
                         whats_new_read_version=?
                       WHERE user_id=?""",
                    (v, v, user_id),
                )
            else:
                conn.execute(
                    """UPDATE user_settings SET whats_new_cleared_version=?
                       WHERE user_id=?""",
                    (v, user_id),
                )
        conn.commit()

    return {"ok": True, "app_version": v, "action": action}
