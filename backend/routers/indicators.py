from fastapi import APIRouter, Depends

from middleware.auth import get_current_user
from services.technical import compute_indicators, run_swing_analysis

router = APIRouter(prefix="/api/v1/indicators", tags=["indicators"])


@router.get("/{ticker}")
def get_indicators(ticker: str, user=Depends(get_current_user)):
    return compute_indicators(ticker.upper())


@router.get("/{ticker}/swing")
def get_swing_analysis(ticker: str, user=Depends(get_current_user)):
    return run_swing_analysis(ticker.upper())
