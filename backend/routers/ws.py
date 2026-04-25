import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from fastapi import HTTPException

from auth.service import decode_jwt
from services.portfolio_service import get_portfolio_for_user
from services.market_data import fetch_quote
from services.technical import run_swing_analysis

router = APIRouter()

# Streaming intervals for the lightweight /ws/prices endpoint. yfinance is
# rate-limited and not a true tick feed, so we keep a small but visible cadence
# during market hours and back off significantly when markets are closed.
PRICES_TICK_INTERVAL_OPEN = 5      # seconds between price polls during US market hours
PRICES_TICK_INTERVAL_CLOSED = 30   # seconds between polls outside market hours
PRICES_MAX_TICKERS = 50            # safety cap per connection

PRICE_MOVE_THRESHOLD = 2.0  # % intraday move to trigger alert
SIGNAL_CHECK_INTERVAL = 600  # recompute full analysis every 10 min
MARKET_HOURS_INTERVAL = 30   # seconds between checks during market hours
OFF_HOURS_INTERVAL = 300     # seconds between checks outside market hours


def is_market_open() -> bool:
    """US market: Mon–Fri 14:30–21:00 UTC (9:30am–4pm EST)."""
    now = datetime.now(timezone.utc)
    if now.weekday() >= 5:
        return False
    minutes = now.hour * 60 + now.minute
    return 14 * 60 + 30 <= minutes < 21 * 60


@router.websocket("/api/v1/ws/alerts")
async def ws_alerts(websocket: WebSocket, token: str = Query(...)):
    try:
        user = decode_jwt(token)
    except HTTPException:
        await websocket.close(code=4001)
        return

    await websocket.accept()
    user_id = user["user_id"]

    # Load portfolio tickers
    try:
        portfolio = await asyncio.to_thread(get_portfolio_for_user, user_id)
        tickers = [h["ticker"] for h in portfolio if h.get("shares_held", 0) > 0]
    except Exception:
        tickers = []

    # Run initial swing analysis in background threads (parallel)
    analysis_cache: dict = {}
    if tickers:
        results = await asyncio.gather(
            *[asyncio.to_thread(run_swing_analysis, t) for t in tickers],
            return_exceptions=True,
        )
        for ticker, result in zip(tickers, results):
            if not isinstance(result, Exception) and "error" not in result:
                analysis_cache[ticker] = result

    last_prices: dict[str, float] = {
        t: analysis_cache[t]["current_price"]
        for t in analysis_cache
        if "current_price" in analysis_cache[t]
    }
    last_signal_check = asyncio.get_event_loop().time()

    await websocket.send_json({
        "type": "connected",
        "tickers": tickers,
        "market_open": is_market_open(),
    })

    try:
        while True:
            market_open = is_market_open()
            interval = MARKET_HOURS_INTERVAL if market_open else OFF_HOURS_INTERVAL
            await asyncio.sleep(interval)

            now_loop = asyncio.get_event_loop().time()

            # Fetch all live quotes in parallel
            quotes = await asyncio.gather(
                *[asyncio.to_thread(fetch_quote, t) for t in tickers],
                return_exceptions=True,
            )

            for ticker, quote in zip(tickers, quotes):
                if isinstance(quote, Exception):
                    continue

                price = quote.get("current_price", 0)
                prev = last_prices.get(ticker, price)
                pct = (price - prev) / prev * 100 if prev else 0
                last_prices[ticker] = price

                analysis = analysis_cache.get(ticker, {})
                support = analysis.get("key_support")
                resistance = analysis.get("key_resistance")

                # Price update (always sent)
                await websocket.send_json({
                    "type": "price_update",
                    "ticker": ticker,
                    "price": price,
                    "change_pct": round(pct, 2),
                    "day_change_pct": quote.get("day_change_pct", 0),
                    "market_open": market_open,
                })

                if not market_open:
                    continue

                # Intraday move alert
                if abs(pct) >= PRICE_MOVE_THRESHOLD:
                    direction = "SHARP RALLY" if pct > 0 else "SHARP DROP"
                    await websocket.send_json({
                        "type": "price_alert",
                        "ticker": ticker,
                        "title": f"{direction}: {ticker}",
                        "message": f"Price moved {pct:+.2f}% to €{price:.4f} in last {interval}s",
                        "severity": "high",
                    })

                # Support broken
                if support and prev > support and price <= support:
                    await websocket.send_json({
                        "type": "price_alert",
                        "ticker": ticker,
                        "title": f"SUPPORT BROKEN: {ticker}",
                        "message": f"Price €{price:.4f} broke below key support €{support:.4f} — consider stop-loss",
                        "severity": "critical",
                    })

                # Resistance broken
                if resistance and prev < resistance and price >= resistance:
                    await websocket.send_json({
                        "type": "price_alert",
                        "ticker": ticker,
                        "title": f"BREAKOUT: {ticker}",
                        "message": f"Price €{price:.4f} broke above resistance €{resistance:.4f} — potential breakout",
                        "severity": "high",
                    })

            # Full signal recheck every 10 min
            if now_loop - last_signal_check >= SIGNAL_CHECK_INTERVAL:
                last_signal_check = now_loop
                new_analyses = await asyncio.gather(
                    *[asyncio.to_thread(run_swing_analysis, t) for t in tickers],
                    return_exceptions=True,
                )
                for ticker, new_a in zip(tickers, new_analyses):
                    if isinstance(new_a, Exception) or "error" in new_a:
                        continue
                    old_signal = analysis_cache.get(ticker, {}).get("swing_setup_quality")
                    new_signal = new_a.get("swing_setup_quality")
                    analysis_cache[ticker] = new_a
                    if old_signal and new_signal and old_signal != new_signal:
                        await websocket.send_json({
                            "type": "signal_change",
                            "ticker": ticker,
                            "title": f"Signal Changed: {ticker}",
                            "old_signal": old_signal,
                            "new_signal": new_signal,
                            "message": f"{old_signal.upper()} → {new_signal.upper()}",
                            "severity": "high",
                        })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[ws] connection error: {e}")


