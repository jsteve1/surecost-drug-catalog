"use client";

import { useCallback, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

// Client-side safety limits so a malformed or oversized file never reaches the API.
const MAX_FILE_BYTES = 2_000_000; // 2 MB
const MAX_RECORDS = 1000;

const REQUIRED_FIELDS = [
  "ndc",
  "drug_name",
  "manufacturer",
  "dosage_form",
  "strength",
  "package_size",
  "unit_price",
] as const;
const NDC_RE = /^\d{5}-\d{4}-\d{2}$/;
const DEA_VALUES = new Set(["II", "III", "IV", "V"]);

type DrugRecord = Record<string, unknown>;

interface InvalidRow {
  index: number;
  ndc: string;
  reasons: string[];
}

interface Analysis {
  total: number;
  validIndices: number[];
  invalidRows: InvalidRow[];
  dupeNdcs: { ndc: string; count: number }[];
  existingNdcs: string[];
  catalogChecked: boolean;
  records: DrugRecord[];
}

interface IngestResult {
  created: number;
  updated: number;
  errors: number;
  results: { ndc: string; status: string; error?: unknown }[];
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function validateRecord(record: unknown, index: number): InvalidRow | null {
  if (typeof record !== "object" || record === null || Array.isArray(record)) {
    return { index, ndc: "", reasons: ["row is not a JSON object"] };
  }
  const r = record as DrugRecord;
  const ndc = asString(r.ndc);
  const reasons: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    const v = r[field];
    if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) {
      reasons.push(`missing ${field}`);
    }
  }
  if (ndc && !NDC_RE.test(ndc)) {
    reasons.push("ndc must match #####-####-##");
  }
  if (r.package_size !== undefined && r.package_size !== null) {
    const n = Number(r.package_size);
    if (!Number.isInteger(n) || n < 1) reasons.push("package_size must be an integer ≥ 1");
  }
  if (r.unit_price !== undefined && r.unit_price !== null) {
    const n = Number(r.unit_price);
    if (!Number.isFinite(n) || n < 0) reasons.push("unit_price must be a number ≥ 0");
  }
  const dea = r.dea_schedule;
  if (dea !== undefined && dea !== null && dea !== "" && !DEA_VALUES.has(String(dea))) {
    reasons.push("dea_schedule must be II/III/IV/V or null");
  }
  return reasons.length ? { index, ndc, reasons } : null;
}

// Walk the paginated catalog (search matches drug_name only and there is no ndc
// filter, so we follow `next` links) and map ndc -> id.
async function fetchCatalogMap(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  let url: string | null = `${API_BASE}/drugs/?page_size=100`;
  let pages = 0;
  while (url && pages < 100) {
    const res = await fetch(url);
    if (!res.ok) break;
    const data: { next: string | null; results?: { ndc: string; id: number }[] } =
      await res.json();
    for (const row of data.results ?? []) map.set(row.ndc, row.id);
    url = data.next;
    pages += 1;
  }
  return map;
}

function buildCleanupScript(ndcs: string[]): string {
  const ndcList = ndcs.map((n) => `  "${n}"`).join("\n");
  return `#!/usr/bin/env bash
# Cleanup for your batch-ingested records.
# Deletes ONLY the rows newly CREATED by your upload (pre-existing updates are left alone).
# Requires: bash, curl, jq.  Override the API base:  API=https://api.gaspartech.com/api ./cleanup.sh
set -euo pipefail
API="\${API:-${API_BASE}}"

NDCS=(
${ndcList}
)

echo "Fetching catalog from \$API/drugs/ ..."
all='[]'
url="\$API/drugs/?page_size=100"
while [ -n "\$url" ] && [ "\$url" != "null" ]; do
  page="\$(curl -fsS "\$url")"
  all="\$(jq -s '.[0] + (.[1].results // [])' <(echo "\$all") <(echo "\$page"))"
  url="\$(echo "\$page" | jq -r '.next')"
done

deleted=0
for ndc in "\${NDCS[@]}"; do
  id="\$(echo "\$all" | jq -r --arg n "\$ndc" 'map(select(.ndc==\$n)) | .[0].id // empty')"
  if [ -n "\$id" ]; then
    code="\$(curl -fsS -o /dev/null -w '%{http_code}' -X DELETE "\$API/drugs/\$id/")"
    echo "deleted ndc=\$ndc id=\$id http=\$code"
    deleted=\$((deleted + 1))
  else
    echo "skip (not found): ndc=\$ndc"
  fi
done
echo "Removed \$deleted of \${#NDCS[@]} created record(s)."
`;
}

