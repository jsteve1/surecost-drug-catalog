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
    <div className="flex items-center justify-between border-t border-neutral-200 pt-3 dark:border-neutral-700">
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="cursor-pointer rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-700 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          of {totalCount}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="cursor-pointer rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="cursor-pointer rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}
