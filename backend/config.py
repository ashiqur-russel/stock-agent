import os
from email.utils import formataddr

from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production")
DATABASE_PATH: str = os.getenv("DATABASE_PATH", "./portfolio.db")


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
