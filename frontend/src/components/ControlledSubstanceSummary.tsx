"use client";

import { DeaScheduleBadge } from "@/components/DeaScheduleBadge";
import { useScheduleSummary } from "@/lib/hooks/useScheduleSummary";
import type { DrugQueryParams } from "@/types/drug";

interface ControlledSubstanceSummaryProps {
  filters: DrugQueryParams;
  onFilterChange: (filters: DrugQueryParams) => void;
}

const SCHEDULE_KEYS = [
  { key: "II" as const, filter: "II" },
  { key: "III" as const, filter: "III" },
  { key: "IV" as const, filter: "IV" },
  { key: "V" as const, filter: "V" },
  { key: "non_controlled" as const, filter: "__none__" },
] as const;

export function ControlledSubstanceSummary({
  filters,
  onFilterChange,
}: ControlledSubstanceSummaryProps) {
  const summaryQuery = useScheduleSummary();

  if (summaryQuery.isLoading) {
    return (
      <div className="h-16 animate-pulse rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900" />
    );
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return null;
  }

  const data = summaryQuery.data;
  const activeFilter = filters.dea_schedule ?? "";

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
        Controlled substance summary
      </h2>
      <div className="flex flex-wrap gap-2">
        {SCHEDULE_KEYS.map(({ key, filter }) => {
          const count = data[key];
          const isActive = activeFilter === filter;
          return (
            <button
              key={key}
              type="button"
              onClick={() =>
                onFilterChange({
                  ...filters,
                  dea_schedule: isActive ? "" : filter,
                  page: 1,
                })
              }
              className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                isActive
                  ? "border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40"
                  : "border-neutral-200 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800 dark:hover:bg-neutral-700"
              }`}
            >
              {key === "non_controlled" ? (
                <DeaScheduleBadge schedule={null} />
              ) : (
                <DeaScheduleBadge schedule={key} />
              )}
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
