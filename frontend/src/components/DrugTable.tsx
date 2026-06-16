"use client";

import Link from "next/link";
import { useState } from "react";

import { DeleteDrugDialog } from "@/components/DeleteDrugDialog";
import {
  extendedCost,
  formatCurrency,
  type Drug,
} from "@/types/drug";

interface DrugTableProps {
  drugs: Drug[];
  isLoading?: boolean;
}

function DeaBadge({ schedule }: { schedule: Drug["dea_schedule"] }) {
  if (!schedule) {
    return (
      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-400">
        Non-controlled
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
      C-{schedule}
    </span>
  );
}

export function DrugTable({ drugs, isLoading }: DrugTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Drug | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-10 animate-pulse rounded bg-slate-100 dark:bg-slate-800"
          />
        ))}
      </div>
    );
  }

  if (drugs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-10 text-center">
        <p className="text-lg font-medium text-slate-800 dark:text-slate-200">No drugs found</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              {[
                "NDC",
                "Drug Name",
                "Manufacturer",
                "Form",
                "Strength",
                "Pkg Size",
                "Unit Price",
                "Extended Cost",
                "DEA",
                "Actions",
              ].map((header) => (
                <th
                  key={header}
                  className="px-3 py-3 text-left font-semibold text-slate-700 dark:text-slate-300"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {drugs.map((drug) => (
              <tr key={drug.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-3 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">{drug.ndc}</td>
                <td className="px-3 py-3 font-medium">{drug.drug_name}</td>
                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{drug.manufacturer}</td>
                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{drug.dosage_form}</td>
                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{drug.strength}</td>
                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{drug.package_size}</td>
                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{formatCurrency(drug.unit_price)}</td>
                <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                  {formatCurrency(extendedCost(drug))}
                </td>
                <td className="px-3 py-3">
                  <DeaBadge schedule={drug.dea_schedule} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/drugs/edit?id=${drug.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(drug)}
                      className="text-red-600 dark:text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <DeleteDrugDialog
          drug={deleteTarget}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
