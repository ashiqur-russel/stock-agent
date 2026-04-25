import json
from groq import Groq
import config
from tools.definitions import TOOL_DEFINITIONS
from services import market_data, technical, portfolio_service

_client = Groq(api_key=config.GROQ_API_KEY)
MODEL = "meta-llama/llama-4-scout-17b-16e-instruct"

_SYSTEM_PROMPT_TEMPLATE = """You are a personal swing-trading advisor for a retail investor.

The user's current portfolio:
{portfolio_summary}

Your job: provide clear, actionable swing trading guidance for any stock the user asks about.
Swing trading = holding positions for days to a few weeks to capture medium-term price moves.

RULES:
1. Always call tools to get live data before giving analysis — never guess or use memorized prices.
2. When asked about a stock, call analyze_swing_setup first, then explain your reasoning.
3. Structure answers: (a) Current situation, (b) Key levels to watch, (c) What you would do and why, (d) What would change your view.
4. Be direct — "take partial profit here" not "you might consider...".
5. Always mention a stop-loss level below key support.
6. If the user asks about a ticker not in their portfolio, still analyze it — they may be considering it.
7. Mention once if asked for formal advice that you are not a licensed financial advisor, then give your best analysis anyway.
8. Keep responses focused and practical. No fluff."""


def _build_system_prompt(user_id: int) -> str:
    try:
        holdings = portfolio_service.get_portfolio_for_user(user_id)
        if holdings:
            lines = []
            for h in holdings:
                pnl_sign = "+" if h["unrealized_pnl"] >= 0 else ""
                lines.append(
                    f"  - {h['ticker']}: {h['shares_held']} shares @ avg ${h['avg_cost']:.2f} | "
                    f"current ${h['current_price']:.2f} | P&L {pnl_sign}{h['unrealized_pnl_pct']:.1f}%"
                )
            summary = "\n".join(lines)
        else:
            summary = "  (No positions yet — user may be asking about stocks they're considering)"
    except Exception:
        summary = "  (Could not load portfolio)"
    return _SYSTEM_PROMPT_TEMPLATE.format(portfolio_summary=summary)


def _dispatch_tool(name: str, inputs: dict, user_id: int):
    if name == "get_stock_data":
        return market_data.fetch_ohlcv(
            inputs["ticker"],
            inputs.get("period", "3mo"),
            inputs.get("interval", "1d"),
        )
    elif name == "get_technical_indicators":
        return technical.compute_indicators(inputs["ticker"])
    elif name == "get_portfolio":
        return portfolio_service.get_portfolio_for_user(user_id)
    elif name == "get_news_headlines":
        return market_data.fetch_news(inputs["ticker"])
    elif name == "analyze_swing_setup":
        return technical.run_swing_analysis(inputs["ticker"])
    else:
        return {"error": f"Unknown tool: {name}"}


async def stream_agent_response(messages: list[dict], user_id: int):
    system_prompt = _build_system_prompt(user_id)
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

        # Stream text content word by word
        if msg.content:
            for word in msg.content.split(" "):
                yield f"data: {json.dumps({'type': 'text_delta', 'text': word + ' '})}\n\n"

        # If no tool calls, we're done
        if not tool_calls:
            break

        # Announce tool calls to frontend
        for tc in tool_calls:
            yield f"data: {json.dumps({'type': 'tool_call', 'name': tc.function.name})}\n\n"

        # Add assistant message with tool calls to conversation
        conversation.append({"role": "assistant", "content": msg.content or "", "tool_calls": [
            {"id": tc.id, "type": "function", "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
            for tc in tool_calls
        ]})

        # Execute tools and add results
        for tc in tool_calls:
            try:
                inputs = json.loads(tc.function.arguments)
            except json.JSONDecodeError:
                inputs = {}
            result = _dispatch_tool(tc.function.name, inputs, user_id)
            conversation.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result),
            })

    yield f"data: {json.dumps({'type': 'done'})}\n\n"
