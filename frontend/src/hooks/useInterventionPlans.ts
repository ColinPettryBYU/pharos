import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse, InterventionPlan } from "@/types";

interface InterventionFilters {
  page?: number;
  pageSize?: number;
  residentId?: number;
  status?: string;
  search?: string;
}

export function useInterventionPlans(filters: InterventionFilters = {}) {
  return useQuery({
    queryKey: ["interventionPlans", filters],
    queryFn: () =>
      api.get<PaginatedResponse<InterventionPlan>>("/admin/intervention-plans", filters as Record<string, unknown>),
  });
}

export function useCreateInterventionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/admin/intervention-plans", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["interventionPlans"] }),
  });
}

export function useUpdateInterventionPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.put(`/admin/intervention-plans/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["interventionPlans"] }),
  });
}
