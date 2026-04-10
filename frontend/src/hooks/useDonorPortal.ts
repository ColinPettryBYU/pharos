import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Supporter, Donation } from "@/types";

interface ImpactAllocation {
  safehouse_name: string;
  program_area: string;
  total_allocated: number;
}

interface DonorImpact {
  total_donated: number;
  total_donations: number;
  safehouses_impacted: number;
  program_areas_supported: string[];
  donation_timeline: Array<{
    donation_id: number;
    donation_date: string;
    donation_type: string;
    amount: number | null;
    campaign_name: string | null;
  }>;
  allocations: ImpactAllocation[];
}

export function useDonorProfile() {
  return useQuery({
    queryKey: ["donor", "profile"],
    queryFn: () => api.get<Supporter>("/donor/my-profile"),
  });
}

export function useDonorDonations() {
  return useQuery({
    queryKey: ["donor", "donations"],
    queryFn: () => api.get<Donation[]>("/donor/my-donations"),
  });
}

export function useDonorImpact() {
  return useQuery({
    queryKey: ["donor", "impact"],
    queryFn: () => api.get<DonorImpact>("/donor/my-impact"),
  });
}
