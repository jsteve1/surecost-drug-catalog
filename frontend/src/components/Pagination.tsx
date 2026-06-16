"use client";

const PAGE_SIZE_OPTIONS = [10, 20, 30, 50] as const;

interface PaginationProps {
  page: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  page,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 text-sm"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          of {totalCount}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-600 dark:text-slate-400">
          Page {page} of {totalPages}
        </span>
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
