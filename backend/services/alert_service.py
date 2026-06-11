import logging
import smtplib
from concurrent.futures import ThreadPoolExecutor, as_completed
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from threading import Lock

import config
from database import get_connection
from services.market_data import fetch_quote, get_usd_to_eur_rate
from services.portfolio_service import get_portfolio_for_user, invalidate_swing_signal_cache
from services.technical import run_swing_analysis
from services.user_prefs import get_user_market_region

logger = logging.getLogger("stockagent.alerts")

SIGNAL_LABELS = {
    "strong_buy": "STRONG BUY",
    "potential_buy": "POTENTIAL BUY",
    "hold": "HOLD",
    "potential_sell": "POTENTIAL SELL",
    "strong_sell": "STRONG SELL",
}

SIGNAL_EMOJI = {
    "strong_buy": "🟢",
    "potential_buy": "🟡",
    "hold": "⚪",
    "potential_sell": "🟠",
    "strong_sell": "🔴",
}

ACTIONABLE_SIGNALS = {"strong_buy", "potential_buy", "strong_sell", "potential_sell"}

# Users scanned concurrently. Bounded so one scan can't monopolize yfinance
# request budget or CPU; notifications get their own small pool so a slow SMTP
# server never stalls the scan itself.
_SCAN_WORKERS = 4
_notify_pool = ThreadPoolExecutor(max_workers=4, thread_name_prefix="alert-notify")


def get_last_signal(user_id: int, ticker: str) -> str | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT signal FROM signal_history WHERE user_id=? AND ticker=? ORDER BY checked_at DESC LIMIT 1",
            (user_id, ticker),
        ).fetchone()
    return row["signal"] if row else None


def save_signal(user_id: int, ticker: str, signal: str):
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO signal_history (user_id, ticker, signal) VALUES (?,?,?)",
            (user_id, ticker, signal),
        )
        conn.commit()


def create_alert(
    user_id: int,
    ticker: str,
    old_signal: str | None,
    new_signal: str,
    message: str,
    price_eur: float | None,
):
    with get_connection() as conn:
        conn.execute(
            "INSERT INTO alerts (user_id, ticker, old_signal, new_signal, message, price_eur) VALUES (?,?,?,?,?,?)",
            (user_id, ticker, old_signal, new_signal, message, price_eur),
        )
        conn.commit()


def get_user_notify_email(user_id: int) -> str | None:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT notify_email, email_alerts FROM user_settings WHERE user_id=?",
            (user_id,),
        ).fetchone()
    if row and row["email_alerts"] and row["notify_email"]:
        return row["notify_email"]
    return None


