"use client";

import { useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// Recognisable NDC that won't conflict with real seed data
const DEMO_NDC = "99998-0001-01";

interface Result {
  status: number;
  body: unknown;
  ok: boolean;
  ms: number;
}

interface DemoState {
  createdId: number | null;
  results: Record<string, Result>;
  running: string | null;
}

const REQUIREMENTS = [
  { id: "health",       label: "Health endpoint responds 200 OK" },
  { id: "list",         label: "Paginated list — count, next, previous, results" },
  { id: "search",       label: "Drug name search (case-insensitive, partial match)" },
  { id: "manufacturer", label: "Manufacturer filter (partial match)" },
  { id: "dea_filter",   label: "DEA schedule filter (II / III / IV / V)" },
  { id: "noncontrolled","label": "Non-controlled filter — ?dea_schedule= returns null records" },
  { id: "price",        label: "Price range filter (min_price / max_price)" },
  { id: "create",       label: "Create drug — 201 with extended_cost displayed" },
  { id: "idempotent",   label: "Idempotent create — duplicate NDC returns 200, no new row" },
  { id: "get",          label: "Get single drug by ID" },
  { id: "update",       label: "Partial update (PATCH)" },
  { id: "validation",   label: "Validation — bad NDC format returns 400 with field_errors" },
  { id: "delete",       label: "Delete — 204 No Content" },
] as const;

type ReqId = typeof REQUIREMENTS[number]["id"];

async function runRequest(
  method: string,
  url: string,
  body?: object,
): Promise<Result> {
  const t0 = Date.now();
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const ms = Date.now() - t0;
  let parsed: unknown = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    parsed = await res.json();
  }
  return { status: res.status, body: parsed, ok: res.ok, ms };
}

