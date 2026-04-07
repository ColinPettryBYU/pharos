import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse, EducationRecord } from "@/types";

interface EducationFilters {
  page?: number;
  pageSize?: number;
  residentId?: number;
  search?: string;
}

export function useEducationRecords(filters: EducationFilters = {}) {
  return useQuery({
    queryKey: ["educationRecords", filters],
    queryFn: () =>
      api.get<PaginatedResponse<EducationRecord>>("/admin/education-records", filters as Record<string, unknown>),
  });
}

export function useCreateEducationRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/admin/education-records", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["educationRecords"] }),
  });
}

export function useUpdateEducationRecord() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.put(`/admin/education-records/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["educationRecords"] }),
  });
}
