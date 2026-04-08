import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatHistoryItem[];
}

interface ChatBlock {
  type: "text" | "stat" | "table" | "list";
  content?: string;
  label?: string;
  value?: string;
  trend?: string | null;
  icon?: string | null;
  title?: string;
  headers?: string[];
  rows?: string[][];
  items?: string[];
}

interface ChatResponse {
  blocks: ChatBlock[];
}

export type { ChatBlock, ChatResponse, ChatRequest, ChatHistoryItem };

export function useSendMessage() {
  return useMutation({
    mutationFn: (data: ChatRequest) =>
      api.post<ChatResponse>("/admin/chat", data),
  });
}
