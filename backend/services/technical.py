import yfinance as yf
import pandas as pd
import pandas_ta as ta


def compute_indicators(ticker: str) -> dict:
    df = yf.download(ticker, period="6mo", interval="1d", progress=False, auto_adjust=True)
    if df.empty or len(df) < 50:
        return {"error": f"Not enough data for {ticker}"}

    # Flatten MultiIndex columns if present
    if isinstance(df.columns, pd.MultiIndex):
        df.columns = df.columns.get_level_values(0)

    df = df.copy()
    df["RSI_14"] = ta.rsi(df["Close"], length=14)

    macd_df = ta.macd(df["Close"], fast=12, slow=26, signal=9)
    if macd_df is not None:
        df = pd.concat([df, macd_df], axis=1)

    bb_df = ta.bbands(df["Close"], length=20, std=2)
    if bb_df is not None:
        df = pd.concat([df, bb_df], axis=1)

    df["EMA_20"] = ta.ema(df["Close"], length=20)
    df["EMA_50"] = ta.ema(df["Close"], length=50)

    last = df.iloc[-1]
    close = float(last["Close"])
    ema20 = float(last["EMA_20"]) if not pd.isna(last.get("EMA_20", float("nan"))) else None
    ema50 = float(last["EMA_50"]) if not pd.isna(last.get("EMA_50", float("nan"))) else None

    # Trend from EMA structure
    if ema20 and ema50:
        if close > ema20 > ema50:
            trend = "above_both_emas"
        elif close < ema20 < ema50:
            trend = "below_both_emas"
        else:
            trend = "between_emas"
    else:
        trend = "unknown"

    # MACD signal
    macd_col = next((c for c in df.columns if c.startswith("MACD_") and "s" not in c.lower() and "h" not in c.lower()), None)
    signal_col = next((c for c in df.columns if c.startswith("MACDs_")), None)
    hist_col = next((c for c in df.columns if c.startswith("MACDh_")), None)

    macd_val = float(last[macd_col]) if macd_col and not pd.isna(last.get(macd_col)) else None
    signal_val = float(last[signal_col]) if signal_col and not pd.isna(last.get(signal_col)) else None
    hist_val = float(last[hist_col]) if hist_col and not pd.isna(last.get(hist_col)) else None

    if macd_val is not None and signal_val is not None:
        prev = df.iloc[-2]
        prev_macd = float(prev.get(macd_col, 0) or 0)
        prev_signal = float(prev.get(signal_col, 0) or 0)
        if prev_macd < prev_signal and macd_val > signal_val:
            macd_signal = "bullish_crossover"
        elif prev_macd > prev_signal and macd_val < signal_val:
            macd_signal = "bearish_crossover"
        else:
            macd_signal = "bullish" if macd_val > signal_val else "bearish"
    else:
        macd_signal = "neutral"

    # Bollinger Bands
    bb_upper_col = next((c for c in df.columns if c.startswith("BBU_")), None)
    bb_lower_col = next((c for c in df.columns if c.startswith("BBL_")), None)
    bb_mid_col = next((c for c in df.columns if c.startswith("BBM_")), None)
    bb_pct_col = next((c for c in df.columns if c.startswith("BBP_")), None)

    bb_upper = float(last[bb_upper_col]) if bb_upper_col and not pd.isna(last.get(bb_upper_col)) else None
    bb_lower = float(last[bb_lower_col]) if bb_lower_col and not pd.isna(last.get(bb_lower_col)) else None
    bb_mid = float(last[bb_mid_col]) if bb_mid_col and not pd.isna(last.get(bb_mid_col)) else None
    bb_pct = float(last[bb_pct_col]) if bb_pct_col and not pd.isna(last.get(bb_pct_col)) else None

    if bb_upper and bb_lower and bb_pct is not None:
        if bb_pct > 0.8:
            bb_position = "near_upper_band"
        elif bb_pct < 0.2:
            bb_position = "near_lower_band"
        else:
            bb_position = "middle"
    else:
        bb_position = "unknown"

    rsi = float(last["RSI_14"]) if not pd.isna(last.get("RSI_14", float("nan"))) else None

    return {
        "ticker": ticker.upper(),
        "current_price": round(close, 4),
        "rsi_14": round(rsi, 2) if rsi else None,
        "macd": {
            "macd_line": round(macd_val, 4) if macd_val else None,
            "signal_line": round(signal_val, 4) if signal_val else None,
            "histogram": round(hist_val, 4) if hist_val else None,
        },
        "macd_signal": macd_signal,
        "bollinger": {
            "upper": round(bb_upper, 4) if bb_upper else None,
            "middle": round(bb_mid, 4) if bb_mid else None,
            "lower": round(bb_lower, 4) if bb_lower else None,
            "percent_b": round(bb_pct, 4) if bb_pct is not None else None,
        },
        "bb_position": bb_position,
        "ema_20": round(ema20, 4) if ema20 else None,
        "ema_50": round(ema50, 4) if ema50 else None,
        "trend": trend,
    }


