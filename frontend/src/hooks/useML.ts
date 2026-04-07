import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DonorChurnRisk, ReintegrationReadiness, SocialMediaRecommendation, InterventionEffectiveness } from "@/types";

export function useDonorChurnRisk() {
  return useQuery({
    queryKey: ["ml", "churn"],
    queryFn: () => api.get<DonorChurnRisk[]>("/ml/donor-churn-risk"),
  });
}

export function useReintegrationReadiness(residentId: number) {
  return useQuery({
    queryKey: ["ml", "reintegration", residentId],
    queryFn: () => api.get<ReintegrationReadiness>(`/ml/reintegration-readiness/${residentId}`),
    enabled: !!residentId,
  });
}

export function useSocialMediaRecommendations() {
  return useQuery({
    queryKey: ["ml", "social-recommendations"],
    queryFn: () => api.get<SocialMediaRecommendation>("/ml/social-media-recommendations"),
  });
}

export function useInterventionEffectiveness() {
  return useQuery({
    queryKey: ["ml", "intervention-effectiveness"],
    queryFn: () => api.get<InterventionEffectiveness[]>("/ml/intervention-effectiveness"),
  });
}
