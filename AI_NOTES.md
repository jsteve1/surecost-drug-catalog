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
