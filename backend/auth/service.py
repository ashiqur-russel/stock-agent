import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import bcrypt
from fastapi import HTTPException, status
from jose import JWTError, jwt

import config

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30
VERIFY_TOKEN_EXPIRE_HOURS = 24
FRONTEND_URL = "http://localhost:3000"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_jwt(user_id: int, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(user_id), "email": email, "exp": expire}
    return jwt.encode(payload, config.JWT_SECRET, algorithm=ALGORITHM)


def decode_jwt(token: str) -> dict:
    try:
        payload = jwt.decode(token, config.JWT_SECRET, algorithms=[ALGORITHM])
        return {"user_id": int(payload["sub"]), "email": payload["email"]}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def generate_verification_token() -> str:
    return secrets.token_urlsafe(32)


def send_verification_email(to_email: str, name: str, token: str):
    if not config.SMTP_USER or not config.SMTP_PASSWORD:
        print(
            f"[auth] SMTP not configured — verification link: {FRONTEND_URL}/verify?token={token}"
        )
        return

    verify_url = f"{FRONTEND_URL}/verify?token={token}"
    subject = "◈ Stock Agent — Verify your email"
    html = f"""
    <div style="font-family: monospace; background: #111; color: #eee; padding: 32px; border-radius: 8px; max-width: 520px;">
        <h2 style="color: #22c55e; margin-top: 0; letter-spacing: 1px;">◈ STOCK AGENT</h2>
        <p>Hi {name},</p>
        <p>Click the button below to verify your email address and activate your account.</p>
        <p>The link expires in <strong>24 hours</strong>.</p>
        <div style="margin: 28px 0;">
            <a href="{verify_url}" style="background: #22c55e; color: #000; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px;">
                Verify Email Address
            </a>
        </div>
        <p style="color: #666; font-size: 12px;">Or copy this link:<br><a href="{verify_url}" style="color: #22c55e;">{verify_url}</a></p>
        <hr style="border-color: #333; margin: 24px 0;">
        <p style="color: #555; font-size: 11px;">If you didn't create an account, ignore this email.</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = config.SMTP_USER
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT) as server:
            server.starttls()
            server.login(config.SMTP_USER, config.SMTP_PASSWORD)
            server.sendmail(config.SMTP_USER, to_email, msg.as_string())
        print(f"[auth] verification email sent to {to_email}")
    except Exception as e:
        print(f"[auth] email send failed: {e}")