def send_alert_email(
    to_email: str, ticker: str, signal: str, message: str, price_eur: float | None
):
    if not config.SMTP_USER or not config.SMTP_PASSWORD:
        return

    emoji = SIGNAL_EMOJI.get(signal, "")
    label = SIGNAL_LABELS.get(signal, signal)
    subject = f"{emoji} {label} — {ticker}"
    price_str = f"€{price_eur:.4f}" if price_eur else "N/A"

    is_buy = "buy" in signal
    is_sell = "sell" in signal
    accent = "#22c55e" if is_buy else "#ef4444" if is_sell else "#eab308"

    html = f"""
    <div style="font-family: monospace; background: #111; color: #eee; padding: 24px; border-radius: 8px; max-width: 520px;">
        <h2 style="color: #22c55e; margin-top: 0; letter-spacing: 1px;">◈ STOCK AGENT ALERT</h2>
        <h3 style="color: {accent}; margin: 0 0 12px;">{emoji} {label} — {ticker}</h3>
        <p style="margin: 0 0 16px;"><strong>Current Price:</strong> {price_str}</p>
        <hr style="border: none; border-top: 1px solid #333; margin: 16px 0;">
        <pre style="white-space: pre-wrap; color: #ccc; font-size: 13px; line-height: 1.6;">{message}</pre>
        <hr style="border: none; border-top: 1px solid #333; margin: 16px 0;">
        <p style="color: #555; font-size: 11px; margin: 0;">
            Automated alert from Stock Agent. Not financial advice.
        </p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = config.smtp_from_header()
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT) as server:
            server.starttls()
            server.login(config.SMTP_USER, config.SMTP_PASSWORD)
            server.sendmail(config.SMTP_USER, to_email, msg.as_string())
        logger.info("email sent to %s for %s %s", to_email, ticker, signal)
    except Exception:
        logger.exception("alert email to %s failed", to_email)


class _AnalysisCache:
    """Per-scan memo so a ticker held by N users is analyzed once, not N times."""

    def __init__(self):
        self._results: dict[str, dict] = {}
        self._lock = Lock()

    def get(self, ticker: str) -> dict:
        with self._lock:
            cached = self._results.get(ticker)
        if cached is not None:
            return cached
        try:
            result = run_swing_analysis(ticker)
        except Exception as e:
            result = {"error": str(e)}
        with self._lock:
            self._results[ticker] = result
        return result


def _quote_sanity_ok(user_id: int, ticker: str, analysis: dict) -> bool:
    """Concurrent yfinance bugs used to mix symbols; swing close vs live quote should agree."""
    try:
        region = get_user_market_region(user_id)
        q = fetch_quote(ticker, display_region=region)
        q_usd = float(q.get("current_price_usd") or 0)
        a_usd = float(analysis.get("current_price") or 0)
        if q_usd > 0.05 and a_usd > 0.05:
            lo, hi = (q_usd, a_usd) if q_usd <= a_usd else (a_usd, q_usd)
            if hi / lo > 4.0:
                logger.warning(
                    "skip %s user %s: swing price %s vs quote %s (likely bad data)",
                    ticker,
                    user_id,
                    a_usd,
                    q_usd,
                )
                return False
    except Exception:
        logger.exception("quote sanity check error %s user %s", ticker, user_id)
    return True


def _build_alert_message(
    analysis: dict,
    old_signal: str | None,
    new_signal: str,
    holding: dict | None,
    eur_rate: float,
) -> tuple[str, float | None, str]:
    """Returns (message, price_eur, support_eur_str)."""
    price_usd = analysis.get("current_price")
    price_eur = round(price_usd * eur_rate, 4) if price_usd else None
    price_str = f"€{price_eur:.4f}" if price_eur else "N/A"
    support_usd = analysis.get("key_support")
    resistance_usd = analysis.get("key_resistance")
    support_eur = f"€{round(support_usd * eur_rate, 2)}" if support_usd else "N/A"
    resistance_eur = f"€{round(resistance_usd * eur_rate, 2)}" if resistance_usd else "N/A"

    old_label = (
        f"{SIGNAL_EMOJI.get(old_signal, '')} {SIGNAL_LABELS.get(old_signal, 'none')}"
        if old_signal
        else "none"
    )
    new_label = f"{SIGNAL_EMOJI.get(new_signal, '')} {SIGNAL_LABELS.get(new_signal, new_signal)}"

    # Signal reasons from RSI + Bollinger + EMA scoring
    reasons = analysis.get("signal_reasons") or []
    reasons_block = "\n".join(f"  • {r}" for r in reasons) if reasons else "  N/A"

    # Take-profit hint: only shown on sell signals when the user has unrealized gains
    profit_hint = ""
    if holding and new_signal in ("potential_sell", "strong_sell"):
        unrealized_pct = holding.get("unrealized_pnl_pct") or 0
        unrealized_eur = holding.get("unrealized_pnl") or 0
        if unrealized_pct > 5:
            profit_hint = (
                f"\n💰 Unrealized gain: {unrealized_pct:+.1f}% "
                f"(€{unrealized_eur:+.2f}) — consider locking in profit.\n"
            )

    message = (
        f"Signal: {old_label} → {new_label}\n\n"
        f"Why:\n{reasons_block}\n"
        f"{profit_hint}\n"
        f"Price:      {price_str}\n"
        f"RSI-14:     {analysis.get('rsi_14', 'N/A')}\n"
        f"BB %B:      {analysis.get('bb_pct_b', 'N/A')}\n"
        f"Trend:      {analysis.get('trend', 'N/A')}\n"
        f"MACD:       {analysis.get('macd_signal', 'N/A')}\n\n"
        f"Support:    {support_eur}\n"
        f"Resistance: {resistance_eur}\n"
        f"Stop-loss:  Below {support_eur}\n\n"
        f"Not financial advice."
    )
    return message, price_eur, support_eur


def _dispatch_notifications(
    user_id: int,
    ticker: str,
    new_signal: str,
    message: str,
    price_eur: float | None,
    analysis: dict,
    support_eur: str,
) -> None:
    """Queue email + browser push on the notify pool so slow SMTP/push
    endpoints never stall the scan loop."""
    notify_email = get_user_notify_email(user_id)
    if notify_email:
        _notify_pool.submit(send_alert_email, notify_email, ticker, new_signal, message, price_eur)

    try:
        from services.push_service import send_push_to_user

        emoji = SIGNAL_EMOJI.get(new_signal, "")
        label = SIGNAL_LABELS.get(new_signal, new_signal)
        push_parts = []
        rsi_val = analysis.get("rsi_14")
        bb_pct_val = analysis.get("bb_pct_b")
        if rsi_val is not None:
            push_parts.append(f"RSI {rsi_val:.1f}")
        if bb_pct_val is not None:
            push_parts.append(f"BB%B {bb_pct_val:.2f}")
        push_parts.append(f"Support {support_eur}")
        _notify_pool.submit(
            send_push_to_user,
            user_id,
            f"{emoji} {ticker} — {label}",
            " · ".join(push_parts),
            "/user/alerts",
            f"stockagent-{ticker}",  # per-ticker tag: alerts for different stocks stack
        )
    except Exception:
        logger.exception("queueing push for user %s failed", user_id)


def _check_ticker(
    user_id: int,
    ticker: str,
    portfolio: list[dict],
    eur_rate: float,
    analyses: _AnalysisCache,
) -> None:
    analysis = analyses.get(ticker)
    if "error" in analysis:
        return
    if not _quote_sanity_ok(user_id, ticker, analysis):
        return

    new_signal = analysis["swing_setup_quality"]
    old_signal = get_last_signal(user_id, ticker)
    # Only persist when the label changes (or first observation). Inserting every
    # scan made signal_history grow as O(users × holdings × scans).
    if old_signal is None or old_signal != new_signal:
        save_signal(user_id, ticker, new_signal)
    invalidate_swing_signal_cache(ticker)

    if old_signal == new_signal:
        return
    if new_signal not in ACTIONABLE_SIGNALS and (old_signal or "hold") not in ACTIONABLE_SIGNALS:
        return

    holding = next((h for h in portfolio if h["ticker"] == ticker), None)
    message, price_eur, support_eur = _build_alert_message(
        analysis, old_signal, new_signal, holding, eur_rate
    )
    create_alert(user_id, ticker, old_signal, new_signal, message, price_eur)
    _dispatch_notifications(user_id, ticker, new_signal, message, price_eur, analysis, support_eur)
    logger.info("%s: %s → %s (user %s)", ticker, old_signal, new_signal, user_id)


def _scan_user(user_id: int, eur_rate: float, analyses: _AnalysisCache) -> None:
    try:
        portfolio = get_portfolio_for_user(user_id)
    except Exception:
        logger.exception("portfolio error user %s", user_id)
        return

    for holding in portfolio:
        ticker = holding["ticker"]
        if holding.get("shares_held", 0) <= 0:
            continue
        try:
            _check_ticker(user_id, ticker, portfolio, eur_rate, analyses)
        except Exception:
            logger.exception("error on %s user %s", ticker, user_id)


def check_all_portfolios():
    """Background job: scan every user's holdings for signal changes.

    Users are scanned concurrently (bounded pool) and each ticker is analyzed
    at most once per scan regardless of how many users hold it.
    """
    logger.info("running portfolio signal scan…")
    with get_connection() as conn:
        users = [row["id"] for row in conn.execute("SELECT id FROM users").fetchall()]

    eur_rate = get_usd_to_eur_rate()
    analyses = _AnalysisCache()

    with ThreadPoolExecutor(max_workers=_SCAN_WORKERS, thread_name_prefix="alert-scan") as pool:
        futures = {pool.submit(_scan_user, uid, eur_rate, analyses): uid for uid in users}
        for fut in as_completed(futures):
            try:
                fut.result()
            except Exception:
                logger.exception("scan failed for user %s", futures[fut])

    logger.info("scan complete (%d users)", len(users))
