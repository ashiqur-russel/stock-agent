from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, status
from database import get_connection
from auth.models import RegisterRequest, LoginRequest, TokenResponse, VerificationPending, ResendRequest
from auth import service

router = APIRouter(prefix="/auth", tags=["auth"])

SMTP_CONFIGURED = bool(service.config.SMTP_USER and service.config.SMTP_PASSWORD)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest):
    with get_connection() as conn:
        if conn.execute("SELECT id FROM users WHERE email=?", (body.email,)).fetchone():
            raise HTTPException(400, "Email already registered")

        password_hash = service.hash_password(body.password)
        cursor = conn.execute(
            "INSERT INTO users (email, name, password_hash, is_verified) VALUES (?,?,?,?)",
            (body.email, body.name, password_hash, 0 if SMTP_CONFIGURED else 1),
        )
        user_id = cursor.lastrowid
        conn.commit()

    if SMTP_CONFIGURED:
        token = service.generate_verification_token()
        expires = (datetime.now(timezone.utc) + timedelta(hours=service.VERIFY_TOKEN_EXPIRE_HOURS)).isoformat()
        with get_connection() as conn:
            conn.execute(
                "INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?,?,?)",
                (user_id, token, expires),
            )
            conn.commit()
        service.send_verification_email(body.email, body.name, token)
        return VerificationPending(email=body.email, message="Check your email to verify your account")

    # SMTP not configured — auto-verify for local dev
    jwt_token = service.create_jwt(user_id, body.email)
    return TokenResponse(access_token=jwt_token, user_id=user_id, name=body.name, email=body.email)


@router.get("/verify")
def verify_email(token: str):
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM email_verifications WHERE token=? AND used=0",
            (token,),
        ).fetchone()

        if not row:
            raise HTTPException(400, "Invalid or already used verification link")

        expires = datetime.fromisoformat(row["expires_at"])
        if expires.tzinfo is None:
            expires = expires.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires:
            raise HTTPException(400, "Verification link has expired — request a new one")

        conn.execute("UPDATE users SET is_verified=1 WHERE id=?", (row["user_id"],))
        conn.execute("UPDATE email_verifications SET used=1 WHERE id=?", (row["id"],))
        conn.commit()

        user = conn.execute("SELECT id, email, name FROM users WHERE id=?", (row["user_id"],)).fetchone()

    jwt_token = service.create_jwt(user["id"], user["email"])
    return TokenResponse(access_token=jwt_token, user_id=user["id"], name=user["name"], email=user["email"])


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
    expires = (datetime.now(timezone.utc) + timedelta(hours=service.VERIFY_TOKEN_EXPIRE_HOURS)).isoformat()
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

    if not row or not service.verify_password(body.password, row["password_hash"]):
        raise HTTPException(401, "Invalid email or password")

    if not row["is_verified"]:
        raise HTTPException(403, "Please verify your email before logging in")

    jwt_token = service.create_jwt(row["id"], body.email)
    return TokenResponse(access_token=jwt_token, user_id=row["id"], name=row["name"], email=body.email)
