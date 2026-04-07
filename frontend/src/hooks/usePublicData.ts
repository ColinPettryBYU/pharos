import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PublicImpactSnapshot } from "@/types";

interface SafehouseSummary {
  totalSafehouses: number;
  totalResidents: number;
  totalDonations: number;
  regionsCount: number;
  avgEducationProgress: number;
  avgHealthScore: number;
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
