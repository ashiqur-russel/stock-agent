import os
from email.utils import formataddr

from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

# Groq Cloud org-level limits (Free tier defaults for meta-llama/llama-4-scout-17b-16e-instruct).
# Override if your Groq plan differs. Fair-share splits these across users with AI chat enabled.
GROQ_ORG_RPM: int = int(os.getenv("GROQ_ORG_RPM", "30"))
GROQ_ORG_RPD: int = int(os.getenv("GROQ_ORG_RPD", "1000"))
GROQ_ORG_TPM: int = int(os.getenv("GROQ_ORG_TPM", "30000"))
GROQ_ORG_TPD: int = int(os.getenv("GROQ_ORG_TPD", "500000"))

# Set GROQ_QUOTA_ENABLED=0 to disable per-user fair share (still retries on 429).
GROQ_QUOTA_ENABLED: bool = os.getenv("GROQ_QUOTA_ENABLED", "1").strip().lower() in (
    "1",
    "true",
    "yes",
)


def _groq_quota_bucket() -> str:
    """How to bucket token/request fair-share: calendar UTC day or rolling 1h / 2h window."""
    v = os.getenv("GROQ_QUOTA_BUCKET", "day").strip().lower()
    if v in ("1h", "hour", "1hour", "60m"):
        return "1h"
    if v in ("2h", "2hour", "120m"):
        return "2h"
    return "day"


# day | 1h | 2h — Groq RPD/TPD reset daily on their side; we align day bucket to UTC date.
# Shorter windows use a proportional slice of each user's daily share (e.g. TPD×1/24 per hour).
GROQ_QUOTA_BUCKET: str = _groq_quota_bucket()

JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production")
DATABASE_PATH: str = os.getenv("DATABASE_PATH", "./portfolio.db")

# Future: German listing quotes beyond Yahoo (e.g. Deutsche Börse MDS, vendor API).
# Real-time exchange data is licensed; there is no built-in free realtime Xetra REST.
# QUOTE_PROVIDER_DE = os.getenv("QUOTE_PROVIDER_DE", "yfinance")  # yfinance | custom
# DEUTSCHE_BOERSE_API_KEY = os.getenv("DEUTSCHE_BOERSE_API_KEY", "")


def _cors_origins() -> list[str]:
    raw = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]


CORS_ORIGINS: list[str] = _cors_origins()

# Public URL of the Next.js app (no trailing path). Used in verification and password-reset links.
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000").rstrip("/")

# Email / SMTP (optional — leave blank to disable email alerts)
SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER: str = os.getenv("SMTP_USER", "")
SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "").replace(" ", "").replace(" ", "")
# Display name in inbox (Gmail: must still send as SMTP_USER; name is for display)
SMTP_FROM_NAME: str = os.getenv("SMTP_FROM_NAME", "Stock Agent").strip()


def smtp_from_header() -> str:
    if not SMTP_USER:
        return ""
    if SMTP_FROM_NAME:
        return formataddr((SMTP_FROM_NAME, SMTP_USER))
    return SMTP_USER


# How often the background scanner runs (minutes)
ALERT_INTERVAL_MINUTES: int = int(os.getenv("ALERT_INTERVAL_MINUTES", "30"))

# Web Push / VAPID — generate once with backend/tools/generate_vapid_keys.py
# Leave blank to disable browser push (email + WS toasts still work)
VAPID_PRIVATE_KEY: str = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_PUBLIC_KEY: str = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_SUBJECT: str = os.getenv(
    "VAPID_SUBJECT", f"mailto:{SMTP_USER}" if SMTP_USER else "mailto:admin@example.com"
)