def run_swing_analysis(ticker: str) -> dict:
    from services.market_data import fetch_news
    indicators = compute_indicators(ticker)
    if "error" in indicators:
        return indicators

    news = fetch_news(ticker)
    news_titles = " ".join(n["title"].lower() for n in news)
    positive_words = ["surge", "beat", "record", "rally", "upgrade", "buy", "strong", "gain", "profit"]
    negative_words = ["fall", "drop", "miss", "downgrade", "sell", "weak", "loss", "decline", "risk", "concern"]
    pos_score = sum(1 for w in positive_words if w in news_titles)
    neg_score = sum(1 for w in negative_words if w in news_titles)
    news_sentiment = "positive" if pos_score > neg_score else ("negative" if neg_score > pos_score else "neutral")

    rsi = indicators.get("rsi_14")
    trend = indicators.get("trend")
    macd_signal = indicators.get("macd_signal")
    bb_position = indicators.get("bb_position")
    ema20 = indicators.get("ema_20")
    ema50 = indicators.get("ema_50")
    bb_lower = indicators["bollinger"].get("lower")
    bb_upper = indicators["bollinger"].get("upper")

    score = 0
    if rsi and rsi < 35:
        score += 2
    elif rsi and rsi < 45:
        score += 1
    elif rsi and rsi > 70:
        score -= 2
    elif rsi and rsi > 60:
        score -= 1

    if trend == "above_both_emas":
        score += 1
    elif trend == "below_both_emas":
        score -= 1

    if macd_signal == "bullish_crossover":
        score += 2
    elif macd_signal == "bullish":
        score += 1
    elif macd_signal == "bearish_crossover":
        score -= 2
    elif macd_signal == "bearish":
        score -= 1

    if bb_position == "near_lower_band":
        score += 1
    elif bb_position == "near_upper_band":
        score -= 1

    if news_sentiment == "positive":
        score += 1
    elif news_sentiment == "negative":
        score -= 1

    if score >= 4:
        quality = "strong_buy"
    elif score >= 2:
        quality = "potential_buy"
    elif score <= -4:
        quality = "strong_sell"
    elif score <= -2:
        quality = "potential_sell"
    else:
        quality = "hold"

    key_support = bb_lower or ema20
    key_resistance = bb_upper or ema50

    return {
        "ticker": ticker.upper(),
        "current_price": indicators["current_price"],
        "rsi_14": rsi,
        "trend": trend,
        "macd_signal": macd_signal,
        "bb_position": bb_position,
        "ema_20": ema20,
        "ema_50": ema50,
        "key_support": round(key_support, 4) if key_support else None,
        "key_resistance": round(key_resistance, 4) if key_resistance else None,
        "news_sentiment": news_sentiment,
        "swing_setup_quality": quality,
        "score": score,
    }
