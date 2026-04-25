import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
JWT_SECRET: str = os.getenv("JWT_SECRET", "change-me-in-production")
DATABASE_PATH: str = os.getenv("DATABASE_PATH", "./portfolio.db")
CORS_ORIGINS: list[str] = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# Email / SMTP (optional — leave blank to disable email alerts)
SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER: str = os.getenv("SMTP_USER", "")
SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "").replace(" ", "").replace(" ", "")

# How often the background scanner runs (minutes)
ALERT_INTERVAL_MINUTES: int = int(os.getenv("ALERT_INTERVAL_MINUTES", "30"))
