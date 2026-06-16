# SureCost Drug Catalog — Specification Addendum 2 (Stretch Execution & Submission Polish)

This addendum extends [`spec.md`](spec.md) with **stretch epic execution** (implementing deferred E12–E16 from `spec.md`), **submission UI polish**, **architecture documentation**, and a **Project Summary** page in the app navbar.

It uses the **same JSON schema** as `spec.md` (epics → features → stories → subtasks, each with `depends_on`, `acceptance_criteria`, and `verify`).

**How to read**

1. `spec.md` remains immutable. Stretch stories **reference** `spec.md` E12–E16 acceptance criteria; this file adds orchestration epics `E24`→`E32` with any submission-specific deltas.
2. New phase: `"stretch-execution"` (implements deferred stretch + polish; distinct from `delivery`).
3. `depends_on` may reference ids from any prior file (`E23`, `E12.F1.S1`, etc.).
4. **E15** remains superseded by E20; **E28** adds backend tests for new stretch endpoints only.
5. **E17** responsive/a11y polish is **out of scope** unless time permits; E24 covers the submission-specific theme fixes.

**Preconditions**

- E1–E11 (MVP) and E18–E23 (delivery) are **Done**.
- CI green on `develop`; live demo at `app.gaspartech.com` / `api.gaspartech.com`.
- Do **not** implement production auth, WAF, or Postgres migration on the server — document those in `docs/PRODUCTION_HOSTING.md` only.

---

