import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse, Partner } from "@/types";

interface PartnerFilters {
  page?: number;
  pageSize?: number;
  partnerType?: string;
  search?: string;
}

export function usePartners(filters: PartnerFilters = {}) {
  return useQuery({
    queryKey: ["partners", filters],
    queryFn: () =>
      api.get<PaginatedResponse<Partner>>("/admin/partners", filters as Record<string, unknown>),
  });
}

export function useCreatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/admin/partners", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function useUpdatePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.put(`/admin/partners/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partners"] }),
  });
}

export function useDeletePartner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/partners/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["partners"] }),
  });
}
