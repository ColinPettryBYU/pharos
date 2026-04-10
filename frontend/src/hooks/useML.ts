import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DonorChurnRisk, ReintegrationReadiness, SocialMediaRecommendation, InterventionEffectivenessResponse } from "@/types";

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
    queryFn: async (): Promise<SocialMediaRecommendation> => {
      const raw: any = await api.get("/ml/social-media-recommendations");
      const day = raw?.recommended_day_of_week ?? raw?.best_post_time?.day;
      const hour = raw?.recommended_post_hour ?? raw?.best_post_time?.hour;
      return {
        best_post_time: day != null && hour != null ? { day, hour } : undefined,
        recommended_content_type: raw?.recommended_post_type ?? raw?.recommended_content_type ?? undefined,
        predicted_engagement_rate: raw?.predicted_engagement_rate ?? 0,
        campaign_insights: raw?.insights?.map((i: any) => i.description) ?? raw?.campaign_insights ?? [],
      };
    },
  });
}

export function useInterventionEffectiveness() {
  return useQuery({
    queryKey: ["ml", "intervention-effectiveness"],
    queryFn: async (): Promise<InterventionEffectivenessResponse> => {
      const raw: any = await api.get("/ml/intervention-effectiveness");

      const byCategory: any[] = raw?.by_category ?? [];
      const insights: any[] = raw?.insights ?? [];
      const rawDrivers: any[] = raw?.key_drivers ?? [];

      const categories = byCategory.map((c: any) => ({
        plan_category: c.category ?? c.plan_category ?? "Unknown",
        effectiveness_score: (c.avg_outcome_improvement ?? c.effectiveness_score ?? 0) / 100,
        key_factors: [c.most_effective_service].filter(Boolean),
        recommendations: insights
          .filter((i: any) => i.intervention_type === c.category)
          .map((i: any) => i.description)
          .filter(Boolean),
      }));

      const key_drivers = rawDrivers.map((d: any) => ({
        driver_name: d.driver_name ?? d.driverName ?? "Unknown",
        effectiveness_score: (d.effectiveness_score ?? d.effectivenessScore ?? 0) / 100,
        outcomes_affected: d.outcomes_affected ?? d.outcomesAffected ?? 0,
        description: d.description ?? "",
      }));

      return { categories, key_drivers };
    },
  });
}
