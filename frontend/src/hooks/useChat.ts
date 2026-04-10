import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  conversation_id?: number;
  history?: ChatHistoryItem[];
}

interface ChatBlock {
  type: "text" | "stat" | "table" | "list" | "chart";
  content?: string;
  label?: string;
  value?: string;
  trend?: string | null;
  icon?: string | null;
  title?: string;
  headers?: string[];
  rows?: string[][];
  items?: string[];
  chart_type?: "bar" | "line" | "area" | "pie";
  data?: Record<string, unknown>[];
  x_key?: string;
  y_keys?: string[];
  colors?: string[];
}

interface ChatResponse {
  blocks: ChatBlock[];
  conversation_id?: number;
  conversation_title?: string;
}

interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

interface ConversationMessagesResponse {
  conversation: { id: number; title: string };
  messages: {
    id: number;
    role: "user" | "assistant";
    content_json: string;
    created_at: string;
  }[];
}

export type {
  ChatBlock,
  ChatResponse,
  ChatRequest,
  ChatHistoryItem,
  Conversation,
  ConversationMessagesResponse,
};

export function useConversations() {
  return useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: () => api.get<Conversation[]>("/admin/chat/conversations"),
  });
}

export function useConversationMessages(conversationId: number | null) {
  return useQuery({
    queryKey: ["chat", "conversations", conversationId, "messages"],
    queryFn: () =>
      api.get<ConversationMessagesResponse>(
        `/admin/chat/conversations/${conversationId}/messages`
      ),
    enabled: conversationId !== null,
  });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      api.post<{ id: number; title: string; created_at: string; updated_at: string }>(
        "/admin/chat/conversations"
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "conversations"] }),
  });
}

export function useDeleteConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/chat/conversations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat", "conversations"] }),
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ChatRequest) =>
      api.post<ChatResponse>("/admin/chat", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat", "conversations"], exact: true });
    },
  });
}
