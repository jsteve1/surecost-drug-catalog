"use client";

import {
  DEA_SCHEDULE_OPTIONS,
  DOSAGE_FORMS,
  type DrugQueryParams,
} from "@/types/drug";

interface DrugFiltersProps {
  filters: DrugQueryParams;
  onChange: (filters: DrugQueryParams) => void;
}

const inputCls =
  "rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100";

export function DrugFilters({ filters, onChange }: DrugFiltersProps) {
  const update = (patch: Partial<DrugQueryParams>) => {
    onChange({ ...filters, ...patch, page: 1 });
  };

  return (
    <div className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-4 dark:border-neutral-700 dark:bg-neutral-900">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">Search</span>
        <input
          type="search"
          value={filters.search ?? ""}
          onChange={(event) => update({ search: event.target.value })}
          placeholder="Drug name..."
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">Manufacturer</span>
        <input
          type="text"
          value={filters.manufacturer ?? ""}
          onChange={(event) => update({ manufacturer: event.target.value })}
          placeholder="Manufacturer..."
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">Dosage form</span>
        <select
          value={filters.dosage_form ?? ""}
          onChange={(event) => update({ dosage_form: event.target.value })}
          className={`${inputCls} cursor-pointer`}
        >
          <option value="">All forms</option>
          {DOSAGE_FORMS.map((form) => (
            <option key={form} value={form}>
              {form}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-neutral-700 dark:text-neutral-300">DEA schedule</span>
        <select
          value={filters.dea_schedule ?? ""}
          onChange={(event) => update({ dea_schedule: event.target.value })}
          className={`${inputCls} cursor-pointer`}
        >
          {DEA_SCHEDULE_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
