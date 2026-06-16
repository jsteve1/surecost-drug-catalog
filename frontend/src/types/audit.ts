import type { PaginatedResponse } from "@/types/drug";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export interface FieldChange {
  before: unknown;
  after: unknown;
}

export interface AuditLogEntry {
  id: number;
  drug: number | null;
  drug_ndc: string;
  drug_name: string;
  action: AuditAction;
  actor: string;
  timestamp: string;
  changes: Record<string, FieldChange | unknown>;
}

export type AuditListResponse = PaginatedResponse<AuditLogEntry>;

export interface AuditQueryParams {
  page?: number;
  page_size?: number;
}
