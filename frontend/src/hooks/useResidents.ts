import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse, Resident, ProcessRecording, HomeVisitation, EducationRecord, HealthRecord, InterventionPlan, IncidentReport, CaseConferenceSummary } from "@/types";

interface ResidentFilters {
  page?: number;
  pageSize?: number;
  caseStatus?: string;
  riskLevel?: string;
  safehouseId?: number;
  search?: string;
}

export function useResidents(filters: ResidentFilters = {}) {
  return useQuery({
    queryKey: ["residents", filters],
    queryFn: () =>
      api.get<PaginatedResponse<Resident>>("/admin/residents", filters as Record<string, unknown>),
  });
}

export function useResident(id: number) {
  return useQuery({
    queryKey: ["residents", id],
    queryFn: () => api.get<Resident>(`/admin/residents/${id}`),
    enabled: !!id,
  });
}

export function useResidentRecordings(id: number) {
  return useQuery({
    queryKey: ["residents", id, "recordings"],
    queryFn: () => api.get<ProcessRecording[]>(`/admin/residents/${id}/process-recordings`),
    enabled: !!id,
  });
}

export function useResidentVisitations(id: number) {
  return useQuery({
    queryKey: ["residents", id, "visitations"],
    queryFn: () => api.get<HomeVisitation[]>(`/admin/residents/${id}/home-visitations`),
    enabled: !!id,
  });
}

export function useResidentEducation(id: number) {
  return useQuery({
    queryKey: ["educationRecords", { residentId: id }],
    queryFn: () => api.get<EducationRecord[]>("/admin/education-records", { residentId: id }),
    enabled: !!id,
  });
}

export function useResidentHealth(id: number) {
  return useQuery({
    queryKey: ["healthRecords", { residentId: id }],
    queryFn: () => api.get<HealthRecord[]>("/admin/health-records", { residentId: id }),
    enabled: !!id,
  });
}

export function useResidentInterventions(id: number) {
  return useQuery({
    queryKey: ["interventionPlans", { residentId: id }],
    queryFn: () => api.get<InterventionPlan[]>("/admin/intervention-plans", { residentId: id }),
    enabled: !!id,
  });
}

export function useResidentIncidents(id: number) {
  return useQuery({
    queryKey: ["incidentReports", { residentId: id }],
    queryFn: () => api.get<IncidentReport[]>("/admin/incident-reports", { residentId: id }),
    enabled: !!id,
  });
}

export function useResidentSummary(id: number) {
  return useQuery({
    queryKey: ["residents", id, "summary"],
    queryFn: () => api.get<CaseConferenceSummary>(`/admin/residents/${id}/summary`),
    enabled: !!id,
  });
}

export interface ResidentRiskPrediction {
  resident_id: number;
  internal_code?: string;
  risk_score: number;
  risk_flag: boolean;
  risk_level: string;
  top_factors: { feature: string; direction: string }[];
  last_updated: string;
}

export function useResidentRisk(id: number) {
  return useQuery({
    queryKey: ["residentRisk", id],
    queryFn: () => api.get<ResidentRiskPrediction>(`/ml/resident-risk/${id}`),
    enabled: !!id,
    retry: false,
  });
}

export function useCreateResident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/admin/residents", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["residents"] }),
  });
}

export function useUpdateResident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.put(`/admin/residents/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["residents"] }),
  });
}

export function useDeleteResident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/residents/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["residents"] }),
  });
}
