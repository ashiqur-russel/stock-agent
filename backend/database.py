import sqlite3
import os
from pathlib import Path

DB_PATH = os.getenv("DATABASE_PATH", "./portfolio.db")


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    schema = (Path(__file__).parent / "schema.sql").read_text()
    with get_connection() as conn:
        conn.executescript(schema)
