"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { AuditQueryParams } from "@/types/audit";

export function useAudit(params: AuditQueryParams = {}) {
  return useQuery({
    queryKey: ["audit", params],
    queryFn: () => api.getAudit(params),
  });
}

export function useDrugAudit(drugId: number, params: AuditQueryParams = {}) {
  return useQuery({
    queryKey: ["drug-audit", drugId, params],
    queryFn: () => api.getDrugAudit(drugId, params),
    enabled: Number.isFinite(drugId),
  });
}