# ---------------------------------------------------------------------------
# Live prices stream
#
# A lightweight WebSocket that broadcasts live(-ish) prices for whatever set
# of tickers the client subscribes to. The client can update its subscription
# at any time by sending {"action": "subscribe", "tickers": ["AAPL", "BTC-USD"]}.
# This is the producer behind the Webull/TradingView-style "live ticking" UI on
# the dashboard and paper-trading pages.
# ---------------------------------------------------------------------------


async def _broadcast_prices(websocket: WebSocket, tickers: list[str], market_open: bool) -> None:
    if not tickers:
        return
    quotes = await asyncio.gather(
        *[asyncio.to_thread(fetch_quote, t) for t in tickers],
        return_exceptions=True,
    )
    payload = []
    for ticker, quote in zip(tickers, quotes):
        if isinstance(quote, Exception):
            continue
        payload.append({
            "ticker": ticker,
            "current_price": quote.get("current_price", 0),
            "current_price_usd": quote.get("current_price_usd", 0),
            "day_change_pct": quote.get("day_change_pct", 0),
            "eur_rate": quote.get("eur_rate", 0.91),
        })
    await websocket.send_json({
        "type": "prices",
        "market_open": market_open,
        "ts": datetime.now(timezone.utc).isoformat(),
        "quotes": payload,
    })


@router.websocket("/api/v1/ws/prices")
async def ws_prices(websocket: WebSocket, token: str = Query(...)):
    try:
        decode_jwt(token)
    except HTTPException:
        await websocket.close(code=4001)
        return

    await websocket.accept()

    subscribed: set[str] = set()
    pending_change = asyncio.Event()

    async def reader() -> None:
        """Listens for subscribe / unsubscribe messages from the client."""
        while True:
            msg = await websocket.receive_text()
            try:
                data = json.loads(msg)
            except json.JSONDecodeError:
                continue
            action = data.get("action")
            tickers = data.get("tickers") or []
            if not isinstance(tickers, list):
                continue
            normalized = [str(t).strip().upper() for t in tickers if str(t).strip()]
            if action == "subscribe":
                for t in normalized:
                    if len(subscribed) >= PRICES_MAX_TICKERS:
                        break
                    subscribed.add(t)
                pending_change.set()
            elif action == "unsubscribe":
                for t in normalized:
                    subscribed.discard(t)
                pending_change.set()
            elif action == "set":
                subscribed.clear()
                for t in normalized[:PRICES_MAX_TICKERS]:
                    subscribed.add(t)
                pending_change.set()

    reader_task = asyncio.create_task(reader())

    await websocket.send_json({
        "type": "connected",
        "market_open": is_market_open(),
        "tick_interval": PRICES_TICK_INTERVAL_OPEN,
    })

    try:
        while True:
            market_open = is_market_open()
            tickers = sorted(subscribed)
            if tickers:
                try:
                    await _broadcast_prices(websocket, tickers, market_open)
                except Exception as e:
                    print(f"[ws/prices] broadcast error: {e}")

            interval = PRICES_TICK_INTERVAL_OPEN if market_open else PRICES_TICK_INTERVAL_CLOSED
            # Wake early if the client changed its subscription so the new
            # tickers are reflected in the next push without waiting a full tick.
            try:
                await asyncio.wait_for(pending_change.wait(), timeout=interval)
            except asyncio.TimeoutError:
                pass
            pending_change.clear()
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[ws/prices] connection error: {e}")
    finally:
        reader_task.cancel()
