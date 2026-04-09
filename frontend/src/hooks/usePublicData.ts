import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PublicImpactSnapshot } from "@/types";

interface SafehouseSummary {
  total_safehouses: number;
  total_residents: number;
  total_donations: number;
  regions_count: number;
  avg_education_progress: number;
  avg_health_score: number;
  region_breakdown?: Record<string, number>;
}

export function usePublicSafehouses() {
  return useQuery({
    queryKey: ["public", "safehouses"],
    queryFn: () => api.get<SafehouseSummary>("/public/safehouses/summary"),
  });
}

export function usePublicImpactSnapshots() {
  return useQuery({
    queryKey: ["public", "impact"],
    queryFn: () => api.get<PublicImpactSnapshot[]>("/public/impact-snapshots"),
  });
}
