import { z } from "zod";

const ndcRegex = /^\d{5}-\d{4}-\d{2}$/;

export const drugSchema = z.object({
  ndc: z
    .string()
    .min(1, "NDC is required")
    .regex(ndcRegex, "NDC must match format #####-####-##"),
  drug_name: z.string().min(1, "Drug name is required"),
  manufacturer: z.string().min(1, "Manufacturer is required"),
  dosage_form: z.string().min(1, "Dosage form is required"),
  strength: z.string().min(1, "Strength is required"),
  package_size: z
    .number({ error: "Package size must be a number" })
    .int("Package size must be a whole number")
    .min(1, "Package size must be at least 1"),
  unit_price: z
    .number({ error: "Unit price must be a number" })
    .min(0, "Unit price must be non-negative"),
  dea_schedule: z.union([z.enum(["II", "III", "IV", "V"]), z.literal("")]).optional(),
});

export type DrugFormValues = z.infer<typeof drugSchema>;

export function toDrugInput(values: DrugFormValues) {
  return {
    ...values,
    dea_schedule:
      values.dea_schedule === "" || values.dea_schedule === undefined
        ? null
        : values.dea_schedule,
  };
}
