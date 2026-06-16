"use client";

import { AppShell } from "@/components/AppShell";
import { AuditFeed } from "@/components/AuditFeed";
import { Pagination } from "@/components/Pagination";
import { useAudit } from "@/lib/hooks/useAudit";
import { useState } from "react";

const PAGE_SIZE = 25;

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const auditQuery = useAudit({ page, page_size: PAGE_SIZE });

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Audit Log
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Immutable change history for all drug create, update, and delete operations.
          </p>
        </div>

        {auditQuery.isError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {auditQuery.error instanceof Error
              ? auditQuery.error.message
              : "Failed to load audit log"}
          </div>
        )}

        <AuditFeed
          entries={auditQuery.data?.results ?? []}
          isLoading={auditQuery.isLoading}
        />

        {auditQuery.data && auditQuery.data.count > PAGE_SIZE && (
          <Pagination
            page={page}
            totalCount={auditQuery.data.count}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            onPageSizeChange={() => {}}
          />
        )}
      </div>
    </AppShell>
  );
}
