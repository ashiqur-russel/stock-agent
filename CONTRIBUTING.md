# Contributing to Stock Agent

This guide is for anyone who wants to **run the project locally**, **hack on features**, or **open pull requests**. Product and API details also live in the in-app docs at **`/docs`** when the frontend is running.

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Repository layout](#repository-layout)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Database: SQLite vs PostgreSQL](#database-sqlite-vs-postgresql)
- [Authentication and email in development](#authentication-and-email-in-development)
- [Developer tooling (lint, hooks)](#developer-tooling-lint-hooks)
- [Branches and commit messages](#branches-and-commit-messages)
- [Tests](#tests)
- [Pull requests](#pull-requests)
- [Where to read more](#where-to-read-more)
- [Troubleshooting](#troubleshooting)

## Code of conduct

Be respectful and constructive. For bugs and features, use the [GitHub issue templates](.github/ISSUE_TEMPLATE/).

## Prerequisites

- **Python** 3.12+ (3.13 is commonly used; use a virtual environment).
- **Node.js** 18+ and **npm** (for the Next.js frontend).
- **Git**.

Optional: **Docker** if you use container-based workflows (see in-app **`/docs`** → Deployment → Docker).

## Repository layout

| Path | Purpose |
|------|---------|
| `backend/` | FastAPI application; `main.py` entrypoint; `schema.sql` (SQLite); `schema.postgres.sql` (PostgreSQL). |
| `frontend/` | Next.js 14 (App Router), TypeScript. |
| `scripts/` | Git hook helpers (branch name, commit message format). |
| `.pre-commit-config.yaml` | Hooks: Ruff, branch/commit rules. |

## Quick start

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env: set JWT_SECRET, FRONTEND_URL for local dev, etc.
uvicorn main:app --reload --port 8000
```

API base URL: `http://127.0.0.1:8000` — interactive docs: `http://127.0.0.1:8000/docs`.

Always install dependencies from `requirements.txt` after pulling; missing packages (for example **`psycopg2-binary`**) will cause import errors on startup.

### 2. Frontend

```bash
cd frontend
npm install
```

Create **`frontend/.env.local`**:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

```bash
npm run dev
```

App: `http://localhost:3000` — documentation UI: `http://localhost:3000/docs`.

## Environment variables

- **Canonical list and comments:** [`backend/.env.example`](backend/.env.example).
- Copy to **`backend/.env`** and never commit real secrets.
- **Frontend:** only `NEXT_PUBLIC_API_URL` is required for local API calls; it must match where uvicorn listens (including `http` vs `https` in production).

Important groups:

- **`JWT_SECRET`**: required for auth; use a long random string in every non-demo environment.
- **`FRONTEND_URL`**: base URL of the Next app (no trailing slash). Used in verification and password-reset links.
- **`DATABASE_URL`**: if unset or not starting with `postgres`, the backend uses **SQLite** at `DATABASE_PATH` (default `./portfolio.db`).
- **`CORS_ORIGINS`**: comma-separated browser origins allowed to call the API; production must include your real frontend origin.
- **SMTP** (`SMTP_USER`, `SMTP_PASSWORD`, …): optional locally; if omitted, verification/reset links are printed in the **backend terminal** instead of being emailed.

## Database: SQLite vs PostgreSQL

- **Local default:** SQLite file under `backend/` (see `DATABASE_PATH` in `.env`).
- **PostgreSQL (e.g. Supabase):** set `DATABASE_URL` to a connection string that starts with `postgresql` or `postgres`. The app uses **`psycopg2`** and runs DDL from `schema.postgres.sql` when appropriate.

On some hosts (for example Render) connecting to Supabase’s **direct** `db.*:5432` endpoint can fail with IPv6 routing errors. Prefer the **Session** or **Transaction pooler** URI from the Supabase dashboard. The backend adds a hint in logs when it detects that class of failure.

**Production note:** SQLite on ephemeral disks loses data on redeploy; use PostgreSQL for durable production data. See the root [README.md](README.md) troubleshooting section.

## Authentication and email in development

- Registration creates an unverified user until **`GET /auth/verify`** runs (or until a successful **password reset**, which marks the email verified).
- Without SMTP, open the link printed in the uvicorn logs.
- With SMTP configured in **`backend/.env`**, real messages are sent from your machine; production uses its own environment and is unaffected by your local `.env`.

## Developer tooling (lint, hooks)

From the **repository root**:

```bash
pip install -r dev-requirements.txt
pre-commit install
```

This registers **pre-commit**, **commit-msg**, and **pre-push** hooks:

- **Ruff** (lint + format) on `backend/**/*.py`.
- **Branch name** and **`[SA-n]`** commit subject rules (see below).

Run hooks on all files once:

```bash
pre-commit run --all-files
```

**Backend:** Ruff is enforced by pre-commit; align with existing style.

**Frontend:**

```bash
cd frontend && npm run lint
```

### Bypassing hooks (emergencies only)

The repo documents skips in [`.pre-commit-config.yaml`](.pre-commit-config.yaml) (for example `SKIP=…`). Prefer fixing branch/message format instead of skipping, so CI and other contributors stay aligned.

## Branches and commit messages

This repository uses a **ticket-style** prefix **`SA-<number>`** in branch names and commit subjects.

### Branch names

Use a topic prefix and **`SA-<digits>`** right after it, for example:

- `feature/SA-12-add-export`
- `fix/SA-7-auth-timeout`

Allowed prefixes include `feature/`, `fix/`, `hotfix/`, `chore/`, `docs/`, `release/`. Exact exceptions such as `develop` are listed in [`scripts/verify_branch_name.py`](scripts/verify_branch_name.py).

**Open source workflow:** use the **GitHub issue number** as the number in `SA-<n>` when you work from an issue (e.g. issue **#24** → `feature/SA-24-short-description`). If maintainers use another tracker, match the id they specify.

**Choosing `n` when there is no issue yet:** the hook rejects an `SA-<n>` that is **already used** on another branch in this clone (see [`scripts/verify_branch_name.py`](scripts/verify_branch_name.py)). Do **not** skip to arbitrary large ids (e.g. `SA-99`)—stay sequential so the history stays readable.

1. **Preferred:** create/track a GitHub issue and use its number.
2. **Otherwise** pick the **next** id in order:
   - **Lowest gap:** smallest positive integer not already on any `feature/SA-*`, `fix/SA-*`, `chore/SA-*`, etc. branch, or
   - **Max + 1:** take the largest `n` already in use and use **`n + 1`**.

   List numeric ids already taken (then choose a gap or max + 1):

   ```bash
   git branch -a | grep -oE 'SA-[0-9]+' | sed 's/SA-//' | sort -n | uniq
   ```

Do not commit directly on `main` / `master`; hooks and project practice expect **pull requests**.

### Commit messages

First line format:

```text
[SA-<number>] <type>: <short summary>
```

Example: `[SA-4] feat: add health check endpoint`

Exempt subjects: `Merge …`, `Revert …`, `fixup! …`, `squash! …`.

## Tests

Smoke tests live under `backend/tests/`. With **`pytest`** and dependencies from `backend/requirements.txt` installed in your venv:

```bash
cd backend
source .venv/bin/activate
pip install pytest httpx   # httpx is commonly required by Starlette TestClient
pytest tests/ -q
```

If the project adds pytest to a dev requirements file later, prefer that over ad-hoc installs.

## Pull requests

1. Open or pick an issue; use **`SA-<issue number>`** in the branch name when it fits.
2. One logical change per PR when possible.
3. Run **pre-commit** and **frontend lint** before pushing; run **pytest** when you change backend behavior.
4. Note any **env** or **schema** changes and update **`.env.example`** or docs when you add variables.

### PR title (match your branch)

Use the **same ticket id** as in the branch (`SA-<number>`), then a short human-readable title derived from the branch slug.

**Pattern:** `[SA-<n>] <Kind>/<Short description in Title Case>`

- **`<Kind>/`** comes from the branch prefix:

  | Branch starts with | Use in title |
  |--------------------|--------------|
  | `fix/SA-…`         | `Fix/`       |
  | `feature/SA-…`     | `Feature/`   |
  | `chore/SA-…`      | `Chore/`     |
  | `docs/SA-…`       | `Docs/`      |
  | `hotfix/SA-…`     | `Hotfix/`    |
  | `release/SA-…`    | `Release/`   |

- **Short description:** take the part of the branch name **after** `SA-<n>-`, replace `-` with spaces, and use **Title Case** (keep acronyms such as **API**, **JWT**, **UX** in upper case where appropriate).

**Examples**

| Branch name | Suggested PR title |
|-------------|-------------------|
| `fix/SA-7-auth-password-reset-ux` | `[SA-7] Fix/Auth Password Reset UX` |
| `feature/SA-12-csv-portfolio-export` | `[SA-12] Feature/Csv Portfolio Export` or `[SA-12] Feature/CSV Portfolio Export` |
| `docs/SA-3-update-contributing` | `[SA-3] Docs/Update Contributing` |

GitHub may auto-fill the PR title from the latest commit; **edit it** to follow the table above so it matches the branch and is easy to scan.

### PR description (what reviewers need)

Open the PR against the default branch (not `main`/`master` via direct push). In the description, include:

1. **Summary** — What you changed and **why** (problem, approach, trade-offs). Link the issue: `Closes #123` or `Refs #123` when relevant.
2. **Screenshots or screen recording** — For any **UI** change, add before/after images or a short video/GIF. For **API-only** or **docs-only** work, write **N/A** and paste sample request/response or a log snippet if it helps.
3. **Testing** — State explicitly what you ran and the outcome, for example:
   - `pre-commit run --all-files` — passed
   - `cd frontend && npm run lint` — passed (or N/A if no frontend changes)
   - `cd backend && pytest tests/ -q` — passed (or **not run** with a short reason, e.g. docs-only)
   - Manual checks: e.g. “Registered user, reset password, confirmed login”

Be honest if something was not run; reviewers can then decide what to verify locally.

Opening a PR on GitHub will show a **template** (see [`.github/pull_request_template.md`](.github/pull_request_template.md)) with the same sections—fill it in rather than leaving it blank.

## Where to read more

- **[README.md](README.md)** — overview, deploy pitfalls, Supabase IPv6 note, data persistence.
- **In-app `/docs`** — stack, env vars, API surface, deployment, user-oriented guides (run the frontend and open `/docs`).
- **[`backend/.env.example`](backend/.env.example)** — backend configuration reference.

## Troubleshooting

| Problem | What to try |
|--------|-------------|
| `ModuleNotFoundError: No module named 'psycopg2'` | `pip install -r backend/requirements.txt` inside the same venv you use for uvicorn. |
| `Network is unreachable` to Supabase | Use the **pooler** connection string; see README and backend logs. |
| CORS errors from the browser | Set `CORS_ORIGINS` to include your frontend origin (e.g. `http://localhost:3000`). |
| Verification links point at the wrong host | Set `FRONTEND_URL` in `backend/.env` to the URL users actually open (no trailing slash). |
| `command not found: #` in zsh | You pasted a comment line; run only the real shell command (e.g. `uvicorn …`). |

---

*Disclaimer: Stock Agent is for educational purposes; not financial advice.*
