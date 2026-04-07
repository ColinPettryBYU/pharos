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
    queryFn: async (): Promise<SocialMediaRecommendation> => {
      const raw: any = await api.get("/ml/social-media-recommendations");
      return {
        best_post_time: {
          day: raw?.recommended_day_of_week ?? raw?.best_post_time?.day ?? "Tuesday",
          hour: raw?.recommended_post_hour ?? raw?.best_post_time?.hour ?? 10,
        },
        recommended_content_type: raw?.recommended_post_type ?? raw?.recommended_content_type ?? "ImpactStory",
        predicted_engagement_rate: raw?.predicted_engagement_rate ?? 0,
        campaign_insights: raw?.insights?.map((i: any) => i.description) ?? raw?.campaign_insights ?? [],
      };
    },
  });
}

export function useInterventionEffectiveness() {
  return useQuery({
    queryKey: ["ml", "intervention-effectiveness"],
    queryFn: async (): Promise<InterventionEffectiveness[]> => {
      const raw: any = await api.get("/ml/intervention-effectiveness");

      const byCategory: any[] = raw?.by_category ?? [];
      const insights: any[] = raw?.insights ?? [];

      if (byCategory.length > 0) {
        return byCategory.map((c: any) => ({
          plan_category: c.category ?? c.plan_category ?? "Unknown",
          effectiveness_score: (c.avg_outcome_improvement ?? c.effectiveness_score ?? 0) / 100,
          key_factors: [c.most_effective_service].filter(Boolean),
          recommendations: insights
            .filter((i: any) => i.intervention_type === c.category)
            .map((i: any) => i.description)
            .filter(Boolean),
        }));
      }

      if (Array.isArray(raw)) {
        return raw.map((item: any) => ({
          plan_category: item.plan_category ?? item.category ?? "Unknown",
          effectiveness_score: item.effectiveness_score ?? 0,
          key_factors: item.key_factors ?? [],
          recommendations: item.recommendations ?? [],
        }));
      }

      return [];
    },
  });
}
