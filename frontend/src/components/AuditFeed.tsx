"use client";

import type { AuditLogEntry } from "@/types/audit";

function formatChangeValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatChanges(changes: AuditLogEntry["changes"]): string[] {
  return Object.entries(changes).map(([field, change]) => {
    if (
      change &&
      typeof change === "object" &&
      "before" in change &&
      "after" in change
    ) {
      const c = change as { before: unknown; after: unknown };
      return `${field}: ${formatChangeValue(c.before)} → ${formatChangeValue(c.after)}`;
    }
    return `${field}: ${formatChangeValue(change)}`;
  });
}

interface AuditFeedProps {
  entries: AuditLogEntry[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function AuditFeed({ entries, isLoading, emptyMessage = "No audit entries yet." }: AuditFeedProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-300 p-8 text-center text-neutral-500 dark:border-neutral-600">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900"
        >
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                entry.action === "CREATE"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                  : entry.action === "DELETE"
                    ? "bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
              }`}
            >
              {entry.action}
            </span>
            <span className="font-medium text-neutral-900 dark:text-neutral-100">
              {entry.drug_name}
            </span>
            <span className="font-mono text-xs text-neutral-500">{entry.drug_ndc}</span>
            <span className="text-neutral-400">·</span>
            <time className="text-neutral-500 dark:text-neutral-400">
              {new Date(entry.timestamp).toLocaleString()}
            </time>
            <span className="text-neutral-400">·</span>
            <span className="text-neutral-500">{entry.actor}</span>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-400">
            {formatChanges(entry.changes).map((line) => (
              <li key={line} className="font-mono text-xs">
                {line}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
