# SureCost Drug Catalog

## Overview

Full-stack pharmacy drug catalog for the SureCost take-home challenge. Manages NDC-keyed drug records with CRUD, search/filter, seed ingestion, and idempotent creates.

## Architecture

```
┌─────────────┐     REST API      ┌──────────────────┐
│  Next.js    │ ◄──────────────► │  Django + DRF    │
│  Frontend   │   /api/drugs/    │  Backend         │
└─────────────┘                   └────────┬─────────┘
                                           │
                                    ┌──────▼──────┐
                                    │ SQLite /    │
                                    │ PostgreSQL  │
                                    └─────────────┘
```

**Tech stack:** Python 3.12 · Django 5.x · Django REST Framework · Next.js (App Router) · TypeScript · Tailwind CSS · TanStack Query · Docker

## Prerequisites

- Python 3.12+
- Node.js 20+
- Docker & Docker Compose (for containerized setup)

## Local Setup

_TBD — see E11 for complete instructions._

1. Copy `.env.example` to `.env` and fill in values.
2. Backend: `cd backend`, create venv, `pip install -r requirements.txt`, `migrate`, `load_seed`, `runserver`.
3. Frontend: `cd frontend`, `npm install`, copy env, `npm run dev`.

## Docker Setup

_TBD — see E11 for complete instructions._

```bash
docker compose up --build
```

## API Docs

OpenAPI schema and interactive docs available at:

- Schema: `http://localhost:8000/api/schema/`
- Swagger UI: `http://localhost:8000/api/docs/`

## Production Readiness

_TBD — to be completed in E11._

- [ ] Environment variable documentation
- [ ] Health check endpoint
- [ ] Structured logging
- [ ] Error handling envelope
- [ ] CORS configuration
- [ ] Database migrations in Docker entrypoint
