import os
import re
import sqlite3
from pathlib import Path

import psycopg2
from psycopg2.extras import RealDictCursor

import config

USE_POSTGRES = os.getenv("DATABASE_URL", "").strip().lower().startswith("postgres")

_PG_IPV6_HINT = (
    "PostgreSQL connection failed. If you use Supabase on Render (or a host without IPv6 to the DB), "
    "do not use only the *Direct* `db.*.supabase.co:5432` URI — it can resolve to IPv6 and fail with "
    "'Network is unreachable'. In Supabase → Project Settings → Database, copy the **Session** or "
    "**Transaction** pooler connection string (pooler host; Transaction mode often uses port 6543) "
    "and set it as DATABASE_URL, including `?sslmode=require` if the dashboard provides it."
)


def _connect_postgres():
    dsn = os.environ["DATABASE_URL"].strip()
    try:
        return psycopg2.connect(dsn)
    except psycopg2.OperationalError as e:
        msg = (str(e) or "").lower()
        if "network is unreachable" in msg or "no route to host" in msg:
            raise psycopg2.OperationalError(f"{e}\n{_PG_IPV6_HINT}") from e
        raise


def is_postgres() -> bool:
    return USE_POSTGRES


def _adapt_sql_for_pg(sql: str) -> str:
    return sql.replace("?", "%s")


def _connect_sqlite():
    DB_PATH = os.getenv("DATABASE_PATH", config.DATABASE_PATH)
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys = ON")
    return c


def get_connection() -> "DbConnection":
    if is_postgres():
        raw = _connect_postgres()
        return DbConnection(raw, is_pg=True)
    return DbConnection(_connect_sqlite(), is_pg=False)


class _Cursor:
    def __init__(self, cur, is_pg: bool) -> None:
        self._c = cur
        self._is_pg = is_pg

    @property
    def lastrowid(self) -> int:  # noqa: A003 — sqlite compatibility
        if self._is_pg:
            return 0
        return int(self._c.lastrowid)

    def fetchone(self):
        return self._c.fetchone()

    def fetchall(self):
        return self._c.fetchall()


class DbConnection:
    def __init__(self, raw, *, is_pg: bool) -> None:
        self._raw = raw
        self._is_pg = is_pg

    def execute(self, sql: str, params: tuple | list = ()):
        if self._is_pg:
            q = _adapt_sql_for_pg(sql)
            cur = self._raw.cursor(cursor_factory=RealDictCursor)
            p = tuple(params) if params is not None else ()
            if p:
                cur.execute(q, p)
            else:
                cur.execute(q)
        else:
            p = params if params is not None else ()
            cur = self._raw.execute(sql, p)
        return _Cursor(cur, self._is_pg)

    def commit(self) -> None:
        self._raw.commit()

    def __enter__(self) -> "DbConnection":
        return self

    def __exit__(self, *args) -> None:
        self._raw.close()


def _sql_without_line_comments(text: str) -> str:
    """Drop full-line -- comments so ';' inside comments cannot break statement splitting."""
    out: list[str] = []
    for line in text.splitlines():
        if line.lstrip().startswith("--"):
            continue
        out.append(line)
    return "\n".join(out)


def _run_postgres_ddl() -> None:
    path = Path(__file__).with_name("schema.postgres.sql")
    ddl = _sql_without_line_comments(path.read_text())
    conn = _connect_postgres()
    try:
        cur = conn.cursor()
        for part in re.split(r";\s*", ddl):
            s = part.strip()
            if not s:
                continue
            cur.execute(s)
        conn.commit()
    finally:
        conn.close()


def init_db() -> None:
    if is_postgres():
        _run_postgres_ddl()
        return
    schema = (Path(__file__).parent / "schema.sql").read_text()
    c = _connect_sqlite()
    try:
        c.executescript(schema)
        for migration in [
            "ALTER TABLE users ADD COLUMN is_verified INTEGER DEFAULT 0",
            "ALTER TABLE user_settings ADD COLUMN market_region TEXT NOT NULL DEFAULT 'DE'",
        ]:
            try:
                c.execute(migration)
                c.commit()
            except Exception:
                pass
    finally:
        c.close()
