# SureCost Drug Catalog

Full-stack pharmacy drug catalog for the SureCost take-home challenge: NDC-keyed drug records with CRUD, search/filter, idempotent creates, seed ingestion, and Docker-based deployment.

## Architecture

```
┌─────────────┐     REST API      ┌──────────────────┐
│  Next.js    │ ◄──────────────► │  Django + DRF    │
│  :3000      │   /api/drugs/    │  :8000           │
└─────────────┘                   └────────┬─────────┘
                                           │
                                    ┌──────▼──────┐
                                    │ PostgreSQL  │
                                    │   :5432     │
                                    └─────────────┘
```

**Stack:** Python 3.12 · Django · DRF · Next.js (App Router) · TypeScript · Tailwind · TanStack Query · Docker

## Prerequisites

- **Docker path (recommended):** Docker Engine + `docker-compose` (v1) or `docker compose` plugin (v2)
- **Local path:** Python 3.12, Node.js 20+, npm

## Docker Setup (primary)

The canonical compose file is at the **repository root** (`docker-compose.yml`). Run from the repo root:

```bash
docker-compose up --build   # docker-compose v1
# or
docker compose up --build   # docker compose v2 plugin
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| API      | http://localhost:8000/api/drugs/ |
| Health   | http://localhost:8000/api/health/ |
| OpenAPI  | http://localhost:8000/api/docs/ |

On startup the backend runs migrations and loads all **109** seed records from `seed_drugs.json`.

## Local Development

### 1. Environment

```bash
cp .env.example .env
```

For frontend local dev:

```bash
cp .env.example frontend/.env.local
# Ensure NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py load_seed
python manage.py runserver
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 — the UI proxies requests to the API via `NEXT_PUBLIC_API_URL`.

## API Docs

- **OpenAPI schema:** `GET /api/schema/`
- **Swagger UI:** `GET /api/docs/`

Key behaviors:

- `POST /api/drugs/` with an existing NDC returns **200** with the existing record (no duplicate row).
- Search/filter query params: `search`, `manufacturer`, `dosage_form`, `dea_schedule`, `min_price`, `max_price`, `page`.
- `?dea_schedule=` (empty) filters non-controlled drugs (`dea_schedule` is null).

Stretch endpoints:

- `GET /api/drugs/schedule-summary/` — counts per DEA schedule (`II/III/IV/V/non_controlled`).
- `POST /api/drugs/batch/` — idempotent upsert of many records by NDC; returns `{created, updated, errors, results}` and never aborts the batch on a single bad row.
- `GET /api/audit/` and `GET /api/drugs/{id}/audit/` — immutable change history (newest first, paginated).

## Pharmacy-Context Feature: Controlled-Substance (DEA) Management + Audit Log

The chosen pharmacy-domain feature is **controlled-substance oversight**, because DEA-scheduled drugs carry the highest regulatory and diversion risk in a pharmacy's catalog:

- **Schedule-aware catalog** — color-coded `C-II`–`C-V` / Non-controlled badges, plus a summary panel that shows counts per schedule and one-click filtering (including non-controlled).
- **Schedule II guardrails** — the most tightly controlled tier requires typing `CONFIRM` to delete, surfaces an explicit warning on edit, and emits a structured `WARNING` server log (`controlled_substance_mutation`) on every Schedule II update/delete for monitoring.
- **Immutable audit log** — every create/update/delete is recorded with a field-level diff, actor, and timestamp (no update/delete on audit rows), viewable globally at `/audit` and per-drug via the edit screen's **History** tab.

**Why it matters:** pharmacies are accountable to DEA recordkeeping and audit requirements; an immutable, queryable change trail and extra friction around Schedule II mutations directly support compliance, internal review, and diversion investigations — far more valuable in this domain than generic CRUD polish.

## Live Demo Deployment

The application is deployed as:

| Component | URL | How |
|-----------|-----|-----|
| **Frontend** | https://app.gaspartech.com | GitHub Pages static export (this repo's `develop` → `pages.yml`) |
| **API** | https://api.gaspartech.com | Django on the self-hosted server, via Cloudflare named tunnel |

**Important:** The live demo is **available only while the self-hosted server is running** the Django backend and `cloudflared`. If the API is unreachable the frontend will show an error banner.

**API auth:** The public API is **intentionally open** (no authentication) for the demo. Anyone with the URL can read or write drug records. This is by design for the take-home evaluation; a production deployment would add auth and Cloudflare rate-limiting.

## Production Readiness

This MVP is suitable for demo and local evaluation. For SureCost-scale production across many pharmacy locations:

1. **Read replicas + connection pooling** — Route catalog reads to replicas; use PgBouncer (or RDS Proxy) so hundreds of concurrent pharmacy clients do not exhaust Postgres connections during peak formulary lookups.

2. **NDC normalization ingestion pipeline** — Ingest vendor catalogs via async workers (SQS/Celery) with validation, deduplication on NDC, and dead-letter queues for malformed rows before they hit the primary catalog API.

3. **Audit retention & compliance** — Persist immutable change logs (stretch epic) to WORM storage or partitioned tables with tiered retention for DEA Schedule II mutations, aligned with pharmacy regulatory review windows.

Additional hardening: secrets manager for `SECRET_KEY`, HTTPS termination, authn/authz per pharmacy tenant, rate limiting, and health-checked rolling deploys.

## Project Layout

```
backend/     Django REST API
frontend/    Next.js UI
infra/       Infrastructure notes (see root docker-compose.yml for canonical compose)
seed_drugs.json   Immutable seed data (109 records)
```

See [`spec.md`](spec.md) for the full build recipe and [`AGENTS.md`](AGENTS.md) for agent conventions.
