# Agent Operating Rules — SureCost Drug Catalog

This file governs how AI agents work in **this repository only**. Read it together with [`spec.md`](spec.md), which is the authoritative build recipe.

---

## Mission

Build a production-quality drug catalog MVP for the SureCost take-home challenge:

- **Backend:** Django + DRF REST API with real persistence, search, idempotent creates, logging, and Docker
- **Frontend:** Next.js (App Router) + TypeScript UI with CRUD, search/filter, validation, and error display
- **Stretch:** Controlled-substance (DEA) management, change audit log, batch ingest, tests, polish

Agents move fast with AI assistance but **own the output**: correct, clean, maintainable code that matches `spec.md`.

---

## How to Use spec.md

1. **Pick a story** whose `depends_on` IDs are all complete. Never start blocked work.
2. **Execute subtasks in order** within the story; run each `verify` step before marking done.
3. **Meet every `acceptance_criteria`** item — they are the Definition of Done for that story.
4. **Respect `phase`:** finish all `required` epics (E1–E11) before starting `stretch` (E12–E17) unless the user explicitly reprioritizes.
5. **Do not rename or drop domain fields** — they map 1:1 to [`seed_drugs.json`](seed_drugs.json) and `domain_contract` in spec.md.

### Epic quick reference

| ID | Name | Phase |
|----|------|-------|
| E1 | Repository Foundation | required |
| E2 | Backend Domain Model | required |
| E3 | Backend CRUD + Search API | required |
| E4 | Backend Observability | required |
| E5 | Seed Loading | required |
| E6 | Backend Containerization | required |
| E7 | Frontend Shell + API Client | required |
| E8 | Frontend Drug List | required |
| E9 | Frontend Create/Edit | required |
| E10 | Frontend Delete | required |
| E11 | Full-Stack Compose + Docs | required |
| E12 | DEA Management | stretch |
| E13 | Audit Log | stretch |
| E14 | Batch Ingestion | stretch |
| E15 | Backend Tests | stretch |
| E16 | Frontend Tests | stretch |
| E17 | Design Polish | stretch |

---

## Repository Map

```
surecost_inventory/
├── backend/                 # Django project (config/) + drugs app
│   ├── config/              # settings, urls, wsgi
│   ├── drugs/               # models, serializers, views, filters, management commands
│   ├── Dockerfile
│   ├── entrypoint.sh
│   └── manage.py
├── frontend/                # Next.js App Router application
│   ├── src/
│   │   ├── app/             # routes (page.tsx, layout.tsx)
│   │   ├── components/      # UI components
│   │   ├── lib/             # api client, validations, query-client, utils
│   │   └── types/           # TypeScript interfaces
│   └── Dockerfile
├── infra/                   # docker-compose.yml (or at repo root)
├── seed_drugs.json          # Immutable seed data (109 records) — do not modify
├── spec.md                  # Build recipe (epics → subtasks)
├── AGENTS.md                # This file
├── README.md                # Setup + architecture + production readiness
├── AI_NOTES.md              # AI usage reflection (submission artifact)
├── .env.example             # Template for all env vars
└── private.md               # Challenge brief (gitignored)
```

### Where new code goes

| Concern | Location |
|---------|----------|
| Drug model, audit model | `backend/drugs/models.py` |
| Serializers, validators | `backend/drugs/serializers.py` |
| ViewSets, custom actions | `backend/drugs/views.py` |
| Filters | `backend/drugs/filters.py` |
| Exception handler | `backend/drugs/exceptions.py` |
| Management commands | `backend/drugs/management/commands/` |
| Settings / env | `backend/config/settings.py` |
| API routes | `backend/config/urls.py` |
| React pages | `frontend/src/app/**/page.tsx` |
| Shared components | `frontend/src/components/` |
| API client + hooks | `frontend/src/lib/` |
| Zod schemas | `frontend/src/lib/validations/` |
| Drug TypeScript type | `frontend/src/types/drug.ts` |
| Backend tests | `backend/drugs/tests/` or `backend/tests/` |
| Frontend tests | `frontend/src/**/*.test.tsx`, `frontend/e2e/` |

