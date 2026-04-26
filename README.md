# Stock Agent

**Stock Agent** is a full-stack app for tracking a stock portfolio, paper trading, price alerts, and an AI swing-trading assistant. The stack is a **FastAPI** backend and a **Next.js** frontend in this monorepo.

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

---

*Not financial advice. For educational purposes only.*
