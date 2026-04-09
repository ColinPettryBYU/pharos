import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  ArrowUp,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  useSendMessage,
  useConversations,
  useConversationMessages,
  useDeleteConversation,
} from "@/hooks/useChat";
import type { ChatBlock, ChatHistoryItem } from "@/hooks/useChat";
import { formatDistanceToNow } from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Message {
  id: string;
  role: "user" | "assistant";
  content?: string;
  blocks?: ChatBlock[];
  timestamp: Date;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUGGESTED_QUESTIONS = [
  "How many active residents do we have?",
  "Show me donation trends this year",
  "Which safehouse has the most incidents?",
  "What's our social media engagement like?",
  "Compare education progress across safehouses",
];

// ---------------------------------------------------------------------------
// Block renderers (unchanged)
// ---------------------------------------------------------------------------

function TextBlockRenderer({ block }: { block: ChatBlock }) {
  return <p className="text-sm leading-relaxed">{block.content}</p>;
}

function StatBlockRenderer({ block }: { block: ChatBlock }) {
  return (
    <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {block.label}
      </span>
      <span className="text-3xl font-bold tabular-nums tracking-tight text-primary">
        {block.value}
      </span>
      {block.trend && (
        <span
          className={cn(
            "flex items-center gap-1 text-xs font-medium",
            block.trend === "up" && "text-emerald-600 dark:text-emerald-400",
            block.trend === "down" && "text-red-600 dark:text-red-400"
          )}
        >
          {block.trend === "up" ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {block.trend}
        </span>
      )}
    </div>
  );
}

function TableBlockRenderer({ block }: { block: ChatBlock }) {
  return (
    <div className="space-y-2">
      {block.title && (
        <p className="text-sm font-semibold">{block.title}</p>
      )}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {block.headers?.map((header, i) => (
                <TableHead key={i} className="text-xs font-semibold">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {block.rows?.map((row, ri) => (
              <TableRow key={ri} className="even:bg-muted/20">
                {row.map((cell, ci) => (
                  <TableCell key={ci} className="text-sm py-2">
                    {cell}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ListBlockRenderer({ block }: { block: ChatBlock }) {
  return (
    <div className="space-y-2">
      {block.title && (
        <p className="text-sm font-semibold">{block.title}</p>
      )}
      <ul className="space-y-1.5 pl-1">
        {block.items?.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
            <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

const CHART_COLORS = [
  "var(--color-primary)", "var(--color-chart-2)", "var(--color-chart-3)",
  "var(--color-chart-4)", "var(--color-chart-5)", "var(--color-accent)",
];

function ChartBlockRenderer({ block }: { block: ChatBlock }) {
  const data = block.data ?? [];
  const xKey = block.x_key ?? "name";
  const yKeys = block.y_keys ?? Object.keys(data[0] ?? {}).filter(k => k !== xKey);
  const colors = block.colors ?? CHART_COLORS;

  if (data.length === 0) return null;

  const inner = (() => {
    switch (block.chart_type) {
      case "line":
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {yKeys.map((key, i) => (
              <Line key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} strokeWidth={2} dot={{ r: 3 }} />
            ))}
          </LineChart>
        );
      case "area":
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {yKeys.map((key, i) => (
              <Area key={key} type="monotone" dataKey={key} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.15} />
            ))}
          </AreaChart>
        );
      case "pie":
        return (
          <PieChart>
            <Pie data={data} dataKey={yKeys[0] ?? "value"} nameKey={xKey} cx="50%" cy="50%" outerRadius={80} label={({ name }) => String(name ?? "")}>
              {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        );
      default:
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey={xKey} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
            <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8, fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {yKeys.map((key, i) => (
              <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        );
    }
  })();

  const isPie = block.chart_type === "pie";

  return (
    <div className="space-y-2">
      {block.title && <p className="text-sm font-semibold">{block.title}</p>}
      <div className="rounded-xl border bg-card/50 p-3" style={isPie ? { paddingTop: 16 } : undefined}>
        <ResponsiveContainer width="100%" height={isPie ? 260 : 220}>
          {inner}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BlockRenderer({ block, index }: { block: ChatBlock; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
    >
      {block.type === "text" && <TextBlockRenderer block={block} />}
      {block.type === "stat" && <StatBlockRenderer block={block} />}
      {block.type === "table" && <TableBlockRenderer block={block} />}
      {block.type === "list" && <ListBlockRenderer block={block} />}
      {block.type === "chart" && <ChartBlockRenderer block={block} />}
    </motion.div>
  );
}

function groupStatBlocks(blocks: ChatBlock[]): (ChatBlock | ChatBlock[])[] {
  const grouped: (ChatBlock | ChatBlock[])[] = [];
  let statBuffer: ChatBlock[] = [];

  for (const block of blocks) {
    if (block.type === "stat") {
      statBuffer.push(block);
    } else {
      if (statBuffer.length > 0) {
        grouped.push([...statBuffer]);
        statBuffer = [];
      }
      grouped.push(block);
    }
  }
  if (statBuffer.length > 0) {
    grouped.push([...statBuffer]);
  }
  return grouped;
}

const THINKING_PHRASES = [
  "Thinking",
  "Querying database",
  "Pulling data",
  "Analyzing records",
  "Crunching numbers",
  "Building response",
];

function ThinkingIndicator() {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % THINKING_PHRASES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="h-4 w-4 text-primary" />
        </motion.div>
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-card border px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-primary/60"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.span
              key={phraseIdx}
              initial={{ opacity: 0, y: 4, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
              transition={{ duration: 0.3 }}
              className="text-xs font-medium text-muted-foreground"
            >
              {THINKING_PHRASES[phraseIdx]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

interface ConversationSidebarProps {
  activeId: number | null;
  onSelect: (id: number | null) => void;
  open: boolean;
  onToggle: () => void;
}

function ConversationSidebar({
  activeId,
  onSelect,
  open,
  onToggle,
}: ConversationSidebarProps) {
  const { data: conversations, isLoading } = useConversations();
  const deleteConversation = useDeleteConversation();
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    await deleteConversation.mutateAsync(id);
    if (activeId === id) {
      onSelect(null);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <motion.aside
        initial={false}
        animate={{ width: open ? 256 : 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className={cn(
          "shrink-0 overflow-hidden border-r bg-card",
          "max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-50 max-md:shadow-xl"
        )}
      >
        <div className="flex h-full w-64 flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 border-b px-3 py-3">
            <Button
              variant="outline"
              className="flex-1 justify-start gap-2"
              onClick={() => onSelect(null)}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={onToggle}
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
            {isLoading ? (
              <div className="space-y-2 px-1 pt-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 rounded-lg bg-muted/50 animate-pulse"
                  />
                ))}
              </div>
            ) : conversations && conversations.length > 0 ? (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    onSelect(conv.id);
                    if (window.innerWidth < 768) onToggle();
                  }}
                  onMouseEnter={() => setHoveredId(conv.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={cn(
                    "group relative flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors",
                    activeId === conv.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {conv.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conv.updated_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {hoveredId === conv.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 opacity-60 hover:opacity-100 hover:text-destructive"
                      onClick={(e) => handleDelete(e, conv.id)}
                      disabled={deleteConversation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </button>
              ))
            ) : (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                No conversations yet
              </p>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mutation = useSendMessage();

  const { data: conversationData, isLoading: isLoadingMessages } =
    useConversationMessages(activeConversationId);

  // Load messages when switching to an existing conversation
  useEffect(() => {
    if (!conversationData) return;

    const loaded: Message[] = conversationData.messages.map((m) => {
      if (m.role === "user") {
        let text = "";
        try {
          const parsed = JSON.parse(m.content_json);
          text = parsed.text ?? "";
        } catch {
          text = m.content_json;
        }
        return {
          id: String(m.id),
          role: "user" as const,
          content: text,
          timestamp: new Date(m.created_at),
        };
      }

      let blocks: ChatBlock[] = [];
      try {
        blocks = JSON.parse(m.content_json);
      } catch {
        blocks = [{ type: "text", content: m.content_json }];
      }
      return {
        id: String(m.id),
        role: "assistant" as const,
        blocks,
        timestamp: new Date(m.created_at),
      };
    });

    setMessages(loaded);
  }, [conversationData]);

  // Clear messages when starting a new chat
  const handleSelectConversation = useCallback((id: number | null) => {
    setActiveConversationId(id);
    if (id === null) {
      setMessages([]);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, mutation.isPending, scrollToBottom]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || mutation.isPending) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      const history: ChatHistoryItem[] = messages.map((m) => ({
        role: m.role,
        content:
          m.content ??
          m.blocks
            ?.filter((b) => b.type === "text")
            .map((b) => b.content)
            .join(" ") ??
          "",
      }));

      mutation.mutate(
        {
          message: trimmed,
          conversation_id: activeConversationId ?? undefined,
          history,
        },
        {
          onSuccess: (data) => {
            if (data.conversation_id && !activeConversationId) {
              setActiveConversationId(data.conversation_id);
            }

            const assistantMsg: Message = {
              id: crypto.randomUUID(),
              role: "assistant",
              blocks: data.blocks,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
          },
          onError: () => {
            const errorMsg: Message = {
              id: crypto.randomUUID(),
              role: "assistant",
              blocks: [
                {
                  type: "text",
                  content:
                    "Sorry, something went wrong. Please try again.",
                },
              ],
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMsg]);
          },
        }
      );
    },
    [messages, mutation, activeConversationId]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 sm:-m-6 lg:-m-8">
      {/* Conversation sidebar */}
      <ConversationSidebar
        activeId={activeConversationId}
        onSelect={handleSelectConversation}
        open={sidebarOpen}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      {/* Chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Sidebar toggle (when collapsed) */}
        {!sidebarOpen && (
          <div className="shrink-0 flex items-center px-4 pt-3 pb-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSidebarOpen(true)}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Messages area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6"
        >
          {isLoadingMessages && activeConversationId ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40"
                    animate={{
                      opacity: [0.3, 1, 0.3],
                      scale: [0.85, 1.1, 0.85],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </div>
          ) : !hasMessages ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center h-full"
            >
              <div className="max-w-lg w-full text-center space-y-6">
                <div className="flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Pharos AI Assistant
                  </h1>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    I can help you understand your organization's data.
                    Try asking:
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <motion.button
                      key={q}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => sendMessage(q)}
                      className="rounded-full border bg-card px-4 py-2 text-sm text-foreground shadow-sm transition-colors hover:bg-muted/50 cursor-pointer"
                    >
                      {q}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    layout
                    className={cn(
                      "flex items-start gap-3",
                      msg.role === "user" && "justify-end"
                    )}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0 mt-0.5">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    {msg.role === "user" ? (
                      <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 max-w-[80%] shadow-sm">
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                      </div>
                    ) : (
                      <div className="rounded-2xl rounded-tl-sm bg-card border px-5 py-4 max-w-[85%] shadow-sm space-y-4">
                        {msg.blocks &&
                          groupStatBlocks(msg.blocks).map((item, i) => {
                            if (Array.isArray(item)) {
                              return (
                                <div
                                  key={i}
                                  className={cn(
                                    "grid gap-3",
                                    item.length === 1 && "grid-cols-1",
                                    item.length === 2 && "grid-cols-2",
                                    item.length >= 3 &&
                                      "grid-cols-2 sm:grid-cols-3"
                                  )}
                                >
                                  {item.map((stat, si) => (
                                    <BlockRenderer
                                      key={si}
                                      block={stat}
                                      index={i + si}
                                    />
                                  ))}
                                </div>
                              );
                            }
                            return (
                              <BlockRenderer key={i} block={item} index={i} />
                            );
                          })}
                      </div>
                    )}
                  </motion.div>
                ))}

                {mutation.isPending && (
                  <ThinkingIndicator key="thinking" />
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Sticky input bar */}
        <div className="shrink-0 border-t bg-background px-4 sm:px-6 lg:px-8 py-4">
          <form
            onSubmit={handleSubmit}
            className="max-w-3xl mx-auto"
          >
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about residents, donations, social media..."
                rows={1}
                className="w-full resize-none rounded-2xl border border-border bg-card pl-4 pr-14 py-3.5 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                style={{ maxHeight: "120px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height =
                    Math.min(target.scrollHeight, 120) + "px";
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || mutation.isPending}
                className="absolute right-2.5 top-[7px] rounded-xl h-9 w-9 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
