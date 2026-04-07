import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse, IncidentReport } from "@/types";

interface IncidentFilters {
  page?: number;
  pageSize?: number;
  residentId?: number;
  severity?: string;
  search?: string;
}

export function useIncidentReports(filters: IncidentFilters = {}) {
  return useQuery({
    queryKey: ["incidentReports", filters],
    queryFn: () =>
      api.get<PaginatedResponse<IncidentReport>>("/admin/incident-reports", filters as Record<string, unknown>),
  });
}

export function useCreateIncidentReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/admin/incident-reports", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidentReports"] }),
  });
}

export function useUpdateIncidentReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.put(`/admin/incident-reports/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidentReports"] }),
  });
}

export function useDeleteIncidentReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/incident-reports/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["incidentReports"] }),
  });
}
