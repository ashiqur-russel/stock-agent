import pandas as pd
import pandas_ta as ta
import yfinance as yf

from services.market_data import _suppress_yfinance_stderr


def compute_indicators(ticker: str) -> dict:
    """
    Per-ticker OHLC via ``Ticker.history`` — not ``yf.download``.

    ``download()`` shares global batch/thread state; concurrent calls (e.g. from
    ``ThreadPoolExecutor`` in ``get_portfolio_for_user``) can return the wrong
    symbol's bars, producing nonsense prices (e.g. BYND showing ~\\$350 like TSLA).
    """
    tk = (ticker or "").strip().upper()
    if not tk:
        return {"error": "Missing ticker"}

    with _suppress_yfinance_stderr():
        df = yf.Ticker(tk).history(period="6mo", interval="1d", auto_adjust=True, prepost=False)
    if df.empty or len(df) < 50:
        return {"error": f"Not enough data for {tk}"}

    # Rare: some yfinance builds still return a MultiIndex
    if isinstance(df.columns, pd.MultiIndex):
        df = df.copy()
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
    macd_col = next(
        (
            c
            for c in df.columns
            if c.startswith("MACD_") and "s" not in c.lower() and "h" not in c.lower()
        ),
        None,
    )
    signal_col = next((c for c in df.columns if c.startswith("MACDs_")), None)
    hist_col = next((c for c in df.columns if c.startswith("MACDh_")), None)

    macd_val = float(last[macd_col]) if macd_col and not pd.isna(last.get(macd_col)) else None
    signal_val = (
        float(last[signal_col]) if signal_col and not pd.isna(last.get(signal_col)) else None
    )
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

    bb_upper = (
        float(last[bb_upper_col]) if bb_upper_col and not pd.isna(last.get(bb_upper_col)) else None
    )
    bb_lower = (
        float(last[bb_lower_col]) if bb_lower_col and not pd.isna(last.get(bb_lower_col)) else None
    )
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
        "ticker": tk,
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
    """
    Signal scoring based on RSI + Bollinger Bands + EMA trend + MACD (crossover only).

    Scoring weights (max +7 / min -7):
      RSI-14         — primary   ±3  (oversold = buy zone, overbought = take-profit zone)
      Bollinger %B   — secondary ±2  (at lower band = support, at upper band = resistance)
      EMA trend      — context   ±1  (above both EMAs = uptrend, below = downtrend)
      MACD crossover — confirm   ±1  (crossover only; sustained direction ignored to avoid lag)

    Thresholds:
      ≥ 5 → strong_buy   |  ≤ -5 → strong_sell
      ≥ 3 → potential_buy |  ≤ -3 → potential_sell
      otherwise → hold
    """
    indicators = compute_indicators(ticker)
    if "error" in indicators:
        return indicators

    rsi = indicators.get("rsi_14")
    trend = indicators.get("trend")
    macd_signal = indicators.get("macd_signal")
    bb_position = indicators.get("bb_position")
    bb_pct = indicators["bollinger"].get("percent_b")
    ema20 = indicators.get("ema_20")
    ema50 = indicators.get("ema_50")
    bb_lower = indicators["bollinger"].get("lower")
    bb_upper = indicators["bollinger"].get("upper")

    score = 0
    reasons: list[str] = []

    # ── RSI-14 — primary weight ±3 ────────────────────────────────────────────
    if rsi is not None:
        if rsi < 30:
            score += 3
            reasons.append(f"RSI {rsi:.1f} — deeply oversold (strong buy zone)")
        elif rsi < 40:
            score += 2
            reasons.append(f"RSI {rsi:.1f} — oversold")
        elif rsi < 50:
            score += 1
            reasons.append(f"RSI {rsi:.1f} — below midline (mild buy bias)")
        elif rsi > 70:
            score -= 3
            reasons.append(f"RSI {rsi:.1f} — deeply overbought (consider taking profit)")
        elif rsi > 60:
            score -= 2
            reasons.append(f"RSI {rsi:.1f} — overbought")
        elif rsi > 55:
            score -= 1
            reasons.append(f"RSI {rsi:.1f} — above midline (mild sell bias)")

    # ── Bollinger Bands %B — secondary weight ±2 ─────────────────────────────
    # %B = 0 → price at lower band (support), %B = 1 → price at upper band (resistance)
    if bb_pct is not None:
        if bb_pct <= 0.05:
            score += 2
            reasons.append(
                f"Price at/below lower Bollinger Band (%B={bb_pct:.2f}) — strong support"
            )
        elif bb_pct <= 0.2:
            score += 1
            reasons.append(f"Price near lower Bollinger Band (%B={bb_pct:.2f})")
        elif bb_pct >= 0.95:
            score -= 2
            reasons.append(
                f"Price at/above upper Bollinger Band (%B={bb_pct:.2f}) — strong resistance"
            )
        elif bb_pct >= 0.8:
            score -= 1
            reasons.append(f"Price near upper Bollinger Band (%B={bb_pct:.2f})")
    elif bb_position not in ("unknown", "middle"):
        # Fallback when percent_b column is missing
        if bb_position == "near_lower_band":
            score += 1
            reasons.append("Price near lower Bollinger Band")
        elif bb_position == "near_upper_band":
            score -= 1
            reasons.append("Price near upper Bollinger Band")

    # ── EMA trend — context weight ±1 ────────────────────────────────────────
    if trend == "above_both_emas":
        score += 1
        ema_txt = f"EMA20={ema20:.2f}, EMA50={ema50:.2f}" if ema20 and ema50 else "both EMAs"
        reasons.append(f"Uptrend: price above {ema_txt}")
    elif trend == "below_both_emas":
        score -= 1
        ema_txt = f"EMA20={ema20:.2f}, EMA50={ema50:.2f}" if ema20 and ema50 else "both EMAs"
        reasons.append(f"Downtrend: price below {ema_txt}")
    elif trend == "between_emas":
        reasons.append("Mixed trend: price between EMA20 and EMA50")

    # ── MACD — crossover-only confirmation ±1 ────────────────────────────────
    # Sustained bullish/bearish MACD is intentionally ignored: it lags price and
    # would make signals look momentum-based (buy after rise, sell after fall).
    if macd_signal == "bullish_crossover":
        score += 1
        reasons.append("MACD bullish crossover — momentum turning up")
    elif macd_signal == "bearish_crossover":
        score -= 1
        reasons.append("MACD bearish crossover — momentum turning down")
    elif macd_signal in ("bullish", "bearish"):
        reasons.append(f"MACD: {macd_signal} (sustained, not scored)")

    # ── Signal quality ────────────────────────────────────────────────────────
    if score >= 5:
        quality = "strong_buy"
    elif score >= 3:
        quality = "potential_buy"
    elif score <= -5:
        quality = "strong_sell"
    elif score <= -3:
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
        "bb_pct_b": bb_pct,
        "ema_20": ema20,
        "ema_50": ema50,
        "key_support": round(key_support, 4) if key_support else None,
        "key_resistance": round(key_resistance, 4) if key_resistance else None,
        "swing_setup_quality": quality,
        "score": score,
        "signal_reasons": reasons,
    }
