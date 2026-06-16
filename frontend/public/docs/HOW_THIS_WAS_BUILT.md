# How This Was Built — SureCost Drug Catalog

> A transparent walkthrough of how this take-home project was specified, built, evaluated, and delivered — including AI-assisted development.

---

## Epic timeline

The work splits into three phases: **MVP** (required epics E1–E11), **delivery & hardening** (E18–E23), and **stretch execution** (E24+, implementing deferred E12–E16).

```mermaid
flowchart LR
    subgraph MVP["Phase 1 — MVP (Cursor)"]
        E1[E1 Foundation]
        E2[E2–E6 Backend]
        E3[E7–E10 Frontend]
        E4[E11 Compose + Docs]
    end

    subgraph Delivery["Phase 2 — Delivery (Claude Code)"]
        E18[E18 Versions + Docker]
        E19[E19 GitHub repo]
        E20[E20 API tests]
        E21[E21 CI]
        E22[E22 GitHub Pages]
        E23[E23 Cloudflare tunnel]
    end

    subgraph Stretch["Phase 3 — Stretch"]
        E24[E24 UI polish]
        E25[E25 DEA mgmt]
        E26[E26 Audit log]
        E27[E27 Batch ingest]
        E29[E29 Frontend tests]
    end

    E1 --> E2 --> E3 --> E4
    E4 --> E18 --> E19
    E18 --> E20 --> E21
    E19 --> E22
    E18 --> E23 --> E22
    E4 --> E24 --> E25 --> E26
    E4 --> E27
    E25 --> E29
```

---

## SDLC workflow

Every story follows the same gate defined in [`AGENTS.md`](../AGENTS.md):

```mermaid
flowchart TD
    SPEC["spec.md / spec_addendum*.md\n(story + depends_on + acceptance + verify)"]
    READY{All depends_on done?}
    IMPL[Implement in repo\n(backend/ or frontend/)]
    VERIFY[Run verify steps\npytest / lint / build / manual]
    AC{All acceptance_criteria met?}
    COMMIT[Conventional commit\nfeat: / fix: / test: / docs:]
    SDLC[Update traceability]
    DONE[Story Done]

    SPEC --> READY
    READY -->|no| WAIT[Wait / pick another story]
    READY -->|yes| IMPL
    IMPL --> VERIFY
    VERIFY --> AC
    AC -->|no| IMPL
    AC -->|yes| COMMIT
    COMMIT --> SDLC
    SDLC --> DONE
```

**Source of truth:** [`spec.md`](../spec.md) is immutable for the original MVP backlog. Post-MVP work was tracked in spec addenda; the stretch-execution backlog is [`spec_addendum_2.md`](../spec_addendum_2.md).

---

## Tools and agents

```mermaid
flowchart TB
    HUMAN[Human — product owner / reviewer]
    CURSOR[Cursor Composer / Auto\nMVP E1–E11]
    CLAUDE[Claude Code (self-hosted)\nE18–E23 delivery]
    AGENTS[Parallel sub-agents\nE24+ stretch]
    CI[GitHub Actions CI\nruff + pytest + eslint + build]
    LIVE[Live demo\napp.gaspartech.com + api.gaspartech.com]

    HUMAN -->|kickoff brief| CURSOR
    CURSOR -->|build session| MVP[MVP complete]
    HUMAN -->|delivery phase| CLAUDE
    CLAUDE -->|delivery session| DELIVERY[Pages + tunnel + dark mode]
    HUMAN -->|stretch phase| AGENTS
    AGENTS --> STRETCH[DEA + audit + batch + tests]
    MVP --> CI
    DELIVERY --> CI
    STRETCH --> CI
    DELIVERY --> LIVE
```

| Phase | Primary tool | Artifact |
|-------|--------------|----------|
| MVP (E1–E11) | Cursor Agent | Cursor build session |
| Delivery (E18–E23) | Claude Code (self-hosted) | delivery session log |
| Handoff | Documentation | internal handoff notes |
| Stretch (E24+) | Cursor sub-agents | [`spec_addendum_2.md`](../spec_addendum_2.md) |

---

## What AI did well / where humans verified

From [`AI_NOTES.md`](../AI_NOTES.md):

- **Worked well:** Following `spec.md` story order; Django ViewSet + django-filter patterns; TanStack Query + zod + react-hook-form integration.
- **Required human verification:** Idempotent `load_seed` (first version skipped all rows on re-run); NDC format and 109-record count; zod `transform()` + resolver TypeScript mismatches.
- **Version decision:** Kept Django 6.0.x (built and tested) rather than downgrading to 5.2 LTS; standardized on Python 3.12.

---

## Evaluation approach

```mermaid
flowchart LR
    LOCAL[Local: migrate + load_seed + runserver]
    DOCKER[Docker compose full stack]
    TESTS[pytest 62+ / vitest / playwright]
    CI[GitHub Actions on every push]
    LIVE[Production-like demo URLs]

    LOCAL --> TESTS
    DOCKER --> TESTS
    TESTS --> CI
    CI --> LIVE
```

The live demo intentionally uses an **open API** (no auth) for evaluator access. Production hosting options are documented separately in [Production Hosting](./PRODUCTION_HOSTING.md).

---

## Repository map (quick reference)

| Concern | Location |
|---------|----------|
| Build recipe | `spec.md`, `spec_addendum_2.md` |
| Operating rules | `AGENTS.md` |
| Backend API | `backend/drugs/` |
| Frontend UI | `frontend/src/` |
| Seed data (109 records) | `seed_drugs.json` |
| CI | `.github/workflows/ci.yml` |
| Pages deploy | `.github/workflows/pages.yml` |
