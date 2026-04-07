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
        activeResidents: s.active_residents ?? 0,
        monthlyDonations: s.monthly_donation_total ?? 0,
        casesNeedingReview: s.cases_needing_review ?? 0,
        socialEngagement: s.avg_social_engagement ?? 0,
        activeResidentsTrend: 0,
        monthlyDonationsTrend: s.monthly_donation_change ?? 0,
        casesNeedingReviewTrend: 0,
        socialEngagementTrend: s.social_engagement_change ?? 0,
      };

      const rawActivity = raw?.recent_activity ?? [];
      const activityFeed: ActivityFeedItem[] = rawActivity.map((a: any, i: number) => ({
        id: String(a.related_id ?? i),
        type: (a.type ?? "donation").toLowerCase(),
        title: a.description ?? "",
        description: a.description ?? "",
        timestamp: a.timestamp,
      }));

      const rawAlerts = raw?.risk_alerts ?? [];
      const riskAlerts: RiskAlert[] = rawAlerts.map((a: any, i: number) => ({
        id: String(a.related_id ?? i),
        type: mapAlertType(a.alert_type ?? ""),
        name: a.name ?? "",
        riskScore: a.risk_score ?? 0,
        riskLevel: scoreToRiskLevel(a.risk_score ?? 0),
        recommendedAction: a.recommended_action ?? "",
        link: alertLink(a.alert_type ?? "", a.related_id ?? 0),
      }));

      return { stats, activityFeed, riskAlerts };
    },
  });
}
