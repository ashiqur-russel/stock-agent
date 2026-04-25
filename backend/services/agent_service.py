import json

from groq import Groq

import config
from services import market_data, portfolio_service, technical
from tools.definitions import TOOL_DEFINITIONS

_client = Groq(api_key=config.GROQ_API_KEY)
MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

_SYSTEM_PROMPT_TEMPLATE = """You are a personal swing-trading advisor for a retail investor.

The user's current portfolio:
{portfolio_summary}

Your job: provide clear, actionable swing trading guidance for any stock the user asks about.
Swing trading = holding positions for days to a few weeks to capture medium-term price moves.

The user's app display currency is {display_ccy} — in your written answer, quote every price in that currency and use the {display_sym} symbol only (do not use $ for euros or € for US dollars). Tool results are pre-normalized to {display_ccy}.

RULES:
1. Always call tools to get live data before giving analysis — never guess or use memorized prices.
2. When asked about a stock, call analyze_swing_setup first, then explain your reasoning.
3. Structure answers: (a) Current situation, (b) Key levels to watch, (c) What you would do and why, (d) What would change your view.
4. Be direct — "take partial profit here" not "you might consider...".
5. Always mention a stop-loss level below key support.
6. If the user asks about a ticker not in their portfolio, still analyze it — they may be considering it.
7. Mention once if asked for formal advice that you are not a licensed financial advisor, then give your best analysis anyway.
8. Keep responses focused and practical. No fluff.
9. Data provenance: All price, chart, and indicator values in tool results are derived from Yahoo Finance market data (Python yfinance: historical OHLC, latest quote, and Yahoo Finance news headlines for sentiment). EUR vs USD in the app uses a live EUR/USD cross rate from the same stack. The Groq model reasons on top of these tool outputs. If the user asks where the data comes from, say so plainly — do not use vague phrases like "the provided data" without naming Yahoo Finance / yfinance."""


def _eur_per_usd(ticker: str) -> float:
    q = market_data.fetch_quote(ticker)
    return float(q.get("eur_rate") or 0.91)


def _format_holding_line(h: dict, currency: str) -> str:
    t = h["ticker"]
    sh = h["shares_held"]
    pnl_sign = "+" if h["unrealized_pnl"] >= 0 else ""
    r = float(h.get("eur_rate") or 0.91)
    if currency == "USD":
        sym = "$"
        avg = h["avg_cost"] / r
        cur = float(h.get("current_price_usd") or h["current_price"] / r)
    else:
        sym = "€"
        avg = h["avg_cost"]
        cur = h["current_price"]
    return (
        f"  - {t}: {sh} shares @ avg {sym}{avg:.2f} | current {sym}{cur:.2f} | P&L {pnl_sign}{h['unrealized_pnl_pct']:.1f}%"
    )


def _build_system_prompt(user_id: int, currency: str) -> str:
    display_sym = "€" if currency == "EUR" else "$"
    display_ccy = "EUR (euros)" if currency == "EUR" else "USD (US dollars)"
    try:
        holdings = portfolio_service.get_portfolio_for_user(user_id)
        if holdings:
            lines = [_format_holding_line(h, currency) for h in holdings]
            summary = "\n".join(lines)
        else:
            summary = "  (No positions yet — user may be asking about stocks they're considering)"
    except Exception:
        summary = "  (Could not load portfolio)"
    return _SYSTEM_PROMPT_TEMPLATE.format(
        portfolio_summary=summary,
        display_sym=display_sym,
        display_ccy=display_ccy,
    )


def _simplify_portfolio_for_currency(holdings: list, currency: str) -> list[dict]:
    out: list[dict] = []
    for h in holdings:
        r = float(h.get("eur_rate") or 0.91)
        if currency == "USD":
            out.append(
                {
                    "ticker": h["ticker"],
                    "shares_held": h["shares_held"],
                    "avg_cost": round(h["avg_cost"] / r, 4),
                    "current_price": round(float(h.get("current_price_usd", h["current_price"] / r)), 4),
                    "market_value": round(h["market_value"] / r, 2) if h.get("market_value") is not None else None,
                    "unrealized_pnl": round(h["unrealized_pnl"] / r, 2) if h.get("unrealized_pnl") is not None else None,
                    "unrealized_pnl_pct": h["unrealized_pnl_pct"],
                    "realized_pnl": round(h.get("realized_pnl", 0) / r, 2),
                    "day_change_pct": h.get("day_change_pct"),
                    "display_currency": "USD",
                }
            )
        else:
            out.append(
                {
                    "ticker": h["ticker"],
                    "shares_held": h["shares_held"],
                    "avg_cost": h["avg_cost"],
                    "current_price": h["current_price"],
                    "market_value": h.get("market_value"),
                    "unrealized_pnl": h.get("unrealized_pnl"),
                    "unrealized_pnl_pct": h["unrealized_pnl_pct"],
                    "realized_pnl": h.get("realized_pnl"),
                    "day_change_pct": h.get("day_change_pct"),
                    "display_currency": "EUR",
                }
            )
    return out


