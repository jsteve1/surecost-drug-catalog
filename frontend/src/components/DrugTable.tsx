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
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
        Non-controlled
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
      C-{schedule}
    </span>
  );
}

export function DrugTable({ drugs, isLoading }: DrugTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Drug | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-10 animate-pulse rounded bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (drugs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-lg font-medium text-slate-800">No drugs found</p>
        <p className="mt-1 text-sm text-slate-500">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
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
                  className="px-3 py-3 text-left font-semibold text-slate-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {drugs.map((drug) => (
              <tr key={drug.id} className="hover:bg-slate-50">
                <td className="px-3 py-3 font-mono text-xs">{drug.ndc}</td>
                <td className="px-3 py-3 font-medium">{drug.drug_name}</td>
                <td className="px-3 py-3">{drug.manufacturer}</td>
                <td className="px-3 py-3">{drug.dosage_form}</td>
                <td className="px-3 py-3">{drug.strength}</td>
                <td className="px-3 py-3">{drug.package_size}</td>
                <td className="px-3 py-3">{formatCurrency(drug.unit_price)}</td>
                <td className="px-3 py-3">
                  {formatCurrency(extendedCost(drug))}
                </td>
                <td className="px-3 py-3">
                  <DeaBadge schedule={drug.dea_schedule} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/drugs/edit?id=${drug.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(drug)}
                      className="text-red-600 hover:underline"
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
