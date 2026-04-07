import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardStats, ActivityFeedItem, RiskAlert, RiskLevel } from "@/types";

interface DashboardData {
  stats: DashboardStats;
  activityFeed: ActivityFeedItem[];
  riskAlerts: RiskAlert[];
}

function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 0.75) return "Critical";
  if (score >= 0.5) return "High";
  if (score >= 0.25) return "Medium";
  return "Low";
}

function mapAlertType(alertType: string): "resident" | "donor" {
  return alertType === "DonorChurn" ? "donor" : "resident";
}

function alertLink(alertType: string, relatedId: number): string {
  return alertType === "DonorChurn"
    ? `/admin/donors/${relatedId}`
    : `/admin/residents/${relatedId}`;
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardData> => {
      const raw: any = await api.get("/admin/dashboard");

      const s = raw?.stats ?? {};
      const stats: DashboardStats = {
        activeResidents: s.activeResidents ?? 0,
        monthlyDonations: s.monthlyDonationTotal ?? s.monthlyDonations ?? 0,
        casesNeedingReview: s.casesNeedingReview ?? 0,
        socialEngagement: s.avgSocialEngagement ?? s.socialEngagement ?? 0,
        activeResidentsTrend: s.activeResidentsTrend ?? 0,
        monthlyDonationsTrend: s.monthlyDonationChange ?? s.monthlyDonationsTrend ?? 0,
        casesNeedingReviewTrend: s.casesNeedingReviewTrend ?? 0,
        socialEngagementTrend: s.socialEngagementChange ?? s.socialEngagementTrend ?? 0,
      };

      const rawActivity = raw?.recentActivity ?? raw?.activityFeed ?? [];
      const activityFeed: ActivityFeedItem[] = rawActivity.map((a: any, i: number) => ({
        id: String(a.relatedId ?? a.id ?? i),
        type: (a.type ?? "donation").toLowerCase(),
        title: a.title ?? a.description ?? "",
        description: a.description ?? "",
        timestamp: a.timestamp,
        link: a.link,
      }));

      const rawAlerts = raw?.riskAlerts ?? [];
      const riskAlerts: RiskAlert[] = rawAlerts.map((a: any, i: number) => ({
        id: String(a.relatedId ?? a.id ?? i),
        type: mapAlertType(a.alertType ?? a.type ?? ""),
        name: a.name ?? "",
        riskScore: a.riskScore ?? 0,
        riskLevel: a.riskLevel ?? scoreToRiskLevel(a.riskScore ?? 0),
        recommendedAction: a.recommendedAction ?? "",
        link: a.link ?? alertLink(a.alertType ?? a.type ?? "", a.relatedId ?? 0),
      }));

      return { stats, activityFeed, riskAlerts };
    },
  });
}
