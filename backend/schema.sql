CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    is_verified   INTEGER DEFAULT 0,
    created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS email_verifications (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used       INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticker      TEXT NOT NULL,
    type        TEXT NOT NULL CHECK(type IN ('BUY', 'SELL')),
    shares      REAL NOT NULL CHECK(shares > 0),
    price       REAL NOT NULL CHECK(price > 0),
    executed_at TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now')),
    notes       TEXT
);

CREATE TABLE IF NOT EXISTS signal_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticker      TEXT NOT NULL,
    signal      TEXT NOT NULL,
    checked_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS alerts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticker      TEXT NOT NULL,
    old_signal  TEXT,
    new_signal  TEXT NOT NULL,
    message     TEXT NOT NULL,
    price_eur   REAL,
    is_read     INTEGER DEFAULT 0,
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_settings (
    user_id         INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    notify_email    TEXT,
    email_alerts    INTEGER DEFAULT 1
);

-- Paper trading: each user starts with a virtual €100,000 balance
CREATE TABLE IF NOT EXISTS paper_accounts (
    user_id         INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance_eur     REAL NOT NULL DEFAULT 100000.0,
    created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS paper_transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticker      TEXT NOT NULL,
    type        TEXT NOT NULL CHECK(type IN ('BUY', 'SELL')),
    shares      REAL NOT NULL CHECK(shares > 0),
    price_eur   REAL NOT NULL CHECK(price_eur > 0),
    executed_at TEXT DEFAULT (datetime('now')),
    notes       TEXT
);

-- Persisted paper-trading watchlist per user
CREATE TABLE IF NOT EXISTS paper_watchlist (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticker      TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now')),
    UNIQUE(user_id, ticker)
);

CREATE INDEX IF NOT EXISTS idx_paper_watchlist_user ON paper_watchlist(user_id);
