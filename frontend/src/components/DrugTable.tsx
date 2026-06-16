"use client";

import Link from "next/link";
import { useState } from "react";

import { DeaScheduleBadge } from "@/components/DeaScheduleBadge";
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

export function DrugTable({ drugs, isLoading }: DrugTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Drug | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-10 animate-pulse rounded bg-neutral-100 dark:bg-neutral-800"
          />
        ))}
      </div>
    );
  }

  if (drugs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 p-10 text-center">
        <p className="text-lg font-medium text-neutral-800 dark:text-neutral-200">No drugs found</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-sm">
          <thead className="bg-neutral-50 dark:bg-neutral-800">
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
                  className="px-3 py-3 text-left font-semibold text-neutral-700 dark:text-neutral-300"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {drugs.map((drug) => (
              <tr key={drug.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                <td className="px-3 py-3 font-mono text-xs text-neutral-700 dark:text-neutral-300">{drug.ndc}</td>
                <td className="px-3 py-3 font-medium">{drug.drug_name}</td>
                <td className="px-3 py-3 text-neutral-700 dark:text-neutral-300">{drug.manufacturer}</td>
                <td className="px-3 py-3 text-neutral-700 dark:text-neutral-300">{drug.dosage_form}</td>
                <td className="px-3 py-3 text-neutral-700 dark:text-neutral-300">{drug.strength}</td>
                <td className="px-3 py-3 text-neutral-700 dark:text-neutral-300">{drug.package_size}</td>
                <td className="px-3 py-3 text-neutral-700 dark:text-neutral-300">{formatCurrency(drug.unit_price)}</td>
                <td className="px-3 py-3 text-neutral-700 dark:text-neutral-300">
                  {formatCurrency(extendedCost(drug))}
                </td>
                <td className="whitespace-nowrap px-3 py-3">
                  <DeaScheduleBadge schedule={drug.dea_schedule} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/drugs/edit?id=${drug.id}`}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
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
