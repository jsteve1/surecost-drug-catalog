"use client";

import { useState } from "react";

import { ApiError } from "@/lib/api";
import { useDeleteDrug } from "@/lib/hooks/useDrugs";
import type { Drug } from "@/types/drug";

interface DeleteDrugDialogProps {
  drug: Drug;
  onClose: () => void;
}

export function DeleteDrugDialog({ drug, onClose }: DeleteDrugDialogProps) {
  const deleteDrug = useDeleteDrug();
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    try {
      await deleteDrug.mutateAsync(drug.id);
      onClose();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to delete drug";
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-slate-900">Delete drug?</h2>
        <p className="mt-2 text-sm text-slate-600">
          This will permanently remove{" "}
          <span className="font-medium">{drug.drug_name}</span> (
          <span className="font-mono">{drug.ndc}</span>).
        </p>
        {error && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleteDrug.isPending}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleteDrug.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
