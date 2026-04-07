import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Safehouse } from "@/types";

export function useSafehouses() {
  return useQuery({
    queryKey: ["safehouses"],
    queryFn: () => api.get<Safehouse[]>("/admin/safehouses"),
  });
}

export function useSafehouse(id: number) {
  return useQuery({
    queryKey: ["safehouses", id],
    queryFn: () => api.get<Safehouse>(`/admin/safehouses/${id}`),
    enabled: !!id,
  });
}

export function useCreateSafehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/admin/safehouses", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["safehouses"] }),
  });
}

export function useUpdateSafehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.put(`/admin/safehouses/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["safehouses"] }),
  });
}

export function useDeleteSafehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/safehouses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["safehouses"] }),
  });
}
