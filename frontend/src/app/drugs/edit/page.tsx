"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { AppShell } from "@/components/AppShell";
import { DrugForm } from "@/components/DrugForm";
import { useDrug, useUpdateDrug } from "@/lib/hooks/useDrugs";
import { toDrugInput, type DrugFormValues } from "@/lib/validations/drug";

function EditDrugContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const drugId = id ? Number(id) : NaN;
  const router = useRouter();
  const drugQuery = useDrug(drugId);
  const updateDrug = useUpdateDrug(drugId);

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
        <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
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
        <h1 className="text-2xl font-semibold text-slate-900">Edit Drug</h1>
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
      </div>
    </AppShell>
  );
}

export default function EditDrugPage() {
  return (
    <Suspense fallback={<AppShell><div className="h-40 animate-pulse rounded-lg bg-slate-100" /></AppShell>}>
      <EditDrugContent />
    </Suspense>
  );
}