def _adjust_swing_for_currency(result: dict, currency: str, ticker: str) -> dict:
    if "error" in result or not ticker:
        return result
    rate = _eur_per_usd(ticker)
    out = dict(result)
    out["prices_in"] = currency
    out["display_currency"] = currency
    keys = ("current_price", "key_support", "key_resistance", "ema_20", "ema_50")
    if currency == "EUR":
        for k in keys:
            if out.get(k) is not None:
                out[k] = round(out[k] * rate, 4)
    return out


def _adjust_technical_for_currency(result: dict, currency: str, ticker: str) -> dict:
    if "error" in result or not ticker:
        return result
    rate = _eur_per_usd(ticker)
    out = dict(result)
    out["prices_in"] = currency
    out["display_currency"] = currency
    if currency != "EUR":
        return out
    for k in ("current_price", "ema_20", "ema_50"):
        if out.get(k) is not None:
            out[k] = round(out[k] * rate, 4)
    b = out.get("bollinger")
    if isinstance(b, dict):
        b2 = dict(b)
        for k in ("upper", "middle", "lower"):
            if b2.get(k) is not None:
                b2[k] = round(b2[k] * rate, 4)
        out["bollinger"] = b2
    return out


def _adjust_ohlcv_for_currency(rows: list, currency: str, ticker: str) -> dict:
    if not rows:
        return {"candles": [], "prices_in": currency, "display_currency": currency}
    rate = _eur_per_usd(ticker)
    # market_data.fetch_ohlcv stores OHLC in EUR (USD * eur_rate)
    if currency == "EUR":
        return {
            "candles": rows,
            "prices_in": "EUR",
            "display_currency": "EUR",
            "note": "open/high/low/close are in EUR (converted from the listing currency).",
        }
    usd_rows = []
    for row in rows:
        usd_rows.append(
            {
                **row,
                "open": round(float(row["open"]) / rate, 4),
                "high": round(float(row["high"]) / rate, 4),
                "low": round(float(row["low"]) / rate, 4),
                "close": round(float(row["close"]) / rate, 4),
            }
        )
    return {
        "candles": usd_rows,
        "prices_in": "USD",
        "display_currency": "USD",
        "note": "open/high/low/close are in USD.",
    }


def _adjust_tool_result(name: str, result, currency: str, inputs: dict) -> object:
    ticker = (inputs.get("ticker") or "").upper() or None
    if name == "get_portfolio" and isinstance(result, list):
        return {
            "holdings": _simplify_portfolio_for_currency(result, currency),
            "display_currency": currency,
        }
    if name == "analyze_swing_setup" and isinstance(result, dict) and ticker:
        return _adjust_swing_for_currency(result, currency, ticker)
    if name == "get_technical_indicators" and isinstance(result, dict) and ticker:
        return _adjust_technical_for_currency(result, currency, ticker)
    if name == "get_stock_data" and isinstance(result, list) and ticker:
        return _adjust_ohlcv_for_currency(result, currency, ticker)
    return result


def _dispatch_tool(name: str, inputs: dict, user_id: int):
    if name == "get_stock_data":
        return market_data.fetch_ohlcv(
            inputs["ticker"],
            inputs.get("period", "3mo"),
            inputs.get("interval", "1d"),
        )
    if name == "get_technical_indicators":
        return technical.compute_indicators(inputs["ticker"])
    if name == "get_portfolio":
        return portfolio_service.get_portfolio_for_user(user_id)
    if name == "get_news_headlines":
        return market_data.fetch_news(inputs["ticker"])
    if name == "analyze_swing_setup":
        return technical.run_swing_analysis(inputs["ticker"])
    return {"error": f"Unknown tool: {name}"}


async def stream_agent_response(messages: list[dict], user_id: int, currency: str = "EUR"):
    system_prompt = _build_system_prompt(user_id, currency)
    conversation = [{"role": "system", "content": system_prompt}] + list(messages)

    while True:
        response = _client.chat.completions.create(
            model=MODEL,
            messages=conversation,
            tools=TOOL_DEFINITIONS,
            tool_choice="auto",
            max_tokens=4096,
        )

        msg = response.choices[0].message
        tool_calls = msg.tool_calls or []

        if msg.content:
            for word in msg.content.split(" "):
                yield f"data: {json.dumps({'type': 'text_delta', 'text': word + ' '})}\n\n"

        if not tool_calls:
            break

        for tc in tool_calls:
            yield f"data: {json.dumps({'type': 'tool_call', 'name': tc.function.name})}\n\n"

        # Add assistant message with tool calls to conversation
        conversation.append(
            {
                "role": "assistant",
                "content": msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in tool_calls
                ],
            }
        )

        for tc in tool_calls:
            try:
                inputs = json.loads(tc.function.arguments)
            except json.JSONDecodeError:
                inputs = {}
            result = _dispatch_tool(tc.function.name, inputs, user_id)
            result = _adjust_tool_result(tc.function.name, result, currency, inputs)
            conversation.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(result),
                }
            )

    yield f"data: {json.dumps({'type': 'done'})}\n\n"
