import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedResponse, Donation, DonationAllocation } from "@/types";

interface DonationFilters {
  page?: number;
  pageSize?: number;
  donationType?: string;
  campaignName?: string;
  supporterId?: number;
  search?: string;
}

export function useDonations(filters: DonationFilters = {}) {
  return useQuery({
    queryKey: ["donations", filters],
    queryFn: () =>
      api.get<PaginatedResponse<Donation>>("/admin/donations", filters as Record<string, unknown>),
  });
}

export function useDonation(id: number) {
  return useQuery({
    queryKey: ["donations", id],
    queryFn: () => api.get<Donation>(`/admin/donations/${id}`),
    enabled: !!id,
  });
}

export function useDonationAllocations(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["donationAllocations", filters],
    queryFn: () =>
      api.get<PaginatedResponse<DonationAllocation>>("/admin/donation-allocations", filters),
  });
}

export function useCreateDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/admin/donations", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["donations"] }),
  });
}

export function useUpdateDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      api.put(`/admin/donations/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["donations"] }),
  });
}

export function useDeleteDonation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/donations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["donations"] }),
  });
}

export function useCreateDonationAllocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/admin/donation-allocations", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["donationAllocations"] }),
  });
}
