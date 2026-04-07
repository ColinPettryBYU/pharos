import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Supporter, Donation, DonationAllocation } from "@/types";

interface DonorImpact {
  totalDonated: number;
  donationsCount: number;
  safehousesReached: number;
  programsSupported: number;
  recurringCount: number;
  allocations: DonationAllocation[];
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
