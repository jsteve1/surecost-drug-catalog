"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { ApiError } from "@/lib/api";
import { drugSchema, type DrugFormValues } from "@/lib/validations/drug";
import { DOSAGE_FORMS } from "@/types/drug";

interface DrugFormProps {
  defaultValues?: Partial<DrugFormValues>;
  ndcReadOnly?: boolean;
  submitLabel: string;
  onSubmit: (values: DrugFormValues) => Promise<void>;
}

const inputClassName =
  "w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 px-3 py-2 text-sm";

export function DrugForm({
  defaultValues,
  ndcReadOnly = false,
  submitLabel,
  onSubmit,
}: DrugFormProps) {
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DrugFormValues>({
    resolver: zodResolver(drugSchema),
    defaultValues: {
      ndc: "",
      drug_name: "",
      manufacturer: "",
      dosage_form: "TABLET",
      strength: "",
      package_size: 1,
      unit_price: 0,
      dea_schedule: "",
      ...defaultValues,
    },
  });

  const submit = handleSubmit(async (values) => {
    setGlobalError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      if (error instanceof ApiError) {
        Object.entries(error.fieldErrors).forEach(([field, messages]) => {
          if (messages[0]) {
            setError(field as keyof DrugFormValues, { message: messages[0] });
          }
        });
        if (!Object.keys(error.fieldErrors).length) {
          setGlobalError(error.message);
        }
        return;
      }
      setGlobalError(error instanceof Error ? error.message : "Save failed");
    }
  });

  return (
    <form
      onSubmit={submit}
      className="space-y-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6"
    >
      {globalError && (
        <p className="rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-400">
          {globalError}
        </p>
      )}

      <Field label="NDC" error={errors.ndc?.message}>
        <input
          {...register("ndc")}
          readOnly={ndcReadOnly}
          className={`${inputClassName} font-mono disabled:bg-slate-100 dark:disabled:bg-slate-700`}
        />
      </Field>

      <Field label="Drug name" error={errors.drug_name?.message}>
        <input {...register("drug_name")} className={inputClassName} />
      </Field>

      <Field label="Manufacturer" error={errors.manufacturer?.message}>
        <input {...register("manufacturer")} className={inputClassName} />
      </Field>

      <Field label="Dosage form" error={errors.dosage_form?.message}>
        <select {...register("dosage_form")} className={inputClassName}>
          {DOSAGE_FORMS.map((form) => (
            <option key={form} value={form}>
              {form}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Strength" error={errors.strength?.message}>
        <input {...register("strength")} className={inputClassName} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Package size" error={errors.package_size?.message}>
          <input
            type="number"
            min={1}
            {...register("package_size", { valueAsNumber: true })}
            className={inputClassName}
          />
        </Field>
        <Field label="Unit price (USD)" error={errors.unit_price?.message}>
          <input
            type="number"
            min={0}
            step="0.01"
            {...register("unit_price", { valueAsNumber: true })}
            className={inputClassName}
          />
        </Field>
      </div>

      <Field label="DEA schedule" error={errors.dea_schedule?.message}>
        <select {...register("dea_schedule")} className={inputClassName}>
          <option value="">Non-controlled</option>
          <option value="II">Schedule II</option>
          <option value="III">Schedule III</option>
          <option value="IV">Schedule IV</option>
          <option value="V">Schedule V</option>
        </select>
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {children}
      {error && (
        <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{error}</span>
      )}
    </label>
  );
}
