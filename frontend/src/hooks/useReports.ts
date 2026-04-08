import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DonationTrend } from "@/types";

interface DonationReportData {
  trends: DonationTrend[];
  totalDonations: number;
  activeSupporters: number;
}

export function useDonationReports(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["reports", "donations", filters],
    queryFn: async (): Promise<DonationReportData> => {
      const raw: any = await api.get("/admin/reports/donations", filters);
      const rawTrends = raw?.monthly_trends ?? raw?.trends ?? [];
      const trends: DonationTrend[] = rawTrends.map((t: any) => ({
        month: t.month ?? "",
        total: t.total ?? 0,
        monetary: t.monetary ?? t.total ?? 0,
        inKind: t.in_kind ?? 0,
        recurring: t.recurring ?? 0,
        oneTime: t.one_time ?? (t.total ?? 0) - (t.recurring ?? 0),
        count: t.count ?? 0,
      }));
      return {
        trends,
        totalDonations: raw?.total_donations ?? 0,
        activeSupporters: raw?.recurring_donor_count ?? raw?.active_supporters ?? 0,
      };
    },
  });
}

export function useOutcomeReports(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["reports", "outcomes", filters],
    queryFn: async (): Promise<Record<string, unknown>> => {
      const raw: any = await api.get("/admin/reports/outcomes", filters);
      return {
        avgEducationProgress: raw?.avg_education_progress ?? 0,
        avgHealthScore: raw?.avg_health_score ?? 0,
        reintegratedCount: raw?.reintegrated_residents ?? 0,
        activePlansCount: raw?.active_residents ?? 0,
        educationProgress: (raw?.education_progress ?? []).map((e: any) => ({
          month: e.month ?? "",
          avgProgress: e.avg_value ?? 0,
        })),
        healthTrends: (raw?.health_trends ?? []).map((h: any) => ({
          month: h.month ?? "",
          avgScore: h.avg_value ?? 0,
        })),
        emotionalDistribution: (raw?.emotional_distribution ?? []).map((e: any) => ({
          state: e.name ?? "",
          count: e.count ?? 0,
        })),
        reintegrationStatus: (raw?.reintegration_breakdown ?? []).map((r: any) => ({
          status: r.status ?? "",
          count: r.count ?? 0,
        })),
        interventionCompletion: raw?.intervention_completion ?? [],
        riskLevelBreakdown: (raw?.risk_level_breakdown ?? []).map((r: any) => ({
          riskLevel: r.risk_level ?? "",
          count: r.count ?? 0,
        })),
      };
    },
  });
}

export function useSafehouseReports(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["reports", "safehouses", filters],
    queryFn: async (): Promise<Record<string, unknown>> => {
      const raw: any = await api.get("/admin/reports/safehouses", filters);
      const list = Array.isArray(raw) ? raw : raw?.data ?? [];
      return {
        safehouseSummary: list.map((s: any) => ({
          safehouse_code: s.safehouse_name ?? s.safehouse_code ?? "",
          avgEducation: s.avg_education_progress ?? 0,
          avgHealth: s.avg_health_score ?? 0,
          totalIncidents: s.recent_incidents ?? 0,
        })),
        monthlyMetrics: (raw?.monthly_metrics ?? []).map((m: any) => ({
          safehouse_code: m.safehouse_name ?? "",
          month: m.month_start ? m.month_start.substring(0, 7) : "",
          active_residents: m.active_residents ?? 0,
          avg_education_progress: m.avg_education_progress ?? 0,
          avg_health_score: m.avg_health_score ?? 0,
          incident_count: m.incident_count ?? 0,
        })),
      };
    },
  });
}

export function useSocialMediaReports(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["reports", "social-media", filters],
    queryFn: async (): Promise<Record<string, unknown>> => {
      const raw: any = await api.get("/admin/reports/social-media", filters);
      return {
        totalPosts: raw?.total_posts ?? 0,
        avgEngagementRate: raw?.avg_engagement_rate ?? 0,
        totalDonationReferrals: raw?.total_donation_referrals ?? 0,
        totalEstimatedDonationValue: raw?.total_estimated_donation_value ?? 0,
        bestPlatform: raw?.best_platform,
        bestPostType: raw?.best_post_type,
        bestContentTopic: raw?.best_content_topic,
        bestPostHour: raw?.best_post_hour,
        bestDayOfWeek: raw?.best_day_of_week,
        platformEngagement: (raw?.platform_breakdown ?? []).map((p: any) => ({
          platform: p.platform ?? "",
          avgEngagement: p.avg_engagement ?? 0,
          totalPosts: p.post_count ?? 0,
          totalReach: p.total_reach ?? 0,
        })),
        postTypePerformance: (raw?.post_type_performance ?? []).map((p: any) => ({
          postType: p.post_type ?? "",
          avgEngagement: p.avg_engagement ?? 0,
          avgReach: 0,
        })),
        contentTopicPerformance: (raw?.content_topic_performance ?? []).map((c: any) => ({
          topic: c.topic ?? "",
          avgEngagement: c.avg_engagement ?? 0,
          donationReferrals: c.donation_referrals ?? 0,
        })),
        engagementTrends: (raw?.engagement_trends ?? []).map((e: any) => ({
          month: e.month ?? "",
          avgEngagement: e.avg_engagement ?? 0,
          postCount: e.post_count ?? 0,
        })),
        donationAttribution: (raw?.donation_attribution ?? []).map((d: any) => ({
          platform: d.platform ?? "",
          referrals: d.referrals ?? 0,
          estimatedValue: d.estimated_value ?? 0,
        })),
      };
    },
  });
}
