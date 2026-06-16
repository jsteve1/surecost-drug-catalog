export type DeaSchedule = "II" | "III" | "IV" | "V" | null;

export interface Drug {
  id: number;
  ndc: string;
  drug_name: string;
  manufacturer: string;
  dosage_form: string;
  strength: string;
  package_size: number;
  unit_price: string;
  dea_schedule: DeaSchedule;
}

export interface DrugInput {
  ndc: string;
  drug_name: string;
  manufacturer: string;
  dosage_form: string;
  strength: string;
  package_size: number;
  unit_price: number;
  dea_schedule: DeaSchedule;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface DrugQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  manufacturer?: string;
  dosage_form?: string;
  dea_schedule?: string;
  min_price?: string;
  max_price?: string;
}

export const DOSAGE_FORMS = [
  "TABLET",
  "CAPSULE",
  "INJECTABLE",
  "SOLUTION",
  "SUSPENSION",
  "FILM",
  "INHALATION",
] as const;

export const DEA_SCHEDULE_OPTIONS = [
  { label: "All schedules", value: "" },
  { label: "Non-controlled", value: "__none__" },
  { label: "Schedule II", value: "II" },
  { label: "Schedule III", value: "III" },
  { label: "Schedule IV", value: "IV" },
  { label: "Schedule V", value: "V" },
] as const;

export function extendedCost(drug: Drug): number {
  return Number(drug.unit_price) * drug.package_size;
}

export function formatCurrency(value: number | string): string {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}
