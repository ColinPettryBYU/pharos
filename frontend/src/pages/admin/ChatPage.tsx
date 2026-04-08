import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowUp, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useSendMessage } from "@/hooks/useChat";
import type { ChatBlock, ChatHistoryItem } from "@/hooks/useChat";

interface Message {
  id: string;
  role: "user" | "assistant";
  content?: string;
  blocks?: ChatBlock[];
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "How many active residents do we have?",
  "Show me donation trends this year",
  "Which safehouse has the most incidents?",
  "What's our social media engagement like?",
  "Compare education progress across safehouses",
];

function TextBlockRenderer({ block }: { block: ChatBlock }) {
  return <p className="text-sm leading-relaxed">{block.content}</p>;
}

function StatBlockRenderer({ block }: { block: ChatBlock }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4 flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {block.label}
      </span>
      <span className="text-3xl font-bold tabular-nums tracking-tight">
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

function ThinkingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-start gap-3"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-card border px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-muted-foreground/40"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
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
    </motion.div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mutation = useSendMessage();

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
        { message: trimmed, history },
        {
          onSuccess: (data) => {
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
    [messages, mutation]
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
    <div className="flex flex-col h-[calc(100vh-8rem)] -m-4 sm:-m-6 lg:-m-8">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {!hasMessages ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
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
            <motion.div
              key="conversation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-3xl mx-auto space-y-6"
            >
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
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
                                  item.length >= 3 && "grid-cols-2 sm:grid-cols-3"
                                )}
                              >
                                {item.map((stat, si) => (
                                  <BlockRenderer key={si} block={stat} index={i + si} />
                                ))}
                              </div>
                            );
                          }
                          return <BlockRenderer key={i} block={item} index={i} />;
                        })}
                    </div>
                  )}
                </motion.div>
              ))}

              <AnimatePresence>
                {mutation.isPending && <ThinkingIndicator />}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky input bar */}
      <div className="shrink-0 border-t bg-background px-4 sm:px-6 lg:px-8 py-3">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-end gap-2"
        >
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about residents, donations, social media..."
              rows={1}
              className="w-full resize-none rounded-xl border bg-card px-4 py-3 pr-4 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/40 transition-shadow"
              style={{ maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
          </div>
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || mutation.isPending}
            className="rounded-xl h-11 w-11 shrink-0"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
