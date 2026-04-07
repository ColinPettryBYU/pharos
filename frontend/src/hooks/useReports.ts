import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { DonationTrend } from "@/types";

export function useDonationReports(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["reports", "donations", filters],
    queryFn: () => api.get<{ trends: DonationTrend[]; totalDonations: number; activeSupporters: number }>("/admin/reports/donations", filters),
  });
}

export function useOutcomeReports(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["reports", "outcomes", filters],
    queryFn: () => api.get<Record<string, unknown>>("/admin/reports/outcomes", filters),
  });
}

export function useSafehouseReports(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["reports", "safehouses", filters],
    queryFn: () => api.get<Record<string, unknown>>("/admin/reports/safehouses", filters),
  });
}

export function useSocialMediaReports(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["reports", "social-media", filters],
    queryFn: () => api.get<Record<string, unknown>>("/admin/reports/social-media", filters),
  });
}
