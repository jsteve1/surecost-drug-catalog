"use client";

import { useRouter } from "next/navigation";

import { AppShell } from "@/components/AppShell";
import { DrugForm } from "@/components/DrugForm";
import { useCreateDrug } from "@/lib/hooks/useDrugs";
import { toDrugInput, type DrugFormValues } from "@/lib/validations/drug";

export default function NewDrugPage() {
  const router = useRouter();
  const createDrug = useCreateDrug();

  const handleSubmit = async (values: DrugFormValues) => {
    await createDrug.mutateAsync(toDrugInput(values));
    router.push("/drugs");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Add Drug</h1>
        <DrugForm submitLabel="Create drug" onSubmit={handleSubmit} />
      </div>
    </AppShell>
  );
}
