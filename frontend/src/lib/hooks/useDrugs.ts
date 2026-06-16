"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { DrugInput, DrugQueryParams } from "@/types/drug";

export function useDrugs(params: DrugQueryParams) {
  return useQuery({
    queryKey: ["drugs", params],
    queryFn: () => api.getDrugs(params),
  });
}

export function useDrug(id: number) {
  return useQuery({
    queryKey: ["drug", id],
    queryFn: () => api.getDrug(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateDrug() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DrugInput) => api.createDrug(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drugs"] });
      queryClient.invalidateQueries({ queryKey: ["schedule-summary"] });
      queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}

export function useUpdateDrug(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<DrugInput>) => api.updateDrug(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drugs"] });
      queryClient.invalidateQueries({ queryKey: ["drug", id] });
      queryClient.invalidateQueries({ queryKey: ["schedule-summary"] });
      queryClient.invalidateQueries({ queryKey: ["audit"] });
      queryClient.invalidateQueries({ queryKey: ["drug-audit", id] });
    },
  });
}

export function useDeleteDrug() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteDrug(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drugs"] });
      queryClient.invalidateQueries({ queryKey: ["schedule-summary"] });
      queryClient.invalidateQueries({ queryKey: ["audit"] });
    },
  });
}
