# AI Usage Notes

## Tools used

- **Cursor (Composer / Auto)** — Primary implementer for scaffolding the monorepo, Django backend (model, API, filters, seed command, Docker), Next.js frontend (list, forms, delete flow), and documentation.
- **Terminal** — Running migrations, `load_seed`, `npm run build`, and verification commands.
- **spec.md / AGENTS.md** — Source of truth for story order, acceptance criteria, and domain invariants.

## Example of AI failure and fix

When implementing `load_seed`, the first version used `DrugSerializer(data=record)` for every row. On the second run, DRF's unique validator rejected existing NDCs and marked all 109 rows as skipped. The fix was to pass `instance=existing` into the serializer before validation, then use `update_or_create` semantics — matching the idempotency requirement in the domain contract.

A second issue appeared in the frontend: `create-next-app` refused a non-empty `frontend/` directory. Moving the stub README out temporarily (or removing it) before scaffolding resolved the conflict.

## What worked / what did not

**Worked well:** Following `spec.md` story order with explicit commits per epic/story kept scope clear. Django + DRF patterns (ViewSet, django-filter, custom exception handler) were generated quickly and aligned with AGENTS.md conventions. TanStack Query + zod + react-hook-form integrated cleanly for the catalog UI.

**Less effective:** Trying to combine zod `transform()` on `dea_schedule` with `zodResolver` caused TypeScript resolver mismatches — simpler to keep form values as `"" | "II" | ...` and map to `null` in a `toDrugInput()` helper. Pinning Python 3.12 in Docker while the local venv used 3.14 required relying on Docker for the canonical runtime.

Overall, AI accelerated the MVP substantially; human-specified invariants (NDC format, idempotent POST, 109 seed records) needed explicit verification steps rather than assuming generated code was correct.

## E18 Delivery & Hardening — Version decisions

**Django version (E18.F1.S1):** Keeping **Django 6.0.6** rather than downgrading to 5.2 LTS.
- The MVP was built and verified on Django 6.0.6; downgrading would introduce unnecessary re-testing risk.
- spec.md `tech_stack.backend.framework` updated to "Django 6.x + Django REST Framework" to match reality.
- Python runtime: standardized on **3.12** (Dockerfile `python:3.12-slim`; local venv on `/usr/bin/python3.12`). The original dev used Python 3.14 locally; the canonical runtime is 3.12 per Docker and CI.

**Docker (E18.F2):** Docker was not pre-installed on the self-hosted server. Installed `docker.io` + `docker-compose-plugin` via apt and ran `docker compose up --build` to satisfy E11's Definition-of-Done item 7.

**Stretch epics E12–E17 (E18.F3):** Deferred at delivery (E15 superseded by E20); later implemented in the E24–E32 stretch execution.

**Public API (E23):** The API is intentionally **open** (no auth) for the demo. Anyone with the URL can read or write. Risk acknowledged; optional Cloudflare rate-limiting recommended for production. The live demo depends on the self-hosted server running the backend and `cloudflared`.

**E20 vs E15:** The addendum's E20 (API test suite) supersedes spec.md's E15 (backend tests stretch). E15 is marked deferred/replaced.
