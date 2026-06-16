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
  const [confirmText, setConfirmText] = useState("");
  const isScheduleII = drug.dea_schedule === "II";
  const canDelete = !isScheduleII || confirmText === "CONFIRM";

  const handleConfirm = async () => {
    if (!canDelete) return;
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
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900"
      >
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Delete drug?
        </h2>
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          This will permanently remove{" "}
          <span className="font-medium">{drug.drug_name}</span> (
          <span className="font-mono">{drug.ndc}</span>).
        </p>
        {isScheduleII && (
          <div className="mt-4 rounded-md border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40">
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Schedule II controlled substance
            </p>
            <p className="mt-1 text-sm text-red-700 dark:text-red-400">
              Type <span className="font-mono font-semibold">CONFIRM</span> to
              proceed with deletion.
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="mt-2 w-full rounded-md border border-red-300 bg-white px-3 py-2 text-sm dark:border-red-700 dark:bg-neutral-950"
              placeholder="CONFIRM"
              autoComplete="off"
            />
          </div>
        )}
        {error && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleteDrug.isPending || !canDelete}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleteDrug.isPending ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
