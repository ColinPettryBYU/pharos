import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse, ProcessRecording } from "@/types";

interface RecordingFilters {
  page?: number;
  pageSize?: number;
  residentId?: number;
  sessionType?: string;
  search?: string;
}

export function useProcessRecordings(filters: RecordingFilters = {}) {
  return useQuery({
    queryKey: ["processRecordings", filters],
    queryFn: () =>
      api.get<PaginatedResponse<ProcessRecording>>("/admin/process-recordings", filters as Record<string, unknown>),
  });
}

export function useProcessRecording(id: number) {
  return useQuery({
    queryKey: ["processRecordings", id],
    queryFn: () => api.get<ProcessRecording>(`/admin/process-recordings/${id}`),
    enabled: !!id,
  });
}

export function useCreateProcessRecording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/admin/process-recordings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["processRecordings"] });
      qc.invalidateQueries({ queryKey: ["residents"] });
    },
  });
}

export function useUpdateProcessRecording() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.put(`/admin/process-recordings/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["processRecordings"] }),
  });
}
