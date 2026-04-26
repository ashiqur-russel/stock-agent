from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status

import config
from auth import service
from auth.models import (
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResendRequest,
    ResetPasswordRequest,
    TokenResponse,
    VerificationPending,
)
from database import get_connection

router = APIRouter(prefix="/auth", tags=["auth"])

SMTP_CONFIGURED = bool(service.config.SMTP_USER and service.config.SMTP_PASSWORD)

_MSG_EMAIL_EXISTS = (
    "An account with this email already exists. Try signing in or use Forgot password "
    "if you need to reset your password."
)
_MSG_NO_ACCOUNT = "No account found for this email. Please register first."
_MSG_BAD_PASSWORD = "Incorrect password."
_MSG_NO_ACCOUNT_RESET = "No account is registered with this email. Please register first."


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest):
    with get_connection() as conn:
        if conn.execute("SELECT id FROM users WHERE email=?", (body.email,)).fetchone():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, _MSG_EMAIL_EXISTS)

        password_hash = service.hash_password(body.password)
        cur = conn.execute(
            "INSERT INTO users (email, name, password_hash, is_verified) VALUES (?,?,?,?) RETURNING id",
            (body.email, body.name, password_hash, 0),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(500, "Failed to create user")
        user_id = row["id"]
        conn.commit()

    token = service.generate_verification_token()
    expires = (
        datetime.now(timezone.utc) + timedelta(hours=service.VERIFY_TOKEN_EXPIRE_HOURS)
    ).isoformat()
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?,?,?)",
            (user_id, token, expires),
        )
        conn.commit()

    if SMTP_CONFIGURED:
        service.send_verification_email(body.email, body.name, token)
    else:
        verify_url = f"{config.FRONTEND_URL}/verify?token={token}"
        print(f"[auth] SMTP not configured — visit this link to verify: {verify_url}")

    return VerificationPending(email=body.email, message="Check your email to verify your account")


@router.get("/verify")
def verify_email(token: str):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM email_verifications WHERE token=? AND used=0",
            (token,),
        ).fetchone()

        if not row:
            raise HTTPException(400, "Invalid or already used verification link")

        raw_exp = row["expires_at"]
        if isinstance(raw_exp, datetime):
            expires = raw_exp
        else:
            expires = datetime.fromisoformat(str(raw_exp))
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(400, "Verification link has expired — request a new one")

        conn.execute("UPDATE users SET is_verified=1 WHERE id=?", (row["user_id"],))
        conn.execute("UPDATE email_verifications SET used=1 WHERE id=?", (row["id"],))
        conn.commit()

        user = conn.execute(
            "SELECT id, email, name FROM users WHERE id=?", (row["user_id"],)
        ).fetchone()

    print(f"[auth] GET /auth/verify succeeded — user_id={user['id']} email={user['email']}")

    jwt_token = service.create_jwt(user["id"], user["email"])
    return TokenResponse(
        access_token=jwt_token,
        user_id=user["id"],
        name=user["name"],
        email=user["email"],
    )


@router.post("/resend-verification")
def resend_verification(body: ResendRequest):
    with get_connection() as conn:
        user = conn.execute(
            "SELECT id, name, is_verified FROM users WHERE email=?", (body.email,)
        ).fetchone()

    if not user:
        # Don't reveal whether email exists
        return {"message": "If this email exists, a verification link has been sent"}
    if user["is_verified"]:
        return {"message": "Account is already verified"}

    token = service.generate_verification_token()
    expires = (
        datetime.now(timezone.utc) + timedelta(hours=service.VERIFY_TOKEN_EXPIRE_HOURS)
    ).isoformat()
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?,?,?)",
            (user["id"], token, expires),
        )
        conn.commit()

    service.send_verification_email(body.email, user["name"], token)
    return {"message": "Verification email sent"}


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT id, name, password_hash, is_verified FROM users WHERE email=?",
            (body.email,),
        ).fetchone()

    if not row:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, _MSG_NO_ACCOUNT)

    if not service.verify_password(body.password, row["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, _MSG_BAD_PASSWORD)

    if not row["is_verified"]:
        raise HTTPException(403, "Please verify your email before logging in")

    jwt_token = service.create_jwt(row["id"], body.email)
    return TokenResponse(
        access_token=jwt_token, user_id=row["id"], name=row["name"], email=body.email
    )


@router.post("/forgot-password")
def forgot_password(body: ForgotPasswordRequest):
    with get_connection() as conn:
        user = conn.execute(
            "SELECT id, name, email FROM users WHERE email=?", (body.email,)
        ).fetchone()

    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, _MSG_NO_ACCOUNT_RESET)

    token = service.generate_verification_token()
    expires = (
        datetime.now(timezone.utc) + timedelta(hours=service.RESET_TOKEN_EXPIRE_HOURS)
    ).isoformat()
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?,?,?)",
            (user["id"], token, expires),
        )
        conn.commit()

    if SMTP_CONFIGURED:
        service.send_password_reset_email(user["email"], user["name"], token)
    else:
        reset_url = f"{config.FRONTEND_URL}/reset-password?token={token}"
        print(f"[auth] SMTP not configured — password reset link: {reset_url}")

    return {"message": "Check your email for a link to reset your password."}


@router.post("/reset-password")
def reset_password(body: ResetPasswordRequest):
    if len(body.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")

    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM password_resets WHERE token=? AND used=0",
            (body.token,),
        ).fetchone()

        if not row:
            raise HTTPException(400, "Invalid or already used reset link")

        raw_exp = row["expires_at"]
        if isinstance(raw_exp, datetime):
            expires = raw_exp
        else:
            expires = datetime.fromisoformat(str(raw_exp))
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(400, "Reset link has expired — request a new one")

        new_hash = service.hash_password(body.password)
        conn.execute("UPDATE users SET password_hash=? WHERE id=?", (new_hash, row["user_id"]))
        conn.execute("UPDATE password_resets SET used=1 WHERE id=?", (row["id"],))
        conn.commit()

    print(f"[auth] password reset completed for user_id={row['user_id']}")
    return {"message": "Password updated. You can sign in now."}