function StatusBadge({ status }: { status: number }) {
  const cls =
    status < 300
      ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300"
      : status < 400
      ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300"
      : "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300";
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-mono font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  const cls: Record<string, string> = {
    GET:    "bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300",
    POST:   "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300",
    PATCH:  "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300",
    DELETE: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300",
  };
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-mono font-bold ${cls[method] ?? ""}`}>
      {method}
    </span>
  );
}

interface CardProps {
  id: string;
  method: string;
  title: string;
  url: string;
  note?: string;
  body?: object;
  result?: Result;
  running: boolean;
  disabled?: boolean;
  disabledReason?: string;
  onRun: () => void;
}

function DemoCard({ method, title, url, note, body, result, running, disabled, disabledReason, onRun }: CardProps) {
  const displayUrl = url.replace(API_BASE, "");

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <div className="flex items-center gap-2 min-w-0">
          <MethodBadge method={method} />
          <span className="font-medium text-sm text-neutral-800 dark:text-neutral-200">{title}</span>
          <span className="font-mono text-xs text-neutral-500 dark:text-neutral-400 truncate">{displayUrl}</span>
        </div>
        <button
          type="button"
          onClick={onRun}
          disabled={disabled || running}
          title={disabled ? disabledReason : undefined}
          className="shrink-0 cursor-pointer rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {running ? "Running..." : "Run"}
        </button>
      </div>

      {note && (
        <p className="px-4 py-2 text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
          {note}
        </p>
      )}

      {body && (
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <p className="mb-1 text-xs font-medium text-neutral-500 dark:text-neutral-400">Request body</p>
          <pre className="text-xs font-mono text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
            {JSON.stringify(body, null, 2)}
          </pre>
        </div>
      )}

      {result && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <StatusBadge status={result.status} />
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{result.ms}ms</span>
          </div>
          <pre className="text-xs font-mono text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
            {result.body !== null
              ? JSON.stringify(result.body, null, 2)
              : "(no body — " + result.status + ")"}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function DemoPage() {
  const [state, setState] = useState<DemoState>({
    createdId: null,
    results: {},
    running: null,
  });
  const [runningAll, setRunningAll] = useState(false);

  const setResult = (id: string, result: Result) => {
    setState((prev) => ({ ...prev, results: { ...prev.results, [id]: result } }));
  };

  const completedReqs = new Set<ReqId>();
  const r = state.results;
  if (r["health"]?.ok) completedReqs.add("health");
  if (r["list"]?.ok) completedReqs.add("list");
  if (r["search"]?.ok) completedReqs.add("search");
  if (r["manufacturer"]?.ok) completedReqs.add("manufacturer");
  if (r["dea_filter"]?.ok) completedReqs.add("dea_filter");
  if (r["noncontrolled"]?.ok) completedReqs.add("noncontrolled");
  if (r["price"]?.ok) completedReqs.add("price");
  if (r["create"]?.status === 201) completedReqs.add("create");
  if (r["idempotent"]?.status === 200) completedReqs.add("idempotent");
  if (r["get"]?.ok) completedReqs.add("get");
  if (r["update"]?.ok) completedReqs.add("update");
  if (r["validation"]?.status === 400) completedReqs.add("validation");
  if (r["delete"]?.status === 204) completedReqs.add("delete");

  const createdUrl = state.createdId
    ? `${API_BASE}/drugs/${state.createdId}/`
    : `${API_BASE}/drugs/{id}/`;
  const needsId = !state.createdId;

  const run = useCallback(async (id: string, method: string, url: string, body?: object) => {
    setState((prev) => ({ ...prev, running: id }));
    try {
      const result = await runRequest(method, url, body);
      if (id === "create" && result.status === 201) {
        const data = result.body as { id?: number };
        if (data?.id) {
          setState((prev) => ({ ...prev, createdId: data.id ?? null, running: null, results: { ...prev.results, [id]: result } }));
          return;
        }
      }
      if (id === "delete" && result.status === 204) {
        setState((prev) => ({ ...prev, createdId: null, running: null, results: { ...prev.results, [id]: result } }));
        return;
      }
      setResult(id, result);
    } finally {
      setState((prev) => ({ ...prev, running: null }));
    }
  }, []);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const runAll = async () => {
    setRunningAll(true);
    // Reset prior state
    setState({ createdId: null, results: {}, running: null });

    const steps: Array<[string, string, string, object?]> = [
      ["health",       "GET",    `${API_BASE}/health/`],
      ["list",         "GET",    `${API_BASE}/drugs/?page_size=5`],
      ["search",       "GET",    `${API_BASE}/drugs/?search=aspirin&page_size=3`],
      ["manufacturer", "GET",    `${API_BASE}/drugs/?manufacturer=pfizer&page_size=3`],
      ["dea_filter",   "GET",    `${API_BASE}/drugs/?dea_schedule=II&page_size=3`],
      ["noncontrolled","GET",    `${API_BASE}/drugs/?dea_schedule=&page_size=3`],
      ["price",        "GET",    `${API_BASE}/drugs/?min_price=50&max_price=100&page_size=3`],
      ["validation",   "POST",   `${API_BASE}/drugs/`, { ndc: "INVALID", drug_name: "Bad Drug", manufacturer: "Acme", dosage_form: "TABLET", strength: "10mg", package_size: 10, unit_price: "5.00" }],
    ];

    for (const [id, method, url, body] of steps) {
      setState((prev) => ({ ...prev, running: id }));
      const result = await runRequest(method, url, body);
      setState((prev) => ({ ...prev, running: null, results: { ...prev.results, [id]: result } }));
      await sleep(300);
    }

    // Create (captures ID)
    setState((prev) => ({ ...prev, running: "create" }));
    const createBody = { ndc: DEMO_NDC, drug_name: "Demo Drug (auto-deleted)", manufacturer: "SureCost Demo", dosage_form: "TABLET", strength: "10mg", package_size: 30, unit_price: "12.50", dea_schedule: null };
    const createResult = await runRequest("POST", `${API_BASE}/drugs/`, createBody);
    const newId = (createResult.body as { id?: number })?.id ?? null;
    setState((prev) => ({ ...prev, running: null, createdId: newId, results: { ...prev.results, create: createResult } }));
    await sleep(300);

    if (newId) {
      // Idempotent create
      setState((prev) => ({ ...prev, running: "idempotent" }));
      const idempResult = await runRequest("POST", `${API_BASE}/drugs/`, createBody);
      setState((prev) => ({ ...prev, running: null, results: { ...prev.results, idempotent: idempResult } }));
      await sleep(300);

      // Get
      setState((prev) => ({ ...prev, running: "get" }));
      const getResult = await runRequest("GET", `${API_BASE}/drugs/${newId}/`);
      setState((prev) => ({ ...prev, running: null, results: { ...prev.results, get: getResult } }));
      await sleep(300);

      // Update
      setState((prev) => ({ ...prev, running: "update" }));
      const patchResult = await runRequest("PATCH", `${API_BASE}/drugs/${newId}/`, { unit_price: "19.99" });
      setState((prev) => ({ ...prev, running: null, results: { ...prev.results, update: patchResult } }));
      await sleep(300);

      // Delete (auto-cleanup)
      setState((prev) => ({ ...prev, running: "delete" }));
      const delResult = await runRequest("DELETE", `${API_BASE}/drugs/${newId}/`);
      setState((prev) => ({ ...prev, running: null, createdId: null, results: { ...prev.results, delete: delResult } }));
    }

    setRunningAll(false);
  };

  const cleanup = async () => {
    if (!state.createdId) return;
    await runRequest("DELETE", `${API_BASE}/drugs/${state.createdId}/`);
    setState((prev) => ({ ...prev, createdId: null }));
  };

  const createBody = {
    ndc: DEMO_NDC,
    drug_name: "Demo Drug (auto-deleted)",
    manufacturer: "SureCost Demo",
    dosage_form: "TABLET",
    strength: "10mg",
    package_size: 30,
    unit_price: "12.50",
    dea_schedule: null,
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">API Demo</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Live interactive demo against{" "}
            <span className="font-mono text-xs">{API_BASE}</span>. The API is open — no
            authentication required. Test records are automatically deleted.
          </p>
        </div>

        {/* Run All + cleanup */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={runAll}
            disabled={runningAll || !!state.running}
            className="cursor-pointer rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {runningAll ? "Running all..." : "Run All (sequential)"}
          </button>
          {state.createdId && (
            <button
              type="button"
              onClick={cleanup}
              className="rounded-md border border-red-300 dark:border-red-700 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Clean up test record (ID {state.createdId})
            </button>
          )}
        </div>

        {/* Requirements checklist */}
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Requirements</h2>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {REQUIREMENTS.map((req) => {
              const done = completedReqs.has(req.id);
              return (
                <li key={req.id} className="flex items-start gap-2 text-xs">
                  <span className={done ? "text-green-600 dark:text-green-400 font-bold" : "text-neutral-300 dark:text-neutral-600"}>
                    {done ? "✓" : "○"}
                  </span>
                  <span className={done ? "text-neutral-700 dark:text-neutral-300" : "text-neutral-400 dark:text-neutral-500"}>
                    {req.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Cards */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Read</h2>

          <DemoCard id="health" method="GET" title="Health check" url={`${API_BASE}/health/`}
            note="Confirms API is reachable and Django is up."
            result={r["health"]} running={state.running === "health"}
            onRun={() => run("health", "GET", `${API_BASE}/health/`)} />

          <DemoCard id="list" method="GET" title="List drugs (paginated)" url={`${API_BASE}/drugs/?page_size=5`}
            note="Returns { count, next, previous, results }. Default page size is 25."
            result={r["list"]} running={state.running === "list"}
            onRun={() => run("list", "GET", `${API_BASE}/drugs/?page_size=5`)} />

          <DemoCard id="search" method="GET" title="Search by drug name" url={`${API_BASE}/drugs/?search=aspirin&page_size=3`}
            note="Case-insensitive, partial match (icontains). Searches drug_name."
            result={r["search"]} running={state.running === "search"}
            onRun={() => run("search", "GET", `${API_BASE}/drugs/?search=aspirin&page_size=3`)} />

          <DemoCard id="manufacturer" method="GET" title="Filter by manufacturer" url={`${API_BASE}/drugs/?manufacturer=pfizer&page_size=3`}
            note="Partial, case-insensitive match. 'pfizer' matches 'Pfizer Inc.' and 'Pfizer Labs'."
            result={r["manufacturer"]} running={state.running === "manufacturer"}
            onRun={() => run("manufacturer", "GET", `${API_BASE}/drugs/?manufacturer=pfizer&page_size=3`)} />

          <DemoCard id="dea_filter" method="GET" title="Filter by DEA schedule" url={`${API_BASE}/drugs/?dea_schedule=II&page_size=3`}
            note="Controlled substances only. Valid values: II, III, IV, V."
            result={r["dea_filter"]} running={state.running === "dea_filter"}
            onRun={() => run("dea_filter", "GET", `${API_BASE}/drugs/?dea_schedule=II&page_size=3`)} />

          <DemoCard id="noncontrolled" method="GET" title="Non-controlled drugs only" url={`${API_BASE}/drugs/?dea_schedule=&page_size=3`}
            note="Empty dea_schedule param filters for records where dea_schedule IS NULL (non-controlled)."
            result={r["noncontrolled"]} running={state.running === "noncontrolled"}
            onRun={() => run("noncontrolled", "GET", `${API_BASE}/drugs/?dea_schedule=&page_size=3`)} />

          <DemoCard id="price" method="GET" title="Price range filter" url={`${API_BASE}/drugs/?min_price=50&max_price=100&page_size=3`}
            note="min_price and max_price filter on unit_price. Combinable with other filters."
            result={r["price"]} running={state.running === "price"}
            onRun={() => run("price", "GET", `${API_BASE}/drugs/?min_price=50&max_price=100&page_size=3`)} />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Write</h2>

          <DemoCard id="create" method="POST" title="Create drug" url={`${API_BASE}/drugs/`}
            note="Returns 201 on creation. extended_cost = unit_price × package_size is computed display-only (= $375.00 here)."
            body={createBody} result={r["create"]} running={state.running === "create"}
            onRun={() => run("create", "POST", `${API_BASE}/drugs/`, createBody)} />

          <DemoCard id="idempotent" method="POST" title="Idempotent create — same NDC" url={`${API_BASE}/drugs/`}
            note="Same NDC as above. Must return 200 with the existing record. Never 500, never a duplicate row."
            body={createBody} result={r["idempotent"]} running={state.running === "idempotent"}
            onRun={() => run("idempotent", "POST", `${API_BASE}/drugs/`, createBody)} />

          <DemoCard id="get" method="GET" title="Get drug by ID" url={createdUrl}
            note="Fetch the drug created above by its assigned ID."
            result={r["get"]} running={state.running === "get"}
            disabled={needsId} disabledReason="Run Create first"
            onRun={() => run("get", "GET", createdUrl)} />

          <DemoCard id="update" method="PATCH" title="Partial update" url={createdUrl}
            note="PATCH — only send fields you want to change. unit_price updated to $19.99."
            body={{ unit_price: "19.99" }} result={r["update"]} running={state.running === "update"}
            disabled={needsId} disabledReason="Run Create first"
            onRun={() => run("update", "PATCH", createdUrl, { unit_price: "19.99" })} />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Validation &amp; Error Handling</h2>

          <DemoCard id="validation" method="POST" title="Bad NDC format → 400" url={`${API_BASE}/drugs/`}
            note="NDC must match #####-####-## (regex ^\\d{5}-\\d{4}-\\d{2}$). Returns 400 with field_errors envelope."
            body={{ ndc: "INVALID", drug_name: "Bad Drug", manufacturer: "Acme", dosage_form: "TABLET", strength: "10mg", package_size: 10, unit_price: "5.00" }}
            result={r["validation"]} running={state.running === "validation"}
            onRun={() => run("validation", "POST", `${API_BASE}/drugs/`, { ndc: "INVALID", drug_name: "Bad Drug", manufacturer: "Acme", dosage_form: "TABLET", strength: "10mg", package_size: 10, unit_price: "5.00" })} />
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Delete</h2>

          <DemoCard id="delete" method="DELETE" title="Delete drug" url={createdUrl}
            note="Returns 204 No Content. The record created above is deleted — no cleanup needed after this."
            result={r["delete"]} running={state.running === "delete"}
            disabled={needsId} disabledReason="Run Create first"
            onRun={() => run("delete", "DELETE", createdUrl)} />
        </div>
      </div>
    </AppShell>
  );
}
