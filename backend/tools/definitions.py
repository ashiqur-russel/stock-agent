# Groq uses OpenAI-style function-calling format
TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_stock_data",
            "description": "Fetch OHLCV (open/high/low/close/volume) historical price data for a stock ticker. Use this to see price history and recent price action.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ticker": {"type": "string", "description": "Stock ticker symbol, e.g. 'AAPL', 'TSLA', 'BYND'"},
                    "period": {"type": "string", "description": "Time period: '5d', '1mo', '3mo', '6mo', '1y'. Default: '3mo'"},
                    "interval": {"type": "string", "description": "Candle interval: '1d' or '1h'. Default: '1d'"},
                },
                "required": ["ticker"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_technical_indicators",
            "description": "Calculate RSI-14, MACD (12/26/9), Bollinger Bands (20/2), EMA-20 and EMA-50 for a stock ticker. Returns current values and trend/signal interpretation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ticker": {"type": "string", "description": "Stock ticker symbol"},
                },
                "required": ["ticker"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_portfolio",
            "description": "Return the user's current stock holdings with live price, average cost, unrealized P&L, realized P&L, and daily change.",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_news_headlines",
            "description": "Fetch the latest news headlines for a stock ticker from Yahoo Finance.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ticker": {"type": "string", "description": "Stock ticker symbol"},
                },
                "required": ["ticker"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_swing_setup",
            "description": "Run a complete swing trading analysis for a ticker. Combines technical indicators and news sentiment to produce a swing setup quality rating (strong_buy, potential_buy, hold, potential_sell, strong_sell) with key support and resistance levels. Call this first whenever the user asks whether to buy, sell, or hold a stock.",
            "parameters": {
                "type": "object",
                "properties": {
                    "ticker": {"type": "string", "description": "Stock ticker symbol"},
                },
                "required": ["ticker"],
            },
        },
    },
]
