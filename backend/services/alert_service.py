import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import config
from database import get_connection
from services.market_data import get_usd_to_eur_rate
from services.portfolio_service import get_portfolio_for_user
from services.technical import run_swing_analysis

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
        print(f"[alert] email sent to {to_email} for {ticker} {signal}")
    except Exception as e:
        print(f"[alert] email failed: {e}")


def check_all_portfolios():
    """Background job: scan every user's holdings for signal changes."""
    print("[alert] Running portfolio signal scan...")
    with get_connection() as conn:
        users = conn.execute("SELECT id FROM users").fetchall()

    eur_rate = get_usd_to_eur_rate()

    for user_row in users:
        user_id = user_row["id"]
        try:
            portfolio = get_portfolio_for_user(user_id)
        except Exception as e:
            print(f"[alert] portfolio error user {user_id}: {e}")
            continue

        tickers = [h["ticker"] for h in portfolio if h.get("shares_held", 0) > 0]

        for ticker in tickers:
            try:
                analysis = run_swing_analysis(ticker)
                if "error" in analysis:
                    continue

                new_signal = analysis["swing_setup_quality"]
                old_signal = get_last_signal(user_id, ticker)
                save_signal(user_id, ticker, new_signal)

                if old_signal == new_signal:
                    continue
                if (
                    new_signal not in ACTIONABLE_SIGNALS
                    and (old_signal or "hold") not in ACTIONABLE_SIGNALS
                ):
                    continue

                price_usd = analysis.get("current_price")
                price_eur = round(price_usd * eur_rate, 4) if price_usd else None
                support_usd = analysis.get("key_support")
                resistance_usd = analysis.get("key_resistance")
                support_eur = f"€{round(support_usd * eur_rate, 2)}" if support_usd else "N/A"
                resistance_eur = (
                    f"€{round(resistance_usd * eur_rate, 2)}" if resistance_usd else "N/A"
                )

                old_label = (
                    f"{SIGNAL_EMOJI.get(old_signal, '')} {SIGNAL_LABELS.get(old_signal, 'none')}"
                    if old_signal
                    else "none"
                )
                new_label = f"{SIGNAL_EMOJI.get(new_signal, '')} {SIGNAL_LABELS.get(new_signal, new_signal)}"

                message = (
                    f"Signal changed: {old_label} → {new_label}\n\n"
                    f"RSI-14:     {analysis.get('rsi_14', 'N/A')}\n"
                    f"MACD:       {analysis.get('macd_signal', 'N/A')}\n"
                    f"Bollinger:  {analysis.get('bb_position', 'N/A')}\n"
                    f"Trend:      {analysis.get('trend', 'N/A')}\n"
                    f"News:       {analysis.get('news_sentiment', 'N/A')}\n\n"
                    f"Support:    {support_eur}\n"
                    f"Resistance: {resistance_eur}\n"
                    f"Stop-loss:  Below support\n\n"
                    f"Not financial advice."
                )

                create_alert(user_id, ticker, old_signal, new_signal, message, price_eur)

                notify_email = get_user_notify_email(user_id)
                if notify_email:
                    send_alert_email(notify_email, ticker, new_signal, message, price_eur)

                # Browser push notification
                try:
                    from services.push_service import send_push_to_user

                    emoji = SIGNAL_EMOJI.get(new_signal, "")
                    label = SIGNAL_LABELS.get(new_signal, new_signal)
                    push_body = (
                        f"RSI {analysis.get('rsi_14', '—')} · {analysis.get('macd_signal', '')} · "
                        f"Support {support_eur}"
                    )
                    send_push_to_user(
                        user_id,
                        title=f"{emoji} {ticker} — {label}",
                        body=push_body,
                        url="/user/alerts",
                    )
                except Exception as pe:
                    print(f"[push] alert push error: {pe}")

                print(f"[alert] {ticker}: {old_signal} → {new_signal} (user {user_id})")

            except Exception as e:
                print(f"[alert] error on {ticker} user {user_id}: {e}")

    print("[alert] Scan complete.")
