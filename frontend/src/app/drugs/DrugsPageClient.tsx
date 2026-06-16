"use client";

import { useState } from "react";

import { AppShell } from "@/components/AppShell";
import { ControlledSubstanceSummary } from "@/components/ControlledSubstanceSummary";
import { DrugFilters } from "@/components/DrugFilters";
import { DrugTable } from "@/components/DrugTable";
import { Pagination } from "@/components/Pagination";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useDrugs } from "@/lib/hooks/useDrugs";
import type { DrugQueryParams } from "@/types/drug";

const DEFAULT_PAGE_SIZE = 20;

export function DrugsPageClient() {
  const [filters, setFilters] = useState<DrugQueryParams>({
    page: 1,
    page_size: DEFAULT_PAGE_SIZE,
  });
  const debouncedSearch = useDebouncedValue(filters.search ?? "", 300);

  const query = useDrugs({ ...filters, search: debouncedSearch });

  const pageSize = filters.page_size ?? DEFAULT_PAGE_SIZE;

  return (
    <AppShell>
      <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 128px)" }}>
        <div className="shrink-0">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Drug Catalog</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Search and manage pharmacy inventory records.
          </p>
        </div>

        <div className="shrink-0">
          <ControlledSubstanceSummary filters={filters} onFilterChange={setFilters} />
        </div>

        <div className="shrink-0">
          <DrugFilters filters={filters} onChange={setFilters} />
        </div>

        {query.isError && (
          <div className="shrink-0 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {query.error instanceof Error ? query.error.message : "Failed to load drugs"}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <DrugTable drugs={query.data?.results ?? []} isLoading={query.isLoading} />
        </div>

        <div className="shrink-0">
          {query.data && (
            <Pagination
              page={filters.page ?? 1}
              totalCount={query.data.count}
              pageSize={pageSize}
              onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
              onPageSizeChange={(page_size) =>
                setFilters((f) => ({ ...f, page_size, page: 1 }))
              }
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}
