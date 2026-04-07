import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse, HomeVisitation } from "@/types";

interface VisitationFilters {
  page?: number;
  pageSize?: number;
  residentId?: number;
  visitType?: string;
  search?: string;
}

export function useHomeVisitations(filters: VisitationFilters = {}) {
  return useQuery({
    queryKey: ["homeVisitations", filters],
    queryFn: () =>
      api.get<PaginatedResponse<HomeVisitation>>("/admin/home-visitations", filters as Record<string, unknown>),
  });
}

export function useCreateHomeVisitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/admin/home-visitations", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["homeVisitations"] });
      qc.invalidateQueries({ queryKey: ["residents"] });
    },
  });
}

export function useUpdateHomeVisitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.put(`/admin/home-visitations/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["homeVisitations"] }),
  });
}
