from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler

import config
from database import init_db
from auth.router import router as auth_router
from routers.portfolio import router as portfolio_router
from routers.market import router as market_router
from routers.indicators import router as indicators_router
from routers.chat import router as chat_router
from routers.alerts import router as alerts_router

app = FastAPI(title="Stock Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(portfolio_router)
app.include_router(market_router)
app.include_router(indicators_router)
app.include_router(chat_router)
app.include_router(alerts_router)

_scheduler = AsyncIOScheduler()


@app.on_event("startup")
def startup():
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
    return {"status": "ok"}