export function BatchUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [createdNdcs, setCreatedNdcs] = useState<string[]>([]);
  const [cleanupScript, setCleanupScript] = useState<string | null>(null);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupDone, setCleanupDone] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resetOutputs = () => {
    setIngestResult(null);
    setCreatedNdcs([]);
    setCleanupScript(null);
    setCleanupDone(null);
    setCopied(false);
  };

  const processFile = useCallback(async (file: File) => {
    setParseError(null);
    setAnalysis(null);
    resetOutputs();
    setFileMeta({ name: file.name, size: file.size });

    if (file.size > MAX_FILE_BYTES) {
      setParseError(
        `File is ${(file.size / 1e6).toFixed(2)} MB — over the ${(MAX_FILE_BYTES / 1e6).toFixed(0)} MB safety limit. Split it before uploading.`,
      );
      return;
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      setParseError("Could not read the file.");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setParseError(`Not valid JSON — ${(e as Error).message}`);
      return;
    }
    if (!Array.isArray(parsed)) {
      setParseError("Top-level JSON must be an array of drug objects.");
      return;
    }
    if (parsed.length === 0) {
      setParseError("The array is empty — nothing to ingest.");
      return;
    }
    if (parsed.length > MAX_RECORDS) {
      setParseError(
        `${parsed.length.toLocaleString()} records — over the ${MAX_RECORDS.toLocaleString()}-record safety limit. Split the file.`,
      );
      return;
    }

    const records = parsed as DrugRecord[];
    const invalidRows: InvalidRow[] = [];
    const validIndices: number[] = [];
    const ndcCounts = new Map<string, number>();

    records.forEach((record, i) => {
      const bad = validateRecord(record, i);
      if (bad) invalidRows.push(bad);
      else validIndices.push(i);
      const ndc =
        typeof record === "object" && record !== null
          ? asString((record as DrugRecord).ndc)
          : "";
      if (ndc) ndcCounts.set(ndc, (ndcCounts.get(ndc) ?? 0) + 1);
    });

    const dupeNdcs = Array.from(ndcCounts.entries())
      .filter(([, count]) => count > 1)
      .map(([ndc, count]) => ({ ndc, count }));

    setAnalysis({
      total: records.length,
      validIndices,
      invalidRows,
      dupeNdcs,
      existingNdcs: [],
      catalogChecked: false,
      records,
    });

    // Best-effort: flag NDCs that already exist in the catalog (these would update).
    try {
      const catalog = await fetchCatalogMap();
      const existing = Array.from(ndcCounts.keys()).filter((n) => catalog.has(n));
      setAnalysis((prev) =>
        prev ? { ...prev, existingNdcs: existing, catalogChecked: true } : prev,
      );
    } catch {
      setAnalysis((prev) => (prev ? { ...prev, catalogChecked: true } : prev));
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = "";
  };

  const ingest = useCallback(async () => {
    if (!analysis || analysis.validIndices.length === 0) return;
    const payload = analysis.validIndices.map((i) => analysis.records[i]);
    setIngesting(true);
    resetOutputs();
    try {
      const res = await fetch(`${API_BASE}/drugs/batch/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: IngestResult = await res.json();
      setIngestResult(data);
      const created = (data.results ?? [])
        .filter((row) => row.status === "created")
        .map((row) => row.ndc);
      setCreatedNdcs(created);
      setCleanupScript(created.length ? buildCleanupScript(created) : null);
    } catch (e) {
      setParseError(`Ingest failed — ${(e as Error).message}`);
    } finally {
      setIngesting(false);
    }
  }, [analysis]);

  const cleanupNow = useCallback(async () => {
    if (createdNdcs.length === 0) return;
    setCleaning(true);
    try {
      const map = await fetchCatalogMap();
      let deleted = 0;
      for (const ndc of createdNdcs) {
        const id = map.get(ndc);
        if (id != null) {
          const res = await fetch(`${API_BASE}/drugs/${id}/`, { method: "DELETE" });
          if (res.ok) deleted += 1;
        }
      }
      setCleanupDone(`Deleted ${deleted} of ${createdNdcs.length} created record(s).`);
      setCreatedNdcs([]);
      setCleanupScript(null);
      setIngestResult(null);
    } finally {
      setCleaning(false);
    }
  }, [createdNdcs]);

  const copyScript = async () => {
    if (!cleanupScript) return;
    try {
      await navigator.clipboard.writeText(cleanupScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const validCount = analysis?.validIndices.length ?? 0;
  const canIngest = !!analysis && validCount > 0 && !ingesting;

  return (
    <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden">
      <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          Upload &amp; validate your own batch
        </p>
        <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400">
          Drop a JSON <span className="font-mono">array</span> of drug records. It is validated
          locally (shape, NDC format, duplicates) and capped at {MAX_RECORDS.toLocaleString()} records /{" "}
          {(MAX_FILE_BYTES / 1e6).toFixed(0)} MB before anything is sent.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Dropzone */}
        <div
          data-batch-dropzone
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-8 text-center transition ${
            dragOver
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
              : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500"
          }`}
        >
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Drag &amp; drop a <span className="font-mono">.json</span> file here
          </p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">or click to browse</p>
          {fileMeta && (
            <p className="mt-2 font-mono text-xs text-neutral-600 dark:text-neutral-400">
              {fileMeta.name} · {(fileMeta.size / 1024).toFixed(1)} KB
            </p>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onInputChange}
          />
        </div>

        {parseError && (
          <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {parseError}
          </div>
        )}

        {/* Analysis */}
        {analysis && (
          <div className="space-y-3 rounded-md border border-neutral-200 dark:border-neutral-700 p-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <Chip tone="neutral" label={`${analysis.total} total`} />
              <Chip tone="green" label={`${validCount} valid`} />
              <Chip
                tone={analysis.invalidRows.length ? "red" : "neutral"}
                label={`${analysis.invalidRows.length} invalid`}
              />
              <Chip
                tone={analysis.dupeNdcs.length ? "amber" : "neutral"}
                label={`${analysis.dupeNdcs.length} duplicate NDC${analysis.dupeNdcs.length === 1 ? "" : "s"} in file`}
              />
              <Chip
                tone={analysis.existingNdcs.length ? "amber" : "neutral"}
                label={
                  analysis.catalogChecked
                    ? `${analysis.existingNdcs.length} already in catalog`
                    : "checking catalog…"
                }
              />
            </div>

            {analysis.dupeNdcs.length > 0 && (
              <Detail title="Duplicate NDCs within the file (later rows upsert earlier ones)">
                {analysis.dupeNdcs
                  .slice(0, 12)
                  .map((d) => `${d.ndc} ×${d.count}`)
                  .join(", ")}
                {analysis.dupeNdcs.length > 12 ? ` … +${analysis.dupeNdcs.length - 12} more` : ""}
              </Detail>
            )}

            {analysis.existingNdcs.length > 0 && (
              <Detail title="Already in catalog (these would UPDATE, not create)">
                {analysis.existingNdcs.slice(0, 12).join(", ")}
                {analysis.existingNdcs.length > 12
                  ? ` … +${analysis.existingNdcs.length - 12} more`
                  : ""}
              </Detail>
            )}

            {analysis.invalidRows.length > 0 && (
              <Detail title={`Invalid rows (skipped — not sent to the API)`}>
                <ul className="space-y-1">
                  {analysis.invalidRows.slice(0, 8).map((row) => (
                    <li key={row.index} className="font-mono">
                      row {row.index} {row.ndc ? `(${row.ndc})` : ""}: {row.reasons.join("; ")}
                    </li>
                  ))}
                </ul>
                {analysis.invalidRows.length > 8
                  ? `… +${analysis.invalidRows.length - 8} more invalid rows`
                  : ""}
              </Detail>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={ingest}
                disabled={!canIngest}
                className="cursor-pointer rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {ingesting ? "Ingesting…" : `Ingest ${validCount} valid record${validCount === 1 ? "" : "s"}`}
              </button>
              {analysis.invalidRows.length > 0 && (
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {analysis.invalidRows.length} invalid row
                  {analysis.invalidRows.length === 1 ? "" : "s"} will be skipped
                </span>
              )}
            </div>
          </div>
        )}

        {/* Ingest result */}
        {ingestResult && (
          <div className="space-y-2 rounded-md border border-neutral-200 dark:border-neutral-700 p-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <Chip tone="green" label={`${ingestResult.created} created`} />
              <Chip tone="neutral" label={`${ingestResult.updated} updated`} />
              <Chip tone={ingestResult.errors ? "red" : "neutral"} label={`${ingestResult.errors} errors`} />
            </div>
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-neutral-700 dark:text-neutral-300">
              {JSON.stringify(ingestResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Cleanup */}
        {cleanupScript && (
          <div className="space-y-2 rounded-md border border-neutral-200 dark:border-neutral-700 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                Cleanup script ({createdNdcs.length} created record{createdNdcs.length === 1 ? "" : "s"})
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyScript}
                  className="cursor-pointer rounded-md border border-neutral-300 dark:border-neutral-600 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={cleanupNow}
                  disabled={cleaning}
                  className="cursor-pointer rounded-md border border-red-300 dark:border-red-700 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
                >
                  {cleaning ? "Cleaning…" : "Run cleanup now"}
                </button>
              </div>
            </div>
            <pre className="max-h-60 overflow-auto whitespace-pre rounded bg-neutral-100 dark:bg-neutral-950 p-3 font-mono text-xs text-neutral-700 dark:text-neutral-300">
              {cleanupScript}
            </pre>
          </div>
        )}

        {cleanupDone && (
          <div className="rounded-md border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            {cleanupDone}
          </div>
        )}
      </div>
    </div>
  );
}

function Chip({ tone, label }: { tone: "neutral" | "green" | "red" | "amber"; label: string }) {
  const cls = {
    neutral: "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300",
    green: "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300",
    red: "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300",
    amber: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300",
  }[tone];
  return <span className={`rounded px-2 py-0.5 font-medium ${cls}`}>{label}</span>;
}

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="text-xs">
      <p className="mb-1 font-medium text-neutral-600 dark:text-neutral-400">{title}</p>
      <div className="text-neutral-600 dark:text-neutral-400">{children}</div>
    </div>
  );
}
