import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse, HealthRecord } from "@/types";

interface HealthFilters {
  page?: number;
  pageSize?: number;
  residentId?: number;
  search?: string;
}

export function useHealthRecords(filters: HealthFilters = {}) {
  return useQuery({
    queryKey: ["healthRecords", filters],
    queryFn: () =>
      api.get<PaginatedResponse<HealthRecord>>("/admin/health-records", filters as Record<string, unknown>),
  });
}

export function useCreateHealthRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/admin/health-records", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["healthRecords"] }),
  });
}

export function useUpdateHealthRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.put(`/admin/health-records/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["healthRecords"] }),
  });
}