```json
{
  "project_name": "SureCost Drug Catalog — Stretch Execution & Submission Polish",
  "desc": "Implement deferred stretch features (DEA UI, audit log, batch ingest, frontend tests), submission UI polish (neutral dark gray theme, custom scrollbars, pointer cursors, DEA badge overflow), architecture docs with mermaid diagrams, and a Project Summary page in the navbar.",
  "extends": ["spec.md"],
  "domain_contract_changes": "none",
  "epics": [
    {
      "id": "E24",
      "name": "Submission UI Theme Polish",
      "desc": "Dark mode uses neutral dark gray (no navy/slate-blue). Custom scrollbar styling. All buttons and button-like controls use cursor:pointer. DEA column badges do not wrap.",
      "phase": "stretch-execution",
      "depends_on": ["E23"],
      "features": [
        {
          "id": "E24.F1",
          "name": "Neutral dark theme and global UX fixes",
          "phase": "stretch-execution",
          "depends_on": ["E8"],
          "stories": [
            {
              "id": "E24.F1.S1",
              "name": "Dark gray palette and scrollbar theme",
              "phase": "stretch-execution",
              "depends_on": [],
              "acceptance_criteria": [
                "Dark mode backgrounds use neutral gray (zinc/neutral/gray), not slate-blue or navy",
                "No visible navy-blue accents in dark mode (replace blue-600 nav CTAs with neutral or emerald/teal accent if needed)",
                "Custom scrollbar styling in globals.css for WebKit and Firefox (thumb/track themed for light and dark)",
                "Light mode palette unchanged or harmonized with neutral grays"
              ],
              "subtasks": [
                {
                  "id": "E24.F1.S1.T1",
                  "task": "Replace slate-* dark palette with neutral/zinc/gray across AppShell, DrugTable, DrugForm, Pagination, demo page",
                  "verify": "Visual inspection: dark mode is dark gray; no navy-blue header or backgrounds",
                  "depends_on": []
                },
                {
                  "id": "E24.F1.S1.T2",
                  "task": "Add custom scrollbar CSS in frontend/src/app/globals.css (::-webkit-scrollbar, scrollbar-color)",
                  "verify": "Scrollbars on drug table and long pages use themed thumb/track, not OS default",
                  "depends_on": []
                }
              ]
            },
            {
              "id": "E24.F1.S2",
              "name": "Pointer cursors and DEA badge overflow",
              "phase": "stretch-execution",
              "depends_on": ["E24.F1.S1"],
              "acceptance_criteria": [
                "All <button> elements and button-styled links have cursor:pointer",
                "DEA badges use whitespace-nowrap and do not wrap to multiple lines; cell may overflow horizontally within scrollable table",
                "Theme toggle, pagination, filter controls, dialog actions included"
              ],
              "subtasks": [
                {
                  "id": "E24.F1.S2.T1",
                  "task": "Add cursor-pointer to buttons and CTA links app-wide; add global button { cursor: pointer } in globals.css as fallback",
                  "verify": "Hovering any button shows pointer cursor",
                  "depends_on": []
                },
                {
                  "id": "E24.F1.S2.T2",
                  "task": "DEA badge/column: whitespace-nowrap overflow-visible on badge; ensure table horizontal scroll contains overflow",
                  "verify": "Non-controlled badge stays on one line; table scrolls horizontally if needed",
                  "depends_on": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E25",
      "name": "DEA Management (implements spec.md E12)",
      "desc": "Full controlled-substance UX: color-coded badges, schedule summary panel, Schedule II safeguards.",
      "phase": "stretch-execution",
      "depends_on": ["E23", "E24"],
      "implements": "spec.md E12",
      "features": [
        {
          "id": "E25.F1",
          "name": "DEA Schedule Badges and Summary (E12.F1)",
          "phase": "stretch-execution",
          "depends_on": ["E8.F1"],
          "stories": [
            {
              "id": "E25.F1.S1",
              "name": "DeaScheduleBadge component (E12.F1.S1)",
              "phase": "stretch-execution",
              "depends_on": ["E24.F1.S2"],
              "acceptance_criteria": [
                "DeaScheduleBadge in frontend/src/components/DeaScheduleBadge.tsx",
                "C-II red, C-III orange, C-IV yellow, C-V blue, Non-controlled gray — text labels included",
                "Integrated in DrugTable; replaces inline DeaBadge",
                "Badges do not wrap (inherits E24.F1.S2)"
              ],
              "subtasks": [
                {
                  "id": "E25.F1.S1.T1",
                  "task": "Create DeaScheduleBadge with spec colors; wire into DrugTable",
                  "verify": "Xanax shows C-IV; Prozac shows Non-controlled",
                  "depends_on": []
                }
              ]
            },
            {
              "id": "E25.F1.S2",
              "name": "Schedule summary panel (E12.F1.S2)",
              "phase": "stretch-execution",
              "depends_on": ["E25.F1.S1"],
              "acceptance_criteria": [
                "GET /api/drugs/schedule-summary/ returns counts: II, III, IV, V, non_controlled",
                "ControlledSubstanceSummary component on /drugs page",
                "Clicking a schedule count applies dea_schedule filter"
              ],
              "subtasks": [
                {
                  "id": "E25.F1.S2.T1",
                  "task": "Add schedule-summary @action on DrugViewSet; OpenAPI annotated",
                  "verify": "curl returns correct counts for 109 seed records",
                  "depends_on": []
                },
                {
                  "id": "E25.F1.S2.T2",
                  "task": "ControlledSubstanceSummary component + api client hook",
                  "verify": "Click C-II filters list to Schedule II only",
                  "depends_on": ["E25.F1.S2.T1"]
                }
              ]
            }
          ]
        },
        {
          "id": "E25.F2",
          "name": "Schedule II Safeguards (E12.F2)",
          "phase": "stretch-execution",
          "depends_on": ["E25.F1"],
          "stories": [
            {
              "id": "E25.F2.S1",
              "name": "Schedule II edit/delete confirmation (E12.F2.S1)",
              "phase": "stretch-execution",
              "depends_on": ["E9.F1", "E10.F1"],
              "acceptance_criteria": [
                "DeleteDrugDialog requires typing CONFIRM for dea_schedule=II",
                "Edit form shows warning banner for Schedule II drugs",
                "Backend logs WARNING on Schedule II update/delete with controlled_substance_mutation"
              ],
              "subtasks": [
                {
                  "id": "E25.F2.S1.T1",
                  "task": "Extend DeleteDrugDialog and edit page warning banner",
                  "verify": "Cannot delete Ritalin without CONFIRM",
                  "depends_on": []
                },
                {
                  "id": "E25.F2.S1.T2",
                  "task": "Log WARNING in DrugViewSet perform_update/destroy when dea_schedule=II",
                  "verify": "Log contains controlled_substance_mutation",
                  "depends_on": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E26",
      "name": "Change Audit Log (implements spec.md E13)",
      "desc": "Immutable audit trail for drug CRUD with read-only API and UI.",
      "phase": "stretch-execution",
      "depends_on": ["E25"],
      "implements": "spec.md E13",
      "features": [
        {
          "id": "E26.F1",
          "name": "AuditLog model and logging (E13.F1)",
          "phase": "stretch-execution",
          "depends_on": ["E3.F1", "E25.F2"],
          "stories": [
            {
              "id": "E26.F1.S1",
              "name": "AuditLog model and hooks (E13.F1.S1)",
              "phase": "stretch-execution",
              "depends_on": [],
              "acceptance_criteria": [
                "AuditLog model: drug FK (nullable on DELETE), action, actor (default system), timestamp, changes JSON",
                "CREATE/UPDATE/DELETE logged from DrugViewSet perform_* overrides",
                "UPDATE diffs only changed fields {field: {before, after}}"
              ],
              "subtasks": [
                {
                  "id": "E26.F1.S1.T1",
                  "task": "AuditLog model + migration",
                  "verify": "migrate applies",
                  "depends_on": []
                },
                {
                  "id": "E26.F1.S1.T2",
                  "task": "Audit logging in perform_create/update/destroy",
                  "verify": "POST drug creates AuditLog row action=CREATE",
                  "depends_on": ["E26.F1.S1.T1"]
                }
              ]
            }
          ]
        },
        {
          "id": "E26.F2",
          "name": "Audit API and UI (E13.F2)",
          "phase": "stretch-execution",
          "depends_on": ["E26.F1"],
          "stories": [
            {
              "id": "E26.F2.S1",
              "name": "Audit read API (E13.F2.S1)",
              "phase": "stretch-execution",
              "depends_on": ["E26.F1.S1"],
              "acceptance_criteria": [
                "GET /api/audit/ paginated, read-only, newest first",
                "GET /api/drugs/{id}/audit/ per-drug history",
                "Response includes drug ndc, drug_name"
              ],
              "subtasks": [
                {
                  "id": "E26.F2.S1.T1",
                  "task": "AuditLogSerializer + read-only ViewSet; nested drug audit action",
                  "verify": "GET /api/audit/ returns entries after CRUD",
                  "depends_on": []
                }
              ]
            },
            {
              "id": "E26.F2.S2",
              "name": "Audit history UI (E13.F2.S2)",
              "phase": "stretch-execution",
              "depends_on": ["E26.F2.S1"],
              "acceptance_criteria": [
                "/audit page with global feed",
                "Drug edit page History tab with per-drug trail",
                "Human-readable diff: field: old → new"
              ],
              "subtasks": [
                {
                  "id": "E26.F2.S2.T1",
                  "task": "app/audit/page.tsx + AuditFeed component; nav link in AppShell",
                  "verify": "Audit page lists changes after edit",
                  "depends_on": []
                },
                {
                  "id": "E26.F2.S2.T2",
                  "task": "History tab on drugs/edit page",
                  "verify": "Edit shows UPDATE in History tab",
                  "depends_on": ["E26.F2.S2.T1"]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E27",
      "name": "Batch Ingestion (implements spec.md E14)",
      "desc": "POST /api/drugs/batch/ bulk idempotent upsert.",
      "phase": "stretch-execution",
      "depends_on": ["E5", "E23"],
      "implements": "spec.md E14",
      "features": [
        {
          "id": "E27.F1",
          "name": "Batch upsert API (E14.F1)",
          "phase": "stretch-execution",
          "depends_on": ["E5.F1"],
          "stories": [
            {
              "id": "E27.F1.S1",
              "name": "POST /api/drugs/batch/ (E14.F1.S1)",
              "phase": "stretch-execution",
              "depends_on": [],
              "acceptance_criteria": [
                "Accepts JSON array of drug objects",
                "Upserts by NDC via update_or_create semantics",
                "Response: {created, updated, errors, results: [{ndc, status, error?}]}",
                "Invalid records do not abort batch",
                "109-record seed payload completes in < 2s locally"
              ],
              "subtasks": [
                {
                  "id": "E27.F1.S1.T1",
                  "task": "@action batch on DrugViewSet; reuse DrugSerializer validation per row",
                  "verify": "5-drug batch returns correct summary",
                  "depends_on": []
                },
                {
                  "id": "E27.F1.S1.T2",
                  "task": "Mixed valid/invalid batch; OpenAPI schema updated",
                  "verify": "1 bad NDC → 4 success + 1 error in results",
                  "depends_on": ["E27.F1.S1.T1"]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E28",
      "name": "Backend Stretch Tests",
      "desc": "Extend E20 test suite for schedule-summary, audit, and batch endpoints.",
      "phase": "stretch-execution",
      "depends_on": ["E25", "E26", "E27"],
      "features": [
        {
          "id": "E28.F1",
          "name": "Stretch API tests",
          "phase": "stretch-execution",
          "depends_on": ["E20"],
          "stories": [
            {
              "id": "E28.F1.S1",
              "name": "Tests for new endpoints",
              "phase": "stretch-execution",
              "depends_on": [],
              "acceptance_criteria": [
                "test_schedule_summary.py: counts match seed",
                "test_audit.py: CREATE/UPDATE/DELETE produce audit rows; UPDATE diff shape",
                "test_batch.py: upsert, mixed errors, idempotency",
                "pytest drugs/tests/ -q passes; CI green"
              ],
              "subtasks": [
                {
                  "id": "E28.F1.S1.T1",
                  "task": "Add test_schedule_summary.py, test_audit.py, test_batch.py",
                  "verify": "pytest drugs/tests/ -q all pass",
                  "depends_on": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E29",
      "name": "Frontend Tests (implements spec.md E16)",
      "desc": "Vitest + RTL component tests; Playwright E2E smoke.",
      "phase": "stretch-execution",
      "depends_on": ["E25", "E26.F2"],
      "implements": "spec.md E16",
      "features": [
        {
          "id": "E29.F1",
          "name": "Component and E2E tests (E16.F1)",
          "phase": "stretch-execution",
          "depends_on": ["E25.F1"],
          "stories": [
            {
              "id": "E29.F1.S1",
              "name": "Vitest component tests (E16.F1.S1)",
              "phase": "stretch-execution",
              "depends_on": [],
              "acceptance_criteria": [
                "Vitest + @testing-library/react configured",
                "Tests: DrugTable, DrugForm, DeaScheduleBadge",
                "npm test passes in CI (add job step or script)"
              ],
              "subtasks": [
                {
                  "id": "E29.F1.S1.T1",
                  "task": "Configure vitest; write component tests",
                  "verify": "npm test passes",
                  "depends_on": []
                }
              ]
            },
            {
              "id": "E29.F1.S2",
              "name": "Playwright E2E (E16.F1.S2)",
              "phase": "stretch-execution",
              "depends_on": ["E29.F1.S1"],
              "acceptance_criteria": [
                "Playwright config; e2e/drugs.spec.ts list/create/edit/delete smoke",
                "CI job runs playwright against built static app OR documents local-only with docker-compose",
                "npx playwright test passes locally"
              ],
              "subtasks": [
                {
                  "id": "E29.F1.S2.T1",
                  "task": "Playwright setup + drugs.spec.ts",
                  "verify": "playwright test passes",
                  "depends_on": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E30",
      "name": "Production Hosting Architecture Document",
      "desc": "Markdown doc with mermaid diagrams: how to host at various scales and compliance levels (no implementation).",
      "phase": "stretch-execution",
      "depends_on": ["E23"],
      "features": [
        {
          "id": "E30.F1",
          "name": "PRODUCTION_HOSTING.md",
          "phase": "stretch-execution",
          "depends_on": [],
          "stories": [
            {
              "id": "E30.F1.S1",
              "name": "Architecture doc at multiple scales",
              "phase": "stretch-execution",
              "depends_on": [],
              "acceptance_criteria": [
                "docs/PRODUCTION_HOSTING.md exists",
                "Mermaid diagrams for: single-tenant demo (current), small prod (managed DB + container), mid-scale (K8s, replicas), enterprise/compliance (HIPAA: encryption, audit, WAF, private networking)",
                "Covers auth options (API keys, OAuth, mTLS), Postgres vs SQLite, CDN, secrets management",
                "Explicitly states current demo is intentionally open/unauthenticated"
              ],
              "subtasks": [
                {
                  "id": "E30.F1.S1.T1",
                  "task": "Write docs/PRODUCTION_HOSTING.md with 3+ mermaid architecture diagrams",
                  "verify": "File renders mermaid in GitHub preview; diagrams cover demo/small/enterprise tiers",
                  "depends_on": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E31",
      "name": "How This Was Built Document",
      "desc": "Markdown walkthrough of the build/evaluate journey with mermaid charts.",
      "phase": "stretch-execution",
      "depends_on": ["E23"],
      "features": [
        {
          "id": "E31.F1",
          "name": "HOW_THIS_WAS_BUILT.md",
          "phase": "stretch-execution",
          "depends_on": [],
          "stories": [
            {
              "id": "E31.F1.S1",
              "name": "Build journey documentation",
              "phase": "stretch-execution",
              "depends_on": [],
              "acceptance_criteria": [
                "docs/HOW_THIS_WAS_BUILT.md exists",
                "Mermaid: epic timeline (E1-E11 MVP, E18-E23 delivery, E24+ stretch)",
                "Mermaid: SDLC workflow (spec → implement → verify → commit)",
                "Mermaid: tool/agent usage (Cursor MVP, Claude delivery, evaluation)",
                "References the delivery-phase build journey and commit history",
                "Describes AI-assisted development honestly per AI_NOTES.md"
              ],
              "subtasks": [
                {
                  "id": "E31.F1.S1.T1",
                  "task": "Write docs/HOW_THIS_WAS_BUILT.md with mermaid flowcharts and timeline",
                  "verify": "Doc covers MVP, delivery, stretch, and evaluation approach",
                  "depends_on": []
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "id": "E32",
      "name": "Project Summary Page and Navbar",
      "desc": "In-app page showing both docs + GitHub link; Project Summary button in top navbar.",
      "phase": "stretch-execution",
      "depends_on": ["E30", "E31", "E24"],
      "features": [
        {
          "id": "E32.F1",
          "name": "Project Summary UI",
          "phase": "stretch-execution",
          "depends_on": ["E30.F1", "E31.F1"],
          "stories": [
            {
              "id": "E32.F1.S1",
              "name": "Summary page with tabbed docs",
              "phase": "stretch-execution",
              "depends_on": [],
              "acceptance_criteria": [
                "Route /project (or /summary) renders both markdown docs in-app",
                "Tabs or sections: Production Hosting | How It Was Built",
                "GitHub repo link: https://github.com/jsteve1/surecost-drug-catalog",
                "AppShell navbar has 'Project Summary' link visible on all pages",
                "Works with Next.js static export (no server-side MD at runtime unless build-time import)",
                "Styled consistently with E24 neutral theme"
              ],
              "subtasks": [
                {
                  "id": "E32.F1.S1.T1",
                  "task": "Add react-markdown (or build-time MD import); create app/project/page.tsx",
                  "verify": "npm run build succeeds; /project shows both docs",
                  "depends_on": []
                },
                {
                  "id": "E32.F1.S1.T2",
                  "task": "Add Project Summary link to AppShell nav",
                  "verify": "Link visible from /drugs; navigates to summary page",
                  "depends_on": ["E32.F1.S1.T1"]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "build_order": [
    "E24 (UI polish) — can start immediately",
    "E25 (DEA) after E24; E27 (batch) parallel with E25 backend work",
    "E26 (audit) after E25.F2",
    "E28 (backend stretch tests) after E25+E26+E27",
    "E30 + E31 (docs) parallel with backend/frontend work",
    "E32 (Project Summary page) after E30+E31+E24",
    "E29 (frontend tests) after E25+E26 UI"
  ]
}
```
