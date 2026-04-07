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
      const trends: DonationTrend[] = (raw?.monthlyTrends ?? raw?.trends ?? []).map((t: any) => ({
        month: t.month ?? "",
        total: t.total ?? 0,
        monetary: t.monetary ?? t.total ?? 0,
        inKind: t.inKind ?? 0,
        recurring: t.recurring ?? 0,
        oneTime: t.oneTime ?? (t.total ?? 0) - (t.recurring ?? 0),
        count: t.count ?? 0,
      }));
      return {
        trends,
        totalDonations: raw?.totalDonations ?? 0,
        activeSupporters: raw?.recurringDonorCount ?? raw?.activeSupporters ?? 0,
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
        avgEducationProgress: raw?.avgEducationProgress ?? 0,
        avgHealthScore: raw?.avgHealthScore ?? 0,
        reintegratedCount: raw?.reintegratedResidents ?? 0,
        activePlansCount: raw?.activeResidents ?? 0,
        educationProgress: raw?.educationProgress ?? [],
        healthTrends: raw?.healthTrends ?? [],
        emotionalDistribution: raw?.emotionalDistribution ?? [],
        reintegrationStatus: (raw?.reintegrationBreakdown ?? []).map((r: any) => ({
          status: r.status ?? r.Status ?? "",
          count: r.count ?? r.Count ?? 0,
        })),
        interventionCompletion: raw?.interventionCompletion ?? [],
        riskLevelBreakdown: (raw?.riskLevelBreakdown ?? []).map((r: any) => ({
          riskLevel: r.riskLevel ?? r.RiskLevel ?? "",
          count: r.count ?? r.Count ?? 0,
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
          safehouse_code: s.safehouseName ?? s.safehouse_code ?? "",
          avgEducation: s.avgEducationProgress ?? 0,
          avgHealth: s.avgHealthScore ?? 0,
          totalIncidents: s.recentIncidents ?? 0,
        })),
        monthlyMetrics: [],
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
        totalPosts: raw?.totalPosts ?? 0,
        avgEngagementRate: raw?.avgEngagementRate ?? 0,
        totalDonationReferrals: raw?.totalDonationReferrals ?? 0,
        totalEstimatedDonationValue: raw?.totalEstimatedDonationValue ?? 0,
        bestPlatform: raw?.bestPlatform,
        bestPostType: raw?.bestPostType,
        bestContentTopic: raw?.bestContentTopic,
        bestPostHour: raw?.bestPostHour,
        bestDayOfWeek: raw?.bestDayOfWeek,
        platformBreakdown: raw?.platformBreakdown ?? [],
        postTypePerformance: raw?.postTypePerformance ?? [],
        engagementTrends: raw?.engagementTrends ?? [],
        donationAttribution: raw?.donationAttribution ?? [],
      };
    },
  });
}
