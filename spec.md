# SureCost Drug Catalog — MVP Specification

This document is the **build recipe** for the SureCost take-home drug catalog application. Work epics in order (`E1` → `E17`). Each story lists explicit `depends_on` IDs — do not start a story until every dependency is complete and verified.

**Phases**

| Phase | Epics | Goal |
|-------|-------|------|
| **Required** | E1–E11 | Shippable MVP: Django REST API, Next.js UI, CRUD + search, seed load, Docker |
| **Stretch** | E12–E17 | Differentiators (DEA management, audit log), batch ingest, tests, polish |

**How to read the JSON**

1. Start at `E1`. Complete every story inside each feature before moving to the next epic.
2. Check `depends_on` on the epic, feature, story, and subtask — all must be satisfied.
3. Run each subtask's `verify` step before marking done.
4. `domain_contract` is immutable — field names match [`seed_drugs.json`](seed_drugs.json).

---

```json
{
  "project_name": "SureCost Drug Catalog",
  "desc": "Full-stack pharmacy drug catalog: Django REST backend with SQLite/Postgres persistence, Next.js frontend, CRUD + flexible search, seed ingestion, idempotent creates on NDC, controlled-substance awareness, and change audit logging.",
  "tech_stack": {
    "backend": {
      "language": "Python 3.12",
      "framework": "Django 5.x + Django REST Framework",
      "database_local": "SQLite",
      "database_docker": "PostgreSQL 16",
      "packages": [
        "django-environ",
        "django-cors-headers",
        "drf-spectacular",
        "gunicorn",
        "psycopg[binary]"
      ],
      "testing": "pytest + pytest-django"
    },
    "frontend": {
      "framework": "Next.js (App Router) + TypeScript",
      "styling": "Tailwind CSS",
      "data_fetching": "TanStack Query",
      "forms": "react-hook-form + zod",
      "testing": "Vitest + React Testing Library + Playwright"
    },
    "infra": {
      "containerization": "Docker + docker-compose",
      "api_docs": "drf-spectacular OpenAPI at /api/schema/"
    }
  },
  "domain_contract": {
    "source_file": "seed_drugs.json",
    "record_count": 109,
    "fields": {
      "ndc": {
        "type": "string",
        "format": "5-4-2 (e.g. 00002-1433-02)",
        "regex": "^\\d{5}-\\d{4}-\\d{2}$",
        "unique": true,
        "notes": "Primary natural key. Used for idempotent create."
      },
      "drug_name": {
        "type": "string",
        "required": true,
        "max_length": 255
      },
      "manufacturer": {
        "type": "string",
        "required": true,
        "max_length": 255
      },
      "dosage_form": {
        "type": "string",
        "required": true,
        "allowed_values": [
          "TABLET",
          "CAPSULE",
          "INJECTABLE",
          "SOLUTION",
          "SUSPENSION",
          "FILM",
          "INHALATION"
        ],
        "extensible": true
      },
      "strength": {
        "type": "string",
        "required": true,
        "max_length": 100,
        "notes": "Free-text (e.g. 500mg, 10mg/ml, 50mg/1000mg)"
      },
      "package_size": {
        "type": "integer",
        "required": true,
        "min": 1
      },
      "unit_price": {
        "type": "decimal",
        "required": true,
        "currency": "USD",
        "precision": "max_digits=12, decimal_places=2",
        "min": 0
      },
      "dea_schedule": {
        "type": "string|null",
        "allowed_values": ["II", "III", "IV", "V", null],
        "notes": "DEA controlled-substance schedule. No Schedule I in seed data."
      }
    },
    "idempotency_rule": "POST /api/drugs/ with an NDC that already exists MUST NOT create a duplicate. Return HTTP 200 with the existing record (or HTTP 409 with a clear message). Never HTTP 500.",
    "computed_fields": {
      "extended_cost": "unit_price * package_size (display-only, not persisted)"
    }
  },
  "epics": [
    {
      "id": "E1",
      "name": "Repository Foundation and Configuration",
      "desc": "Establish monorepo layout, environment templates, and documentation skeleton so backend and frontend can be built in parallel.",
      "phase": "required",
      "depends_on": [],
      "features": [
        {
          "id": "E1.F1",
          "name": "Monorepo Scaffolding",
          "desc": "Create directory structure and root-level project files.",
          "phase": "required",
          "depends_on": [],
          "stories": [
            {
              "id": "E1.F1.S1",
              "name": "Initialize repository layout",
              "desc": "Create backend/, frontend/, and infra/ directories with placeholder README stubs.",
              "phase": "required",
              "depends_on": [],
              "acceptance_criteria": [
                "backend/, frontend/, infra/ directories exist",
                "seed_drugs.json remains at repo root",
                "private.md is gitignored"
              ],
              "subtasks": [
                {
                  "id": "E1.F1.S1.T1",
                  "task": "Create backend/, frontend/, infra/ directories",
                  "verify": "ls shows all three directories",
                  "depends_on": []
                },
                {
                  "id": "E1.F1.S1.T2",
                  "task": "Add backend/README.md and frontend/README.md with one-line purpose",
                  "verify": "Both README files exist and are non-empty",
                  "depends_on": ["E1.F1.S1.T1"]
                }
              ]
            },
            {
              "id": "E1.F1.S2",
              "name": "Environment and gitignore",
              "desc": "Provide .env.example and harden .gitignore for secrets and build artifacts.",
              "phase": "required",
              "depends_on": ["E1.F1.S1"],
              "acceptance_criteria": [
                ".env.example documents all required variables",
                ".env, __pycache__, node_modules, .next, *.sqlite3 are gitignored",
                "private.md is gitignored"
              ],
              "subtasks": [
                {
                  "id": "E1.F1.S2.T1",
                  "task": "Create .env.example with DATABASE_URL, DEBUG, SECRET_KEY, LOG_LEVEL, CORS_ALLOWED_ORIGINS, NEXT_PUBLIC_API_URL",
                  "verify": "File exists; every variable has a comment",
                  "depends_on": []
                },
                {
                  "id": "E1.F1.S2.T2",
                  "task": "Update .gitignore for Python, Node, Docker, SQLite, and .env",
                  "verify": "git status does not show .env or node_modules after local setup",
                  "depends_on": ["E1.F1.S2.T1"]
                }
              ]
            }
          ]
        },
        {
          "id": "E1.F2",
          "name": "Root Documentation Skeleton",
          "desc": "README placeholder with architecture overview and setup sections to be filled in E11.",
          "phase": "required",
          "depends_on": ["E1.F1"],
          "stories": [
            {
              "id": "E1.F2.S1",
              "name": "Create root README skeleton",
              "desc": "Sections: Overview, Architecture, Prerequisites, Local Setup, Docker Setup, API Docs, Production Readiness (TBD).",
              "phase": "required",
              "depends_on": ["E1.F1.S1"],
              "acceptance_criteria": [
                "README.md exists at repo root",
                "Contains placeholder sections for setup and production readiness"
              ],
              "subtasks": [
                {
                  "id": "E1.F2.S1.T1",
                  "task": "Write README.md with section headers and tech stack summary",
                  "verify": "README renders correctly; lists Django + Next.js stack",
                  "depends_on": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E2",
      "name": "Backend Domain Model and Persistence",
      "desc": "Django project with Drug model matching domain_contract, migrations, and SQLite for local dev.",
      "phase": "required",
      "depends_on": ["E1"],
      "features": [
        {
          "id": "E2.F1",
          "name": "Django Project Bootstrap",
          "desc": "Initialize Django project config/ and drugs app.",
          "phase": "required",
          "depends_on": ["E1.F1"],
          "stories": [
            {
              "id": "E2.F1.S1",
              "name": "Scaffold Django project",
              "desc": "django-admin startproject config; startapp drugs inside backend/.",
              "phase": "required",
              "depends_on": ["E1.F1.S2"],
              "acceptance_criteria": [
                "backend/manage.py runs without error",
                "config/settings.py and drugs/ app exist",
                "requirements.txt or pyproject.toml lists Django and DRF"
              ],
              "subtasks": [
                {
                  "id": "E2.F1.S1.T1",
                  "task": "Create Python venv; pip install django djangorestframework django-environ django-cors-headers drf-spectacular",
                  "verify": "pip freeze shows installed packages",
                  "depends_on": []
                },
                {
                  "id": "E2.F1.S1.T2",
                  "task": "Run django-admin startproject config backend/ and startapp drugs backend/drugs/",
                  "verify": "python backend/manage.py check passes",
                  "depends_on": ["E2.F1.S1.T1"]
                },
                {
                  "id": "E2.F1.S1.T3",
                  "task": "Register drugs in INSTALLED_APPS; add REST_FRAMEWORK basic config",
                  "verify": "python backend/manage.py check passes",
                  "depends_on": ["E2.F1.S1.T2"]
                }
              ]
            }
          ]
        },
        {
          "id": "E2.F2",
          "name": "Drug Model",
          "desc": "ORM model with constraints matching domain_contract.",
          "phase": "required",
          "depends_on": ["E2.F1"],
          "stories": [
            {
              "id": "E2.F2.S1",
              "name": "Implement Drug model",
              "desc": "All fields from domain_contract with validators and unique NDC constraint.",
              "phase": "required",
              "depends_on": ["E2.F1.S1"],
              "acceptance_criteria": [
                "Drug model has all 8 fields matching seed_drugs.json keys",
                "ndc is unique with db_index",
                "dea_schedule allows null; choices II/III/IV/V",
                "unit_price uses DecimalField(max_digits=12, decimal_places=2)",
                "Initial migration created and applies cleanly"
              ],
              "subtasks": [
                {
                  "id": "E2.F2.S1.T1",
                  "task": "Define Drug model in backend/drugs/models.py with field validators (NDC regex, package_size >= 1, unit_price >= 0)",
                  "verify": "Model imports without error",
                  "depends_on": []
                },
                {
                  "id": "E2.F2.S1.T2",
                  "task": "Add Meta ordering by drug_name; __str__ returns NDC + drug_name",
                  "verify": "Django shell: Drug._meta.get_field('ndc').unique is True",
                  "depends_on": ["E2.F2.S1.T1"]
                },
                {
                  "id": "E2.F2.S1.T3",
                  "task": "Run makemigrations and migrate",
                  "verify": "python backend/manage.py migrate exits 0; db.sqlite3 created",
                  "depends_on": ["E2.F2.S1.T2"]
                },
                {
                  "id": "E2.F2.S1.T4",
                  "task": "Register Drug in Django admin for debugging",
                  "verify": "Drug appears in /admin after createsuperuser",
                  "depends_on": ["E2.F2.S1.T3"]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E3",
      "name": "Backend CRUD and Search API",
      "desc": "REST endpoints for full drug CRUD, flexible filtering, pagination, and idempotent create on NDC.",
      "phase": "required",
      "depends_on": ["E2"],
      "features": [
        {
          "id": "E3.F1",
          "name": "Serializer and ViewSet",
          "desc": "DRF ModelSerializer and ModelViewSet with custom create logic.",
          "phase": "required",
          "depends_on": ["E2.F2"],
          "stories": [
            {
              "id": "E3.F1.S1",
              "name": "Drug serializer",
              "desc": "Validation for all fields; NDC format enforced server-side.",
              "phase": "required",
              "depends_on": ["E2.F2.S1"],
              "acceptance_criteria": [
                "Serializer rejects invalid NDC format with field-level error",
                "Serializer rejects negative package_size and unit_price",
                "Serializer accepts null dea_schedule"
              ],
              "subtasks": [
                {
                  "id": "E3.F1.S1.T1",
                  "task": "Create DrugSerializer in backend/drugs/serializers.py",
                  "verify": "Serializer validates a seed record dict without errors",
                  "depends_on": []
                },
                {
                  "id": "E3.F1.S1.T2",
                  "task": "Add validate_ndc method with regex ^\\d{5}-\\d{4}-\\d{2}$",
                  "verify": "Invalid NDC '123' raises ValidationError",
                  "depends_on": ["E3.F1.S1.T1"]
                }
              ]
            },
            {
              "id": "E3.F1.S2",
              "name": "Drug ViewSet with idempotent create",
              "desc": "CRUD via /api/drugs/; duplicate NDC returns existing record.",
              "phase": "required",
              "depends_on": ["E3.F1.S1"],
              "acceptance_criteria": [
                "GET /api/drugs/ returns paginated list",
                "GET /api/drugs/{id}/ returns single record",
                "POST /api/drugs/ creates record",
                "POST with duplicate NDC does NOT create duplicate (200 or 409, never 500)",
                "PUT/PATCH /api/drugs/{id}/ updates record",
                "DELETE /api/drugs/{id}/ removes record"
              ],
              "subtasks": [
                {
                  "id": "E3.F1.S2.T1",
                  "task": "Create DrugViewSet with queryset Drug.objects.all()",
                  "verify": "Router registers viewset at /api/drugs/",
                  "depends_on": []
                },
                {
                  "id": "E3.F1.S2.T2",
                  "task": "Override create(): if NDC exists, return existing with 200 (or 409 with clear body)",
                  "verify": "POST same NDC twice yields one DB row",
                  "depends_on": ["E3.F1.S2.T1"]
                },
                {
                  "id": "E3.F1.S2.T3",
                  "task": "Wire URL router in config/urls.py under /api/",
                  "verify": "curl GET /api/drugs/ returns 200 JSON",
                  "depends_on": ["E3.F1.S2.T2"]
                }
              ]
            }
          ]
        },
        {
          "id": "E3.F2",
          "name": "Search and Filtering",
          "desc": "Flexible query params for catalog search.",
          "phase": "required",
          "depends_on": ["E3.F1"],
          "stories": [
            {
              "id": "E3.F2.S1",
              "name": "Filter backend",
              "desc": "django-filter or DRF SearchFilter/OrderingFilter for drug_name, manufacturer, dosage_form, dea_schedule, price range.",
              "phase": "required",
              "depends_on": ["E3.F1.S2"],
              "acceptance_criteria": [
                "?search=prozac filters drug_name (case-insensitive)",
                "?manufacturer=Pfizer filters by manufacturer",
                "?dosage_form=TABLET filters by dosage form",
                "?dea_schedule=II filters controlled substances",
                "?dea_schedule= filters for non-controlled (null)",
                "?min_price=1&max_price=10 filters unit_price range",
                "Results are paginated (default page size 25)"
              ],
              "subtasks": [
                {
                  "id": "E3.F2.S1.T1",
                  "task": "Install django-filter; create DrugFilterSet in backend/drugs/filters.py",
                  "verify": "FilterSet covers all query params listed in acceptance criteria",
                  "depends_on": []
                },
                {
                  "id": "E3.F2.S1.T2",
                  "task": "Attach filterset and pagination to DrugViewSet",
                  "verify": "GET /api/drugs/?search=xanax returns filtered results after seed load",
                  "depends_on": ["E3.F2.S1.T1"]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E4",
      "name": "Backend Observability and Hardening",
      "desc": "Environment-driven config, global error handling, structured logging, CORS, health check, OpenAPI docs.",
      "phase": "required",
      "depends_on": ["E2"],
      "features": [
        {
          "id": "E4.F1",
          "name": "Configuration Management",
          "desc": "All settings driven by environment variables via django-environ.",
          "phase": "required",
          "depends_on": ["E2.F1"],
          "stories": [
            {
              "id": "E4.F1.S1",
              "name": "Environment-based settings",
              "desc": "Split settings for DATABASE_URL, DEBUG, SECRET_KEY, LOG_LEVEL, ALLOWED_HOSTS, CORS.",
              "phase": "required",
              "depends_on": ["E2.F1.S1"],
              "acceptance_criteria": [
                "Settings read from .env via django-environ",
                "DATABASE_URL switches between SQLite (local) and Postgres (docker)",
                "No hardcoded secrets in source"
              ],
              "subtasks": [
                {
                  "id": "E4.F1.S1.T1",
                  "task": "Refactor config/settings.py to use environ.Env(); read DATABASE_URL, DEBUG, SECRET_KEY, LOG_LEVEL",
                  "verify": "App starts with .env copied from .env.example",
                  "depends_on": []
                },
                {
                  "id": "E4.F1.S1.T2",
                  "task": "Configure DATABASES from DATABASE_URL (dj-database-url or manual parsing)",
                  "verify": "SQLite works locally; Postgres URL parses without error",
                  "depends_on": ["E4.F1.S1.T1"]
                }
              ]
            }
          ]
        },
        {
          "id": "E4.F2",
          "name": "Error Handling and Logging",
          "desc": "Consistent API error envelope and structured JSON logs.",
          "phase": "required",
          "depends_on": ["E4.F1"],
          "stories": [
            {
              "id": "E4.F2.S1",
              "name": "Global exception handler",
              "desc": "DRF custom exception handler returning {error, detail, field_errors} shape.",
              "phase": "required",
              "depends_on": ["E4.F1.S1"],
              "acceptance_criteria": [
                "Validation errors return 400 with field-level detail",
                "404 returns structured JSON (not HTML)",
                "500 returns generic message (no stack trace in response)"
              ],
              "subtasks": [
                {
                  "id": "E4.F2.S1.T1",
                  "task": "Create custom_exception_handler in backend/drugs/exceptions.py",
                  "verify": "POST invalid drug returns 400 JSON with field errors",
                  "depends_on": []
                },
                {
                  "id": "E4.F2.S1.T2",
                  "task": "Configure LOGGING dict for JSON structured output; log request method, path, status, duration",
                  "verify": "Server logs show JSON lines on each request",
                  "depends_on": ["E4.F2.S1.T1"]
                }
              ]
            }
          ]
        },
        {
          "id": "E4.F3",
          "name": "CORS, Health, and API Docs",
          "desc": "Cross-origin support for Next.js dev server, health endpoint, OpenAPI schema.",
          "phase": "required",
          "depends_on": ["E4.F1"],
          "stories": [
            {
              "id": "E4.F3.S1",
              "name": "CORS and health check",
              "desc": "Allow frontend origin; expose GET /api/health/.",
              "phase": "required",
              "depends_on": ["E4.F1.S1"],
              "acceptance_criteria": [
                "CORS allows http://localhost:3000",
                "GET /api/health/ returns {status: ok}"
              ],
              "subtasks": [
                {
                  "id": "E4.F3.S1.T1",
                  "task": "Install django-cors-headers; configure CORS_ALLOWED_ORIGINS from env",
                  "verify": "Browser fetch from localhost:3000 succeeds",
                  "depends_on": []
                },
                {
                  "id": "E4.F3.S1.T2",
                  "task": "Add health check view at /api/health/",
                  "verify": "curl /api/health/ returns 200",
                  "depends_on": ["E4.F3.S1.T1"]
                }
              ]
            },
            {
              "id": "E4.F3.S2",
              "name": "OpenAPI documentation",
              "desc": "drf-spectacular schema and Swagger UI.",
              "phase": "required",
              "depends_on": ["E3.F1.S2"],
              "acceptance_criteria": [
                "GET /api/schema/ returns OpenAPI JSON",
                "GET /api/docs/ serves Swagger UI"
              ],
              "subtasks": [
                {
                  "id": "E4.F3.S2.T1",
                  "task": "Configure drf-spectacular in REST_FRAMEWORK and urls.py",
                  "verify": "/api/docs/ loads in browser",
                  "depends_on": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E5",
      "name": "Backend Seed Loading",
      "desc": "Management command to idempotently load seed_drugs.json into the database.",
      "phase": "required",
      "depends_on": ["E3"],
      "features": [
        {
          "id": "E5.F1",
          "name": "load_seed Management Command",
          "desc": "Upsert all 109 seed records from repo-root seed_drugs.json.",
          "phase": "required",
          "depends_on": ["E3.F1"],
          "stories": [
            {
              "id": "E5.F1.S1",
              "name": "Implement load_seed command",
              "desc": "Read JSON, upsert by NDC, report created/updated/skipped counts.",
              "phase": "required",
              "depends_on": ["E3.F1.S2"],
              "acceptance_criteria": [
                "python manage.py load_seed loads all 109 records",
                "Running twice is idempotent (0 new records on second run)",
                "Command accepts --file path override",
                "Invalid records are reported and skipped without aborting entire batch"
              ],
              "subtasks": [
                {
                  "id": "E5.F1.S1.T1",
                  "task": "Create backend/drugs/management/commands/load_seed.py",
                  "verify": "Command file exists and is discoverable by manage.py",
                  "depends_on": []
                },
                {
                  "id": "E5.F1.S1.T2",
                  "task": "Default file path: ../../seed_drugs.json relative to manage.py (or env SEED_FILE_PATH)",
                  "verify": "load_seed reads repo-root seed_drugs.json without manual copy",
                  "depends_on": ["E5.F1.S1.T1"]
                },
                {
                  "id": "E5.F1.S1.T3",
                  "task": "Implement update_or_create keyed on ndc; print summary stats",
                  "verify": "Drug.objects.count() == 109 after first run; same after second run",
                  "depends_on": ["E5.F1.S1.T2"]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E6",
      "name": "Backend Containerization",
      "desc": "Dockerfile for backend, docker-compose with Postgres, entrypoint runs migrations and optional seed.",
      "phase": "required",
      "depends_on": ["E4", "E5"],
      "features": [
        {
          "id": "E6.F1",
          "name": "Backend Dockerfile",
          "desc": "Multi-stage or slim Python image running gunicorn.",
          "phase": "required",
          "depends_on": ["E4.F3", "E5.F1"],
          "stories": [
            {
              "id": "E6.F1.S1",
              "name": "Create backend container image",
              "desc": "Dockerfile, .dockerignore, gunicorn entrypoint.",
              "phase": "required",
              "depends_on": ["E4.F3.S1", "E5.F1.S1"],
              "acceptance_criteria": [
                "docker build -t surecost-backend backend/ succeeds",
                "Container starts gunicorn on port 8000",
                ".dockerignore excludes venv, __pycache__, *.sqlite3"
              ],
              "subtasks": [
                {
                  "id": "E6.F1.S1.T1",
                  "task": "Write backend/Dockerfile (python:3.12-slim, install deps, copy app, CMD gunicorn)",
                  "verify": "docker build succeeds",
                  "depends_on": []
                },
                {
                  "id": "E6.F1.S1.T2",
                  "task": "Write backend/.dockerignore",
                  "verify": "Image size reasonable; no venv in context",
                  "depends_on": ["E6.F1.S1.T1"]
                },
                {
                  "id": "E6.F1.S1.T3",
                  "task": "Create backend/entrypoint.sh: wait for db, migrate, optional load_seed, exec gunicorn",
                  "verify": "Container starts and /api/health/ responds",
                  "depends_on": ["E6.F1.S1.T2"]
                }
              ]
            }
          ]
        },
        {
          "id": "E6.F2",
          "name": "Docker Compose (backend + db)",
          "desc": "Postgres service and backend service with volume and env wiring.",
          "phase": "required",
          "depends_on": ["E6.F1"],
          "stories": [
            {
              "id": "E6.F2.S1",
              "name": "docker-compose.yml for db + backend",
              "desc": "Postgres 16, backend depends_on db, DATABASE_URL set, seed mounted.",
              "phase": "required",
              "depends_on": ["E6.F1.S1"],
              "acceptance_criteria": [
                "docker compose up starts Postgres and backend",
                "Migrations run on startup",
                "Seed data loaded (109 drugs)",
                "API accessible at http://localhost:8000/api/drugs/"
              ],
              "subtasks": [
                {
                  "id": "E6.F2.S1.T1",
                  "task": "Write infra/docker-compose.yml (or root docker-compose.yml) with db and backend services",
                  "verify": "docker compose config validates",
                  "depends_on": []
                },
                {
                  "id": "E6.F2.S1.T2",
                  "task": "Mount seed_drugs.json into backend container; set SEED_FILE_PATH",
                  "verify": "109 drugs loaded after compose up",
                  "depends_on": ["E6.F2.S1.T1"]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E7",
      "name": "Frontend Shell and API Client",
      "desc": "Next.js App Router project with typed API client, TanStack Query, layout, and toast notifications.",
      "phase": "required",
      "depends_on": ["E3"],
      "features": [
        {
          "id": "E7.F1",
          "name": "Next.js Project Bootstrap",
          "desc": "Create frontend with TypeScript, Tailwind, App Router.",
          "phase": "required",
          "depends_on": ["E3.F1"],
          "stories": [
            {
              "id": "E7.F1.S1",
              "name": "Scaffold Next.js app",
              "desc": "npx create-next-app in frontend/ with App Router and Tailwind.",
              "phase": "required",
              "depends_on": ["E1.F1.S2"],
              "acceptance_criteria": [
                "frontend/ runs with npm run dev on port 3000",
                "TypeScript strict mode enabled",
                "Tailwind configured"
              ],
              "subtasks": [
                {
                  "id": "E7.F1.S1.T1",
                  "task": "Run create-next-app in frontend/ (App Router, TS, Tailwind, ESLint)",
                  "verify": "npm run dev serves default page",
                  "depends_on": []
                },
                {
                  "id": "E7.F1.S1.T2",
                  "task": "Install @tanstack/react-query, react-hook-form, zod, @hookform/resolvers",
                  "verify": "package.json lists dependencies",
                  "depends_on": ["E7.F1.S1.T1"]
                }
              ]
            }
          ]
        },
        {
          "id": "E7.F2",
          "name": "API Client and Providers",
          "desc": "Typed fetch wrapper, Drug types, QueryClient provider, env-based API URL.",
          "phase": "required",
          "depends_on": ["E7.F1"],
          "stories": [
            {
              "id": "E7.F2.S1",
              "name": "Typed API layer",
              "desc": "Drug interface matching domain_contract; api client with error parsing.",
              "phase": "required",
              "depends_on": ["E7.F1.S1"],
              "acceptance_criteria": [
                "Drug type matches all 8 backend fields + id",
                "API client reads NEXT_PUBLIC_API_URL",
                "API errors parsed into {message, fieldErrors} shape",
                "QueryClientProvider wraps app in layout.tsx"
              ],
              "subtasks": [
                {
                  "id": "E7.F2.S1.T1",
                  "task": "Create frontend/src/types/drug.ts and frontend/src/lib/api.ts",
                  "verify": "Types compile; api.getDrugs() callable",
                  "depends_on": []
                },
                {
                  "id": "E7.F2.S1.T2",
                  "task": "Create frontend/src/lib/query-client.ts and wrap layout with QueryClientProvider",
                  "verify": "DevTools or network tab shows query on page load",
                  "depends_on": ["E7.F2.S1.T1"]
                },
                {
                  "id": "E7.F2.S1.T3",
                  "task": "Add app shell: header with 'SureCost Drug Catalog', nav links (Drugs list)",
                  "verify": "Layout renders on all pages",
                  "depends_on": ["E7.F2.S1.T2"]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E8",
      "name": "Frontend Searchable Drug List",
      "desc": "Table view with debounced search, filters, pagination, and loading/error/empty states.",
      "phase": "required",
      "depends_on": ["E7"],
      "features": [
        {
          "id": "E8.F1",
          "name": "Drug List Page",
          "desc": "Main catalog view at / or /drugs.",
          "phase": "required",
          "depends_on": ["E7.F2"],
          "stories": [
            {
              "id": "E8.F1.S1",
              "name": "Drug table with pagination",
              "desc": "Display all drug fields; paginate via API page params.",
              "phase": "required",
              "depends_on": ["E7.F2.S1"],
              "acceptance_criteria": [
                "Table shows NDC, drug name, manufacturer, dosage form, strength, package size, unit price, DEA schedule",
                "Pagination controls fetch next/previous page",
                "Loading skeleton shown while fetching",
                "Empty state when no results",
                "Error banner on API failure"
              ],
              "subtasks": [
                {
                  "id": "E8.F1.S1.T1",
                  "task": "Create useDrugs query hook with pagination params",
                  "verify": "Hook returns paginated data from API",
                  "depends_on": []
                },
                {
                  "id": "E8.F1.S1.T2",
                  "task": "Build DrugTable component with all columns",
                  "verify": "Table renders 109 drugs (paginated) after seed load",
                  "depends_on": ["E8.F1.S1.T1"]
                },
                {
                  "id": "E8.F1.S1.T3",
                  "task": "Add Pagination component wired to query page param",
                  "verify": "Clicking next page fetches new data",
                  "depends_on": ["E8.F1.S1.T2"]
                }
              ]
            },
            {
              "id": "E8.F1.S2",
              "name": "Search and filter controls",
              "desc": "Debounced text search + dropdown filters for manufacturer, dosage form, DEA schedule.",
              "phase": "required",
              "depends_on": ["E8.F1.S1"],
              "acceptance_criteria": [
                "Search input debounced (300ms) filters drug_name",
                "Manufacturer filter dropdown populated from API or distinct values",
                "Dosage form filter works",
                "DEA schedule filter includes 'Non-controlled' option for null",
                "Filters reset pagination to page 1"
              ],
              "subtasks": [
                {
                  "id": "E8.F1.S2.T1",
                  "task": "Create DrugFilters component with search, manufacturer, dosage_form, dea_schedule controls",
                  "verify": "Filtering 'Xanax' shows only Xanax records",
                  "depends_on": []
                },
                {
                  "id": "E8.F1.S2.T2",
                  "task": "Wire filter state to useDrugs query params",
                  "verify": "Changing filter refetches with correct query string",
                  "depends_on": ["E8.F1.S2.T1"]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E9",
      "name": "Frontend Create and Edit Forms",
      "desc": "Forms with client-side validation; display backend validation errors on fields.",
      "phase": "required",
      "depends_on": ["E8"],
      "features": [
        {
          "id": "E9.F1",
          "name": "Drug Form Component",
          "desc": "Shared form for create and edit with zod schema.",
          "phase": "required",
          "depends_on": ["E8.F1"],
          "stories": [
            {
              "id": "E9.F1.S1",
              "name": "Zod validation schema",
              "desc": "Client-side rules matching domain_contract.",
              "phase": "required",
              "depends_on": ["E8.F1.S1"],
              "acceptance_criteria": [
                "NDC validated as 5-4-2 format",
                "Required fields enforced",
                "package_size positive integer",
                "unit_price non-negative number",
                "dea_schedule optional enum II/III/IV/V"
              ],
              "subtasks": [
                {
                  "id": "E9.F1.S1.T1",
                  "task": "Create frontend/src/lib/validations/drug.ts with zod schema",
                  "verify": "Schema rejects invalid NDC; accepts valid seed record",
                  "depends_on": []
                }
              ]
            },
            {
              "id": "E9.F1.S2",
              "name": "Create drug page",
              "desc": "Route /drugs/new with form submission via POST.",
              "phase": "required",
              "depends_on": ["E9.F1.S1"],
              "acceptance_criteria": [
                "Form submits to POST /api/drugs/",
                "Success redirects to drug list or detail",
                "Backend field errors mapped to form inputs",
                "Global error banner for non-field errors"
              ],
              "subtasks": [
                {
                  "id": "E9.F1.S2.T1",
                  "task": "Create DrugForm component with react-hook-form + zodResolver",
                  "verify": "Form renders all 8 fields",
                  "depends_on": []
                },
                {
                  "id": "E9.F1.S2.T2",
                  "task": "Create app/drugs/new/page.tsx using useCreateDrug mutation",
                  "verify": "Creating a drug appears in list",
                  "depends_on": ["E9.F1.S2.T1"]
                }
              ]
            },
            {
              "id": "E9.F1.S3",
              "name": "Edit drug page",
              "desc": "Route /drugs/[id]/edit with PATCH submission.",
              "phase": "required",
              "depends_on": ["E9.F1.S2"],
              "acceptance_criteria": [
                "Form pre-populated from GET /api/drugs/{id}/",
                "NDC field read-only on edit",
                "PATCH updates record; success toast shown"
              ],
              "subtasks": [
                {
                  "id": "E9.F1.S3.T1",
                  "task": "Create app/drugs/[id]/edit/page.tsx with useDrug + useUpdateDrug",
                  "verify": "Editing drug_name persists after save",
                  "depends_on": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E10",
      "name": "Frontend Delete with Confirmation",
      "desc": "Delete action with confirmation dialog and error handling.",
      "phase": "required",
      "depends_on": ["E8"],
      "features": [
        {
          "id": "E10.F1",
          "name": "Delete Flow",
          "desc": "Confirm dialog before DELETE; refetch list on success.",
          "phase": "required",
          "depends_on": ["E8.F1"],
          "stories": [
            {
              "id": "E10.F1.S1",
              "name": "Delete confirmation dialog",
              "desc": "Modal asks user to confirm; shows drug name and NDC.",
              "phase": "required",
              "depends_on": ["E8.F1.S1"],
              "acceptance_criteria": [
                "Delete button on each row opens confirmation dialog",
                "Cancel closes dialog without action",
                "Confirm calls DELETE /api/drugs/{id}/",
                "List refetches after successful delete",
                "Error toast on failure"
              ],
              "subtasks": [
                {
                  "id": "E10.F1.S1.T1",
                  "task": "Create DeleteDrugDialog component",
                  "verify": "Dialog shows drug name and NDC",
                  "depends_on": []
                },
                {
                  "id": "E10.F1.S1.T2",
                  "task": "Add useDeleteDrug mutation; wire to table row action",
                  "verify": "Deleting a drug removes it from list",
                  "depends_on": ["E10.F1.S1.T1"]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E11",
      "name": "Full-Stack Compose and Documentation",
      "desc": "Frontend Dockerfile, complete docker-compose, finalized README, AI_NOTES.md.",
      "phase": "required",
      "depends_on": ["E6", "E10"],
      "features": [
        {
          "id": "E11.F1",
          "name": "Frontend Containerization",
          "desc": "Next.js production build in Docker.",
          "phase": "required",
          "depends_on": ["E10.F1", "E6.F2"],
          "stories": [
            {
              "id": "E11.F1.S1",
              "name": "Frontend Dockerfile",
              "desc": "Multi-stage build: deps, build, standalone runner.",
              "phase": "required",
              "depends_on": ["E10.F1.S1", "E6.F2.S1"],
              "acceptance_criteria": [
                "docker build -t surecost-frontend frontend/ succeeds",
                "Container serves on port 3000",
                "NEXT_PUBLIC_API_URL points to backend service in compose"
              ],
              "subtasks": [
                {
                  "id": "E11.F1.S1.T1",
                  "task": "Write frontend/Dockerfile with standalone output",
                  "verify": "docker build succeeds",
                  "depends_on": []
                },
                {
                  "id": "E11.F1.S1.T2",
                  "task": "Add frontend service to docker-compose.yml",
                  "verify": "docker compose up serves UI at :3000 talking to backend",
                  "depends_on": ["E11.F1.S1.T1"]
                }
              ]
            }
          ]
        },
        {
          "id": "E11.F2",
          "name": "Final Documentation",
          "desc": "Complete README and AI_NOTES.md per submission requirements.",
          "phase": "required",
          "depends_on": ["E11.F1"],
          "stories": [
            {
              "id": "E11.F2.S1",
              "name": "Finalize README",
              "desc": "Setup instructions, architecture diagram, production readiness section.",
              "phase": "required",
              "depends_on": ["E11.F1.S1"],
              "acceptance_criteria": [
                "docker compose up is the primary setup path",
                "Local dev setup documented (backend + frontend separately)",
                "Production readiness lists 2-3 SureCost-specific changes (e.g. read replicas, NDC normalization pipeline, audit retention policy)"
              ],
              "subtasks": [
                {
                  "id": "E11.F2.S1.T1",
                  "task": "Write complete setup and architecture sections in README.md",
                  "verify": "Reviewer can follow README from clone to running app",
                  "depends_on": []
                },
                {
                  "id": "E11.F2.S1.T2",
                  "task": "Write Production Readiness section with 2-3 concrete SureCost-scale recommendations",
                  "verify": "Recommendations mention concurrent pharmacy locations, catalog ingestion scale",
                  "depends_on": ["E11.F2.S1.T1"]
                }
              ]
            },
            {
              "id": "E11.F2.S2",
              "name": "Create AI_NOTES.md",
              "desc": "Half-page reflection on AI tool usage per challenge brief.",
              "phase": "required",
              "depends_on": ["E11.F2.S1"],
              "acceptance_criteria": [
                "Lists tools used and for what",
                "One example of AI failure and how it was fixed",
                "Honest assessment of what worked and what did not"
              ],
              "subtasks": [
                {
                  "id": "E11.F2.S2.T1",
                  "task": "Write AI_NOTES.md (~half page)",
                  "verify": "File covers all three required reflection topics",
                  "depends_on": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E12",
      "name": "Controlled-Substance (DEA) Management",
      "desc": "Differentiator A: visual DEA schedule awareness, filtering, and extra safeguards for Schedule II drugs.",
      "phase": "stretch",
      "depends_on": ["E9", "E10"],
      "features": [
        {
          "id": "E12.F1",
          "name": "DEA Schedule Badges and Filtering",
          "desc": "Color-coded schedule badges in list; dedicated controlled-substance filter.",
          "phase": "stretch",
          "depends_on": ["E8.F1", "E9.F1"],
          "stories": [
            {
              "id": "E12.F1.S1",
              "name": "Schedule badge component",
              "desc": "Visual badges: C-II (red), C-III (orange), C-IV (yellow), C-V (blue), Non-controlled (gray).",
              "phase": "stretch",
              "depends_on": ["E8.F1.S1"],
              "acceptance_criteria": [
                "Each drug row shows correct badge based on dea_schedule",
                "Null schedule shows 'Non-controlled' badge",
                "Badge colors are distinct and accessible (not color-only; include text label)"
              ],
              "subtasks": [
                {
                  "id": "E12.F1.S1.T1",
                  "task": "Create DeaScheduleBadge component in frontend/src/components/",
                  "verify": "Xanax (IV) shows C-IV badge; Prozac shows Non-controlled",
                  "depends_on": []
                },
                {
                  "id": "E12.F1.S1.T2",
                  "task": "Integrate badge into DrugTable DEA column",
                  "verify": "All rows display correct badge",
                  "depends_on": ["E12.F1.S1.T1"]
                }
              ]
            },
            {
              "id": "E12.F1.S2",
              "name": "Controlled-substance summary panel",
              "desc": "Dashboard widget showing count by schedule (II, III, IV, V, non-controlled).",
              "phase": "stretch",
              "depends_on": ["E12.F1.S1"],
              "acceptance_criteria": [
                "Summary panel visible on drugs list page",
                "Counts match database (e.g. 15 Schedule II in seed data)",
                "Clicking a schedule count applies that filter"
              ],
              "subtasks": [
                {
                  "id": "E12.F1.S2.T1",
                  "task": "Add GET /api/drugs/schedule-summary/ endpoint returning counts by schedule",
                  "verify": "Endpoint returns correct counts for seed data",
                  "depends_on": []
                },
                {
                  "id": "E12.F1.S2.T2",
                  "task": "Create ControlledSubstanceSummary component; wire click-to-filter",
                  "verify": "Clicking C-II shows only Schedule II drugs",
                  "depends_on": ["E12.F1.S2.T1"]
                }
              ]
            }
          ]
        },
        {
          "id": "E12.F2",
          "name": "Schedule II Safeguards",
          "desc": "Extra confirmation step when editing or deleting Schedule II controlled substances.",
          "phase": "stretch",
          "depends_on": ["E12.F1"],
          "stories": [
            {
              "id": "E12.F2.S1",
              "name": "Schedule II edit/delete confirmation",
              "desc": "Require typed confirmation ('CONFIRM') for Schedule II mutations.",
              "phase": "stretch",
              "depends_on": ["E9.F1.S3", "E10.F1.S1"],
              "acceptance_criteria": [
                "Editing a Schedule II drug shows extra warning banner",
                "Deleting Schedule II requires typing CONFIRM in dialog",
                "Non-controlled drugs use standard confirmation only",
                "Backend logs Schedule II mutations at WARNING level"
              ],
              "subtasks": [
                {
                  "id": "E12.F2.S1.T1",
                  "task": "Extend DeleteDrugDialog: if dea_schedule=II, require CONFIRM text input",
                  "verify": "Cannot delete Ritalin without typing CONFIRM",
                  "depends_on": []
                },
                {
                  "id": "E12.F2.S1.T2",
                  "task": "Add warning banner on edit form for Schedule II drugs",
                  "verify": "Edit page for Ritalin shows controlled-substance warning",
                  "depends_on": []
                },
                {
                  "id": "E12.F2.S1.T3",
                  "task": "Backend: log WARNING on update/delete of dea_schedule=II records",
                  "verify": "Log output contains controlled_substance_mutation entry",
                  "depends_on": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E13",
      "name": "Change Audit Log",
      "desc": "Differentiator B: immutable audit trail for all drug create/update/delete operations.",
      "phase": "stretch",
      "depends_on": ["E3", "E12"],
      "features": [
        {
          "id": "E13.F1",
          "name": "AuditLog Model and Signals",
          "desc": "Backend persistence of change history with before/after diffs.",
          "phase": "stretch",
          "depends_on": ["E3.F1", "E12.F2"],
          "stories": [
            {
              "id": "E13.F1.S1",
              "name": "AuditLog model",
              "desc": "Fields: drug (FK), action (CREATE/UPDATE/DELETE), actor, timestamp, changes (JSON diff).",
              "phase": "stretch",
              "depends_on": ["E3.F1.S2"],
              "acceptance_criteria": [
                "AuditLog model created with migration",
                "CREATE logs all initial field values",
                "UPDATE logs changed fields only (before/after)",
                "DELETE logs final snapshot of all fields",
                "actor defaults to 'system' (no auth in MVP)"
              ],
              "subtasks": [
                {
                  "id": "E13.F1.S1.T1",
                  "task": "Create AuditLog model in backend/drugs/models.py",
                  "verify": "Migration applies cleanly",
                  "depends_on": []
                },
                {
                  "id": "E13.F1.S1.T2",
                  "task": "Implement audit logging via DRF perform_create/update/destroy overrides or django signals",
                  "verify": "Creating a drug produces one AuditLog row with action=CREATE",
                  "depends_on": ["E13.F1.S1.T1"]
                },
                {
                  "id": "E13.F1.S1.T3",
                  "task": "Compute field-level diff for UPDATE (only changed keys in changes JSON)",
                  "verify": "Updating drug_name logs {drug_name: {before, after}} only",
                  "depends_on": ["E13.F1.S1.T2"]
                }
              ]
            }
          ]
        },
        {
          "id": "E13.F2",
          "name": "Audit API and UI",
          "desc": "Read-only endpoints and frontend views for audit history.",
          "phase": "stretch",
          "depends_on": ["E13.F1"],
          "stories": [
            {
              "id": "E13.F2.S1",
              "name": "Audit read API",
              "desc": "GET /api/audit/ (global feed) and GET /api/drugs/{id}/audit/ (per-drug).",
              "phase": "stretch",
              "depends_on": ["E13.F1.S1"],
              "acceptance_criteria": [
                "Audit endpoints are read-only (no POST/PUT/DELETE)",
                "Results ordered by timestamp descending",
                "Paginated",
                "Include drug NDC and name in response"
              ],
              "subtasks": [
                {
                  "id": "E13.F2.S1.T1",
                  "task": "Create AuditLogSerializer and read-only ViewSet at /api/audit/",
                  "verify": "GET /api/audit/ returns recent changes",
                  "depends_on": []
                },
                {
                  "id": "E13.F2.S1.T2",
                  "task": "Add nested route GET /api/drugs/{id}/audit/",
                  "verify": "Returns only audit entries for that drug",
                  "depends_on": ["E13.F2.S1.T1"]
                }
              ]
            },
            {
              "id": "E13.F2.S2",
              "name": "Audit history UI",
              "desc": "Global audit feed page and per-drug history tab.",
              "phase": "stretch",
              "depends_on": ["E13.F2.S1"],
              "acceptance_criteria": [
                "/audit page shows global change feed with action, drug, timestamp, diff summary",
                "Drug edit page has 'History' tab showing per-drug audit entries",
                "Diff displayed in human-readable format (field: old → new)"
              ],
              "subtasks": [
                {
                  "id": "E13.F2.S2.T1",
                  "task": "Create app/audit/page.tsx with AuditFeed component",
                  "verify": "Page lists recent changes after CRUD operations",
                  "depends_on": []
                },
                {
                  "id": "E13.F2.S2.T2",
                  "task": "Add History tab to drug edit page showing per-drug audit trail",
                  "verify": "Editing a drug shows UPDATE entry in History tab",
                  "depends_on": ["E13.F2.S2.T1"]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E14",
      "name": "Batch Ingestion Endpoint",
      "desc": "POST /api/drugs/batch/ for bulk idempotent upsert with per-record result summary.",
      "phase": "stretch",
      "depends_on": ["E5"],
      "features": [
        {
          "id": "E14.F1",
          "name": "Batch Upsert API",
          "desc": "Accept JSON array of drug records; upsert by NDC; return summary.",
          "phase": "stretch",
          "depends_on": ["E5.F1"],
          "stories": [
            {
              "id": "E14.F1.S1",
              "name": "POST /api/drugs/batch/",
              "desc": "Bulk load with created/updated/error counts and per-record status.",
              "phase": "stretch",
              "depends_on": ["E5.F1.S1"],
              "acceptance_criteria": [
                "Accepts JSON array of drug objects",
                "Upserts by NDC (same logic as load_seed)",
                "Response: {created, updated, errors, results: [{ndc, status, error?}]}",
                "Invalid records do not abort entire batch",
                "Handles full seed_drugs.json payload (109 records) in < 2s locally"
              ],
              "subtasks": [
                {
                  "id": "E14.F1.S1.T1",
                  "task": "Create batch action on DrugViewSet or separate BatchIngestView",
                  "verify": "POST array of 5 drugs returns correct summary",
                  "depends_on": []
                },
                {
                  "id": "E14.F1.S1.T2",
                  "task": "Reuse validation from DrugSerializer per record; collect errors without aborting",
                  "verify": "Batch with 1 invalid NDC returns 4 success + 1 error",
                  "depends_on": ["E14.F1.S1.T1"]
                },
                {
                  "id": "E14.F1.S1.T3",
                  "task": "Use bulk_create/bulk_update or transaction for efficiency",
                  "verify": "109-record batch completes in < 2s",
                  "depends_on": ["E14.F1.S1.T2"]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E15",
      "name": "Backend Tests",
      "desc": "pytest suite covering models, serializers, endpoints, idempotency, filters, audit, and batch.",
      "phase": "stretch",
      "depends_on": ["E3", "E13", "E14"],
      "features": [
        {
          "id": "E15.F1",
          "name": "Test Suite",
          "desc": "Unit and integration tests with pytest-django.",
          "phase": "stretch",
          "depends_on": ["E13.F1", "E14.F1"],
          "stories": [
            {
              "id": "E15.F1.S1",
              "name": "Core API tests",
              "desc": "CRUD, idempotency, filtering, validation.",
              "phase": "stretch",
              "depends_on": ["E3.F2.S1"],
              "acceptance_criteria": [
                "Tests for create, read, update, delete",
                "Test duplicate NDC create returns existing (no duplicate row)",
                "Test each filter param",
                "Test invalid NDC returns 400",
                "All tests pass: pytest backend/"
              ],
              "subtasks": [
                {
                  "id": "E15.F1.S1.T1",
                  "task": "Configure pytest.ini and conftest.py with Django settings and API client fixture",
                  "verify": "pytest collects tests",
                  "depends_on": []
                },
                {
                  "id": "E15.F1.S1.T2",
                  "task": "Write test_drugs_api.py: CRUD, idempotency, filters, validation",
                  "verify": "pytest passes all drug API tests",
                  "depends_on": ["E15.F1.S1.T1"]
                }
              ]
            },
            {
              "id": "E15.F1.S2",
              "name": "Stretch feature tests",
              "desc": "Audit log and batch ingestion tests.",
              "phase": "stretch",
              "depends_on": ["E15.F1.S1", "E13.F1.S1", "E14.F1.S1"],
              "acceptance_criteria": [
                "Audit log created on CRUD operations",
                "Batch endpoint handles mixed valid/invalid records",
                "Schedule summary endpoint returns correct counts"
              ],
              "subtasks": [
                {
                  "id": "E15.F1.S2.T1",
                  "task": "Write test_audit.py and test_batch.py",
                  "verify": "pytest passes all stretch tests",
                  "depends_on": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E16",
      "name": "Frontend Tests",
      "desc": "Vitest component tests and Playwright E2E smoke tests.",
      "phase": "stretch",
      "depends_on": ["E8", "E12"],
      "features": [
        {
          "id": "E16.F1",
          "name": "Component and E2E Tests",
          "desc": "RTL tests for key components; Playwright CRUD smoke test.",
          "phase": "stretch",
          "depends_on": ["E12.F1"],
          "stories": [
            {
              "id": "E16.F1.S1",
              "name": "Component tests",
              "desc": "Test DrugTable, DrugForm, DeaScheduleBadge, filters.",
              "phase": "stretch",
              "depends_on": ["E12.F1.S1"],
              "acceptance_criteria": [
                "DrugTable renders columns and data",
                "DrugForm validates NDC format client-side",
                "DeaScheduleBadge renders correct label per schedule",
                "npm test passes"
              ],
              "subtasks": [
                {
                  "id": "E16.F1.S1.T1",
                  "task": "Configure Vitest + RTL in frontend/",
                  "verify": "npm test runs",
                  "depends_on": []
                },
                {
                  "id": "E16.F1.S1.T2",
                  "task": "Write tests for DrugTable, DrugForm, DeaScheduleBadge",
                  "verify": "All component tests pass",
                  "depends_on": ["E16.F1.S1.T1"]
                }
              ]
            },
            {
              "id": "E16.F1.S2",
              "name": "E2E smoke test",
              "desc": "Playwright test: list drugs, create, edit, delete.",
              "phase": "stretch",
              "depends_on": ["E16.F1.S1"],
              "acceptance_criteria": [
                "Playwright test loads drug list with seed data",
                "Creates a new drug and verifies it appears",
                "Edits and deletes the drug",
                "npx playwright test passes"
              ],
              "subtasks": [
                {
                  "id": "E16.F1.S2.T1",
                  "task": "Configure Playwright; write e2e/drugs.spec.ts",
                  "verify": "E2E test passes against docker-compose stack",
                  "depends_on": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E17",
      "name": "Design Polish",
      "desc": "Responsive layout, accessibility, extended-cost display, keyboard navigation.",
      "phase": "stretch",
      "depends_on": ["E8", "E12"],
      "features": [
        {
          "id": "E17.F1",
          "name": "UI Polish",
          "desc": "Professional, usable pharmacy catalog interface.",
          "phase": "stretch",
          "depends_on": ["E12.F1"],
          "stories": [
            {
              "id": "E17.F1.S1",
              "name": "Extended cost and responsive table",
              "desc": "Show unit_price x package_size; responsive card view on mobile.",
              "phase": "stretch",
              "depends_on": ["E8.F1.S1"],
              "acceptance_criteria": [
                "Extended cost column shows formatted USD (e.g. $25.50)",
                "Table scrolls horizontally on small screens or switches to card layout",
                "Consistent spacing, typography, and color palette"
              ],
              "subtasks": [
                {
                  "id": "E17.F1.S1.T1",
                  "task": "Add extended_cost computed column to DrugTable",
                  "verify": "Prozac row shows $25.50 (0.85 x 30)",
                  "depends_on": []
                },
                {
                  "id": "E17.F1.S1.T2",
                  "task": "Add responsive breakpoints; card layout below md",
                  "verify": "UI usable at 375px viewport width",
                  "depends_on": ["E17.F1.S1.T1"]
                }
              ]
            },
            {
              "id": "E17.F1.S2",
              "name": "Accessibility and keyboard navigation",
              "desc": "ARIA labels, focus management, keyboard-operable table and dialogs.",
              "phase": "stretch",
              "depends_on": ["E17.F1.S1"],
              "acceptance_criteria": [
                "All interactive elements reachable via Tab",
                "Delete dialog traps focus and closes on Escape",
                "Table has proper thead/tbody and scope attributes",
                "Color contrast meets WCAG AA for badge colors"
              ],
              "subtasks": [
                {
                  "id": "E17.F1.S2.T1",
                  "task": "Audit and fix a11y: ARIA labels, focus trap in dialogs, table semantics",
                  "verify": "Lighthouse accessibility score >= 90",
                  "depends_on": []
                },
                {
                  "id": "E17.F1.S2.T2",
                  "task": "Add keyboard shortcuts: / to focus search, Escape to close dialogs",
                  "verify": "Pressing / focuses search input on list page",
                  "depends_on": ["E17.F1.S2.T1"]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "build_order": [
    "E1 → E2 → E3 + E4 (parallel) → E5 → E6",
    "E3 → E7 → E8 → E9 + E10 (parallel) → E11",
    "MVP complete after E11",
    "E9 + E10 → E12 → E13",
    "E5 → E14",
    "E12 → E15 + E16 + E17 (parallel)"
  ],
  "api_contract": {
    "base_path": "/api",
    "endpoints": {
      "health": "GET /api/health/",
      "drugs_list": "GET /api/drugs/?search=&manufacturer=&dosage_form=&dea_schedule=&min_price=&max_price=&page=",
      "drugs_detail": "GET /api/drugs/{id}/",
      "drugs_create": "POST /api/drugs/",
      "drugs_update": "PATCH /api/drugs/{id}/",
      "drugs_delete": "DELETE /api/drugs/{id}/",
      "drugs_batch": "POST /api/drugs/batch/",
      "schedule_summary": "GET /api/drugs/schedule-summary/",
      "audit_list": "GET /api/audit/",
      "drug_audit": "GET /api/drugs/{id}/audit/",
      "schema": "GET /api/schema/",
      "docs": "GET /api/docs/"
    }
  }
}
```
