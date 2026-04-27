import os

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import config
from app_version import get_app_version
from auth.router import router as auth_router
from database import init_db
from routers.alerts import router as alerts_router
from routers.chat import router as chat_router
from routers.contact import router as contact_router
from routers.indicators import router as indicators_router
from routers.market import router as market_router
from routers.paper import router as paper_router
from routers.portfolio import router as portfolio_router
from routers.public_landing import router as public_landing_router
from routers.push import router as push_router
from routers.release import router as release_router
from routers.ws import router as ws_router

app = FastAPI(title="Stock Agent API", version=get_app_version())

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(public_landing_router)
app.include_router(portfolio_router)
app.include_router(market_router)
app.include_router(indicators_router)
app.include_router(chat_router)
app.include_router(alerts_router)
app.include_router(push_router)
app.include_router(paper_router)
app.include_router(contact_router)
app.include_router(release_router)
app.include_router(ws_router)

_scheduler = AsyncIOScheduler()


@app.on_event("startup")
def startup():
    if os.getenv("RENDER") and "localhost" in config.FRONTEND_URL:
        print(
            "[config] WARNING: FRONTEND_URL is still localhost. "
            "In Render → Environment, set FRONTEND_URL to your Vercel site (e.g. https://....vercel.app) "
            "and redeploy, or verification emails will keep using localhost."
        )
    init_db()
    from services.alert_service import check_all_portfolios

    _scheduler.add_job(
        check_all_portfolios,
        "interval",
        minutes=config.ALERT_INTERVAL_MINUTES,
        id="portfolio_scan",
        replace_existing=True,
    )
    _scheduler.start()
    print(f"[scheduler] Signal scanner started — runs every {config.ALERT_INTERVAL_MINUTES} min")


@app.on_event("shutdown")
def shutdown():
    _scheduler.shutdown(wait=False)


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "version": get_app_version()}
