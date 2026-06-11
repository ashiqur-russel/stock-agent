import asyncio

from fastapi import APIRouter, Depends

from middleware.auth import get_current_user
from services.technical import compute_indicators, run_swing_analysis
from utils.validation import normalize_ticker

router = APIRouter(prefix="/api/v1/indicators", tags=["indicators"])

# Both endpoints download months of price history and compute indicators —
# run on the default executor instead of tying up sync-endpoint threads.


@router.get("/{ticker}")
async def get_indicators(ticker: str, user=Depends(get_current_user)):
    return await asyncio.to_thread(compute_indicators, normalize_ticker(ticker))


@router.get("/{ticker}/swing")
async def get_swing_analysis(ticker: str, user=Depends(get_current_user)):
    return await asyncio.to_thread(run_swing_analysis, normalize_ticker(ticker))
