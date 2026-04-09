import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  PaginatedResponse,
  SocialMediaPost,
  ConnectedAccount,
  CommentInboxResponse,
} from "@/types";

interface SocialPostFilters {
  page?: number;
  pageSize?: number;
  platform?: string;
  postType?: string;
  search?: string;
}

export function useSocialPosts(filters: SocialPostFilters = {}) {
  return useQuery({
    queryKey: ["socialPosts", filters],
    queryFn: () =>
      api.get<PaginatedResponse<SocialMediaPost>>(
        "/admin/social-media/posts",
        filters as Record<string, unknown>
      ),
    placeholderData: (prev) => prev,
  });
}

export function useSocialAnalytics(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["socialAnalytics", filters],
    queryFn: () =>
      api.get<Record<string, unknown>>("/admin/social-media/analytics", filters),
  });
}

export function useSocialComments(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ["socialComments", filters],
    queryFn: () =>
      api.get<CommentInboxResponse>("/admin/social-media/comments/inbox", filters),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useComposePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await api.post<{ posts?: unknown[]; errors?: string[] }>(
        "/admin/social-media/compose",
        data
      );
      if (res?.errors && res.errors.length > 0) {
        throw new Error(res.errors.join("\n"));
      }
      return res;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["socialPosts"] }),
  });
}

export function useReplyToComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      commentId,
      reply,
      platform,
    }: {
      commentId: string;
      reply: string;
      platform?: string;
    }) =>
      api.post(
        `/admin/social-media/comments/${commentId}/reply${platform ? `?platform=${platform}` : ""}`,
        { replyText: reply }
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["socialComments"] }),
  });
}

// ── Account Management ──

export function useSocialAccounts() {
  return useQuery({
    queryKey: ["socialAccounts"],
    queryFn: () =>
      api.get<ConnectedAccount[]>("/admin/social-media/accounts"),
  });
}

export function useConnectSocialAccount() {
  return useMutation({
    mutationFn: async (platform: string) => {
      const response = await api.post<{ redirect_url: string }>(
        `/admin/social-media/accounts/${platform}/connect`
      );
      if (!response.redirect_url) {
        throw new Error("No redirect URL received from server. API keys may not be configured for this platform.");
      }
      window.location.href = response.redirect_url;
      return response;
    },
  });
}

export function usePlatformStatus() {
  return useQuery({
    queryKey: ["platformStatus"],
    queryFn: () =>
      api.get<Record<string, boolean>>("/admin/social-media/accounts/status"),
  });
}

export function useDisconnectSocialAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (platform: string) =>
      api.delete(`/admin/social-media/accounts/${platform}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["socialAccounts"] }),
  });
}

export function useSavePlatformCredentials() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      platform,
      clientId,
      clientSecret,
    }: {
      platform: string;
      clientId: string;
      clientSecret: string;
    }) =>
      api.post(`/admin/social-media/accounts/credentials/${platform}`, {
        clientId,
        clientSecret,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["platformStatus"] });
    },
  });
}
