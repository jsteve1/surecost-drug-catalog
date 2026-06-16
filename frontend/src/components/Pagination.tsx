"use client";

interface PaginationProps {
  page: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalCount,
  pageSize = 25,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Page {page} of {totalPages} ({totalCount} total)
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}
