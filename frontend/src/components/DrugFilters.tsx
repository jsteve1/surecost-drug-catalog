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

export function DrugFilters({ filters, onChange }: DrugFiltersProps) {
  const update = (patch: Partial<DrugQueryParams>) => {
    onChange({ ...filters, ...patch, page: 1 });
  };

  return (
    <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-2 lg:grid-cols-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Search</span>
        <input
          type="search"
          value={filters.search ?? ""}
          onChange={(event) => update({ search: event.target.value })}
          placeholder="Drug name..."
          className="rounded-md border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Manufacturer</span>
        <input
          type="text"
          value={filters.manufacturer ?? ""}
          onChange={(event) => update({ manufacturer: event.target.value })}
          placeholder="Exact manufacturer"
          className="rounded-md border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Dosage form</span>
        <select
          value={filters.dosage_form ?? ""}
          onChange={(event) => update({ dosage_form: event.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
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
        <span className="font-medium text-slate-700">DEA schedule</span>
        <select
          value={filters.dea_schedule ?? ""}
          onChange={(event) => update({ dea_schedule: event.target.value })}
          className="rounded-md border border-slate-300 px-3 py-2"
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
