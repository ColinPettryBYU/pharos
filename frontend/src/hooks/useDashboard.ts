import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DashboardStats, ActivityFeedItem, RiskAlert } from "@/types";

interface DashboardData {
  stats: DashboardStats;
  activityFeed: ActivityFeedItem[];
  riskAlerts: RiskAlert[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardData>("/admin/dashboard"),
  });
}