Do **not** put business logic in URL conf, `page.tsx` server components (keep thin), or Django admin beyond basic registration.

---

## Tech Stack Conventions

### Backend (Django + DRF)

- Python **3.12**; pin dependencies in `requirements.txt` or `pyproject.toml`
- Use **Django ORM** — no raw SQL unless justified in a comment
- **ViewSets + Routers** for CRUD; custom `@action` for batch, schedule-summary, audit
- **Serializers** own field validation; models own DB constraints
- Settings via **django-environ** — never hardcode `SECRET_KEY`, DB credentials, or API keys
- **Idempotent create:** `POST /api/drugs/` with existing NDC → return existing record (200) or clear 409; never 500, never duplicate row
- **Pagination:** default page size 25; use DRF `PageNumberPagination`
- **OpenAPI:** annotate ViewSets so `drf-spectacular` generates accurate schema
- **Logging:** structured JSON; log request method, path, status, duration; `WARNING` for Schedule II mutations

### Frontend (Next.js + TypeScript)

- **App Router** (`src/app/`); use `"use client"` only when hooks or browser APIs are needed
- **TanStack Query** for all server state (list, detail, mutations); no ad-hoc `useEffect` + `fetch`
- **react-hook-form + zod** for all forms; share schema between create and edit
- **Tailwind CSS** for styling; no CSS-in-JS libraries
- API base URL from `process.env.NEXT_PUBLIC_API_URL` — never hardcode `localhost:8000` in components
- Map backend field errors (`field_errors` / DRF `detail`) to form inputs
- Show global errors in a toast or banner; never swallow API failures silently

---

## Domain Invariants

These rules are **non-negotiable**. Breaking them breaks seed ingestion, idempotency, or the frontend contract.

### Drug fields (match `seed_drugs.json` exactly)

| Field | Type | Rules |
|-------|------|-------|
| `ndc` | string | Unique. Format `#####-####-##` (regex `^\d{5}-\d{4}-\d{2}$`). Natural key for idempotency. |
| `drug_name` | string | Required, non-empty |
| `manufacturer` | string | Required, non-empty |
| `dosage_form` | string | Required. Known values: TABLET, CAPSULE, INJECTABLE, SOLUTION, SUSPENSION, FILM, INHALATION |
| `strength` | string | Required, free-text |
| `package_size` | integer | Required, >= 1 |
| `unit_price` | decimal | Required, >= 0, USD, 2 decimal places |
| `dea_schedule` | string \| null | One of `II`, `III`, `IV`, `V`, or `null` |

### Idempotency

- `POST /api/drugs/` with an NDC that already exists **must not** insert a second row
- `load_seed` and `POST /api/drugs/batch/` use `update_or_create` keyed on `ndc`
- Duplicate handling is a feature, not an error — unless the payload conflicts on non-NDC fields (document behavior)

### Computed (display only)

- `extended_cost = unit_price × package_size` — show in UI; do not persist unless spec changes

### Audit log (stretch)

- Immutable records: no update/delete on `AuditLog`
- Capture `action`, `timestamp`, `actor` (default `"system"`), `changes` JSON diff
- UPDATE diffs include only changed fields

---

## Coding Standards

- **Type everything** — Python type hints on public functions; TypeScript `strict` mode
- **Small, focused modules** — one ViewSet per resource; one component per file when practical
- **No narration comments** — comment only non-obvious intent, trade-offs, or invariants
- **Consistent naming:** `snake_case` (Python), `camelCase` (TS/JS), `PascalCase` (components/classes)
- **Error envelope** (backend): `{ "error": "...", "detail": "...", "field_errors": { "field": ["msg"] } }`
- **No secrets in source** — use `.env`; commit only `.env.example`
- **Do not modify `seed_drugs.json`** — it is the challenge dataset
- **Do not modify `private.md`** — it is gitignored challenge correspondence

