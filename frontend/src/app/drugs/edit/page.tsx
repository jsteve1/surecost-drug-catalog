"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AppShell } from "@/components/AppShell";
import { AuditFeed } from "@/components/AuditFeed";
import { DrugForm } from "@/components/DrugForm";
import { useDrugAudit } from "@/lib/hooks/useAudit";
import { useDrug, useUpdateDrug } from "@/lib/hooks/useDrugs";
import { toDrugInput, type DrugFormValues } from "@/lib/validations/drug";

type EditTab = "edit" | "history";

function EditDrugContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const drugId = id ? Number(id) : NaN;
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<EditTab>("edit");
  const drugQuery = useDrug(drugId);
  const updateDrug = useUpdateDrug(drugId);
  const auditQuery = useDrugAudit(drugId, { page_size: 50 });

  if (!id || isNaN(drugId)) {
    return (
      <AppShell>
        <p className="text-red-600">Missing drug ID.</p>
      </AppShell>
    );
  }

  const handleSubmit = async (values: DrugFormValues) => {
    const { ndc, ...rest } = toDrugInput(values);
    void ndc;
    await updateDrug.mutateAsync(rest);
    router.push("/drugs");
  };

  if (drugQuery.isLoading) {
    return (
      <AppShell>
        <div className="h-40 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
      </AppShell>
    );
  }

  if (drugQuery.isError || !drugQuery.data) {
    return (
      <AppShell>
        <p className="text-red-600">Unable to load drug for editing.</p>
      </AppShell>
    );
  }

  const drug = drugQuery.data;

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Edit Drug
        </h1>

        {drug.dea_schedule === "II" && (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            <p className="font-semibold">Schedule II controlled substance</p>
            <p className="mt-1">
              Changes to this record are audited. Deletion requires typing CONFIRM.
            </p>
          </div>
        )}

        <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`cursor-pointer border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === "edit"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`cursor-pointer border-b-2 px-4 py-2 text-sm font-medium ${
              activeTab === "history"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            History
          </button>
        </div>

        {activeTab === "edit" ? (
          <DrugForm
            ndcReadOnly
            submitLabel="Save changes"
            defaultValues={{
              ndc: drug.ndc,
              drug_name: drug.drug_name,
              manufacturer: drug.manufacturer,
              dosage_form: drug.dosage_form,
              strength: drug.strength,
              package_size: drug.package_size,
              unit_price: Number(drug.unit_price),
              dea_schedule: drug.dea_schedule ?? "",
            }}
            onSubmit={handleSubmit}
          />
        ) : (
          <div className="space-y-3">
            {auditQuery.isError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
                {auditQuery.error instanceof Error
                  ? auditQuery.error.message
                  : "Failed to load audit history"}
              </p>
            )}
            <AuditFeed
              entries={auditQuery.data?.results ?? []}
              isLoading={auditQuery.isLoading}
              emptyMessage="No changes recorded for this drug yet."
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function EditDrugPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="h-40 animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
        </AppShell>
      }
    >
      <EditDrugContent />
    </Suspense>
  );
}
