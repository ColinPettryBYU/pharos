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
  });
}

export function useComposePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.post("/admin/social-media/compose", data),
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
      const response = await api.post<{ redirectUrl: string }>(
        `/admin/social-media/accounts/${platform}/connect`
      );
      window.location.href = response.redirectUrl;
      return response;
    },
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