---

## Definition of Done

A story is complete when **all** of the following are true:

1. Every `acceptance_criteria` in spec.md is met
2. Every subtask `verify` step passes
3. No linter errors introduced (`ruff` / `eslint` clean)
4. API changes reflected in OpenAPI schema (`/api/docs/`)
5. Frontend types match backend serializer fields
6. No `.env`, credentials, or `private.md` committed
7. If the story touches Docker, `docker compose up` still works end-to-end

---

## Commands Cheat Sheet

### Backend (local)

```bash
cd backend
python -m venv .venv && .venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp ../.env.example ../.env                             # fill in values
python manage.py migrate
python manage.py load_seed
python manage.py runserver
```

### Frontend (local)

```bash
cd frontend
npm install
cp ../.env.example .env.local                          # set NEXT_PUBLIC_API_URL
npm run dev
```

### Docker (full stack)

```bash
docker compose up --build
# Backend:  http://localhost:8000/api/drugs/
# Frontend: http://localhost:3000
# API docs: http://localhost:8000/api/docs/
```

### Tests

```bash
# Backend (stretch)
cd backend && pytest

# Frontend (stretch)
cd frontend && npm test
cd frontend && npx playwright test
```

### Lint / format

```bash
cd backend && ruff check . && ruff format .
cd frontend && npm run lint
```

---

## Error Handling and Logging

### Backend

- Use the custom DRF exception handler — every error returns JSON, never HTML
- `400` validation → include `field_errors`
- `404` not found → `{ "error": "not_found", "detail": "..." }`
- `500` → generic message in response; full traceback **only** in server logs
- Log format: JSON lines with `timestamp`, `level`, `message`, `request_id` (if available)
- Never log secrets, full request bodies with PHI, or stack traces to clients

### Frontend

- Parse API errors in `lib/api.ts` → throw typed `ApiError` with `message` and `fieldErrors`
- Forms: set field errors via `setError()` from react-hook-form
- Mutations: `onError` shows toast; list queries show inline error banner
- Network failures: "Unable to reach server" — not a generic "Something went wrong"

---

## Git and Safety Guardrails

- **Never commit:** `.env`, `.env.local`, `*.sqlite3`, `private.md`, `node_modules/`, `.venv/`
- **Conventional commits:** `feat:`, `fix:`, `chore:`, `test:`, `docs:` prefixes
- **One concern per commit** when possible (e.g. "feat: add Drug model" not "wip")
- **Do not break the API contract** in `spec.md` → `api_contract` without updating frontend client and spec
- **Do not delete or rewrite seed data** — ingestion must always load 109 records
- **Ask before:** switching frameworks, adding auth, changing NDC format, or removing stretch features already built

---

## Parallel Work Guidance

These paths can run in parallel once dependencies are met:

| Track A (Backend) | Track B (Frontend) |
|-------------------|-------------------|
| E2 → E3 → E5 → E6 | E7 → E8 → E9 → E10 (after E3 API contract exists) |
| E4 (with E2) | — |
| E12 backend endpoints | E12 UI badges (after E8) |
| E13 audit model + API | E13 audit UI (after API) |
| E14 batch endpoint | — |
| E15 pytest | E16 Vitest + Playwright |

**Blockers to watch:**

- Frontend list (E8) needs a running backend with seed data (E3 + E5)
- Docker full-stack (E11) needs E6 + E10
- Audit UI (E13) needs audit API (E13.F1) — do not build UI first
- Tests (E15/E16) should target implemented features, not stubs

---

## AI Agent Behavior

- Read `spec.md` and this file **before** writing code
- Prefer editing existing files over creating duplicates
- Run `verify` steps — do not claim done without evidence
- When AI-generated code is wrong, fix it and note the pattern in `AI_NOTES.md` if recurring
- Keep changes minimal and focused on the current story — no drive-by refactors
- Update `README.md` when setup steps change (usually E11, but fix early if broken)
