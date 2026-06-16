"use client";

import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { DrugFilters } from "@/components/DrugFilters";
import { DrugTable } from "@/components/DrugTable";
import { Pagination } from "@/components/Pagination";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useDrugs } from "@/lib/hooks/useDrugs";
import type { DrugQueryParams } from "@/types/drug";

export function DrugsPageClient() {
  const [filters, setFilters] = useState<DrugQueryParams>({ page: 1 });
  const debouncedSearch = useDebouncedValue(filters.search ?? "", 300);

  const query = useDrugs({
    ...filters,
    search: debouncedSearch,
  });

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Drug Catalog</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Search and manage pharmacy inventory records.
            </p>
          </div>
        </div>

        <DrugFilters filters={filters} onChange={setFilters} />

        {query.isError && (
          <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {query.error instanceof Error
              ? query.error.message
              : "Failed to load drugs"}
          </div>
        )}

        <DrugTable drugs={query.data?.results ?? []} isLoading={query.isLoading} />

        {query.data && (
          <Pagination
            page={filters.page ?? 1}
            totalCount={query.data.count}
            onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
          />
        )}
      </div>
    </AppShell>
  );
}
