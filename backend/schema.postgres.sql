-- Stock Agent — PostgreSQL / Supabase (create tables, run from app or SQL Editor)
-- Keep TEXT for timestamps so the API matches SQLite string behavior.

CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_verified   INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS email_verifications (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token      TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS password_resets (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token      TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS transactions (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    ticker      TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
    shares      DOUBLE PRECISION NOT NULL CHECK (shares > 0),
    price       DOUBLE PRECISION NOT NULL CHECK (price > 0),
    executed_at TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (now()::text),
    notes       TEXT
);

CREATE TABLE IF NOT EXISTS signal_history (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    ticker     TEXT NOT NULL,
    signal     TEXT NOT NULL,
    checked_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS alerts (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    ticker     TEXT NOT NULL,
    old_signal TEXT,
    new_signal TEXT NOT NULL,
    message    TEXT NOT NULL,
    price_eur  DOUBLE PRECISION,
    is_read    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id                   BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    notify_email              TEXT,
    email_alerts              INTEGER NOT NULL DEFAULT 1,
    market_region             TEXT NOT NULL DEFAULT 'DE' CHECK (market_region IN ('DE', 'US')),
    ai_chat_enabled           INTEGER NOT NULL DEFAULT 1,
    whats_new_cleared_version TEXT,
    whats_new_read_version    TEXT
);

CREATE TABLE IF NOT EXISTS ai_chat_usage (
    id                BIGSERIAL PRIMARY KEY,
    user_id           BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at        TEXT NOT NULL DEFAULT (now()::text),
    prompt_tokens     INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    groq_calls        INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_usage_user_created ON ai_chat_usage (user_id, created_at);

CREATE TABLE IF NOT EXISTS paper_accounts (
    user_id     BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    balance_eur DOUBLE PRECISION NOT NULL DEFAULT 100000.0,
    created_at  TEXT NOT NULL DEFAULT (now()::text)
);

CREATE TABLE IF NOT EXISTS paper_transactions (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    ticker      TEXT NOT NULL,
    type        TEXT NOT NULL CHECK (type IN ('BUY', 'SELL')),
    shares      DOUBLE PRECISION NOT NULL CHECK (shares > 0),
    price_eur   DOUBLE PRECISION NOT NULL CHECK (price_eur > 0),
    executed_at TEXT NOT NULL DEFAULT (now()::text),
    notes       TEXT
);

CREATE TABLE IF NOT EXISTS paper_watchlist (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    ticker     TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (now()::text),
    CONSTRAINT uq_paper_watchlist_user_ticker UNIQUE (user_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_paper_watchlist_user ON paper_watchlist (user_id);

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    endpoint   TEXT NOT NULL UNIQUE,
    p256dh     TEXT NOT NULL,
    auth       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (now()::text)
);

CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions (user_id);
