# Stock Agent

**Stock Agent** is a full-stack app for tracking a stock portfolio, paper trading, price alerts, and an AI swing-trading assistant. The stack is a **FastAPI** backend and a **Next.js** frontend in this monorepo.

## Contributing

For **open source developers** — local setup, env vars, database modes, Git hooks, branch/commit conventions, **PR workflow** (`development` → `main`), and **PR titles** like `[SA-36] feature: short description` — see **[CONTRIBUTING.md](CONTRIBUTING.md)**.

## Documentation

The complete setup guide, environment variables, database notes (SQLite locally or **PostgreSQL** / Supabase in production), API overview, and deployment tips live in the **in-app documentation**:

- **Local:** [http://localhost:3000/docs](http://localhost:3000/docs) (with the frontend dev server running)
- **Production:** use your deployed site at **`/docs`** (for example `https://<your-vercel-app>.vercel.app/docs`).

`backend/.env.example` lists backend variables; copy it to `backend/.env` for local development.

## Repository layout

| Path         | Description                                      |
| ------------ | ------------------------------------------------ |
| `backend/`   | FastAPI app, `schema.sql` (SQLite), `schema.postgres.sql` (Postgres) |
| `frontend/`  | Next.js 14 app                                   |
| `scripts/`   | Git hooks and repo tooling (e.g. branch name checks) |

## Quick start (summary)

1. **Backend:** `cd backend` → create a venv → `pip install -r requirements.txt` → copy `.env.example` to `.env` → run `uvicorn main:app --reload --port 8000`.
2. **Frontend:** `cd frontend` → `npm install` → set `NEXT_PUBLIC_API_URL` (e.g. `http://localhost:8000`) in `.env.local` → `npm run dev`.

For health checks, Docker, CORS, and production configuration, use **`/docs`** as the single source of truth.

## Troubleshooting: `Network is unreachable` to Supabase (e.g. on Render)

If startup fails while connecting to `db.*.supabase.co` with **IPv6** and `Network is unreachable`, your host often cannot reach that path. In **Supabase → Project Settings → Database**, copy the **Session** or **Transaction pooler** URI (not only *Direct*), set it as **`DATABASE_URL`**, redeploy, and ensure `sslmode=require` is present if the dashboard includes it. The app logs a longer hint when this error is detected.

### Why did my data disappear after a deploy?

- **SQLite on a PaaS without a persistent disk** (typical **free** tiers): each deploy can start a **fresh filesystem**, so `portfolio.db` is recreated empty. Use **PostgreSQL** (e.g. Supabase) with `DATABASE_URL` for durable production data.
- **Supabase / Postgres**: `init_db()` only runs `CREATE TABLE IF NOT EXISTS` — it does **not** truncate tables. If `public` looks empty, you are usually pointing at a **new** project, a **new** branch DB, or the API had been using SQLite before and users lived only on the old file.

---

*Not financial advice. For educational purposes only.*
