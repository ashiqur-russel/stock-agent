"""Public contact form endpoint — no auth required."""

from __future__ import annotations

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from html import escape

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field, field_validator

import config
from middleware.rate_limit import RateLimiter

router = APIRouter(prefix="/contact", tags=["contact"])


class ContactMessage(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    message: str = Field(min_length=1, max_length=2000)

    @field_validator("name")
    @classmethod
    def no_header_injection(cls, v: str) -> str:
        # Newlines in the display name would let attackers inject SMTP headers
        # (extra To/Cc/Bcc) via the Reply-To we build below.
        if "\r" in v or "\n" in v:
            raise ValueError("Invalid name")
        return v.strip()


def _send_contact_email(name: str, from_email: str, message: str) -> None:
    to = config.SMTP_USER
    subject = f"◈ Stock Agent — Message from {name}"
    html = f"""
    <div style="font-family: monospace; background: #111; color: #eee; padding: 32px; border-radius: 8px; max-width: 600px;">
        <h2 style="color: #22c55e; margin-top: 0;">◈ STOCK AGENT — Contact</h2>
        <p><strong>From:</strong> {escape(name)} &lt;{escape(from_email)}&gt;</p>
        <hr style="border-color: #333; margin: 16px 0;">
        <p style="white-space: pre-wrap; line-height: 1.7;">{escape(message)}</p>
        <hr style="border-color: #333; margin: 16px 0;">
        <p style="color: #555; font-size: 11px;">Sent via StockAgent contact form</p>
    </div>
    """
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = config.smtp_from_header()
    msg["To"] = to
    msg["Reply-To"] = formataddr((name, from_email))
    msg.attach(MIMEText(html, "html"))
    try:
        with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT) as server:
            server.starttls()
            server.login(config.SMTP_USER, config.SMTP_PASSWORD)
            server.sendmail(config.SMTP_USER, to, msg.as_string())
        print(f"[contact] message from {name} ({from_email}) delivered")
    except Exception as e:
        print(f"[contact] email send failed: {e}")
        raise HTTPException(500, "Failed to send message — please try again later")


@router.post("", dependencies=[Depends(RateLimiter(3, minutes=10))])
def send_contact(body: ContactMessage):
    name = body.name
    email = body.email.strip()
    message = body.message.strip()

    if not config.SMTP_USER or not config.SMTP_PASSWORD:
        print(f"[contact] SMTP not configured — message from {name} ({email}): {message[:80]}…")
        return {"message": "Message received"}

    _send_contact_email(name, email, message)
    return {"message": "Message sent — we will get back to you soon!"}
