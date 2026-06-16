"use client";

import { useState } from "react";

import { AppShell } from "@/components/AppShell";
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
      {/*
        Fixed-height column: heading + filters shrink, table grows and scrolls,
        pagination stays pinned at the bottom — no full-page scroll needed.
      */}
      <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 128px)" }}>
        {/* Heading */}
        <div className="shrink-0">
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Drug Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Search and manage pharmacy inventory records.
          </p>
        </div>

        {/* Filters */}
        <div className="shrink-0">
          <DrugFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Error banner */}
        {query.isError && (
          <div className="shrink-0 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {query.error instanceof Error ? query.error.message : "Failed to load drugs"}
          </div>
        )}

        {/* Scrollable table — grows to fill remaining space */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <DrugTable drugs={query.data?.results ?? []} isLoading={query.isLoading} />
        </div>

        {/* Pagination — always visible at the bottom */}
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
