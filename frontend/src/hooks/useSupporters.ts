import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse, Supporter } from "@/types";

interface SupporterFilters {
  page?: number;
  pageSize?: number;
  supporterType?: string;
  status?: string;
  search?: string;
}

export function useSupporters(filters: SupporterFilters = {}) {
  return useQuery({
    queryKey: ["supporters", filters],
    queryFn: () =>
      api.get<PaginatedResponse<Supporter>>("/admin/supporters", filters as Record<string, unknown>),
  });
}

export function useSupporter(id: number) {
  return useQuery({
    queryKey: ["supporters", id],
    queryFn: () => api.get<Supporter>(`/admin/supporters/${id}`),
    enabled: !!id,
  });
}

export function useSupporterDonations(id: number) {
  return useQuery({
    queryKey: ["supporters", id, "donations"],
    queryFn: () => api.get<unknown>(`/admin/supporters/${id}`),
    enabled: !!id,
  });
}

export function useCreateSupporter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/admin/supporters", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supporters"] }),
  });
}

export function useUpdateSupporter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.put(`/admin/supporters/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supporters"] }),
  });
}

export function useDeleteSupporter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/supporters/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["supporters"] }),
  });
}
