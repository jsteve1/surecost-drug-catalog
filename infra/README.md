# Infrastructure

The canonical Docker Compose file is at the **repository root**: [`../docker-compose.yml`](../docker-compose.yml).

Run from the repo root:

```bash
docker-compose up --build   # docker-compose v1
# or
docker compose up --build   # docker compose v2 (Compose plugin)
```

The root compose brings up three services: `db` (PostgreSQL 16), `backend` (Django + gunicorn), and `frontend` (Next.js).
