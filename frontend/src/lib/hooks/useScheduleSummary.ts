"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export function useScheduleSummary() {
  return useQuery({
    queryKey: ["schedule-summary"],
    queryFn: () => api.getScheduleSummary(),
    staleTime: 60_000,
  });
}
