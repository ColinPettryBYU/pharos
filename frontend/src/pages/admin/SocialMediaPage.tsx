import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { PlatformPostRouter } from "@/components/social/PlatformPostForms";
import {
  useSocialPosts,
  useSocialComments,
  useComposePost,
  useReplyToComment,
} from "@/hooks/useSocialMedia";
import { useSocialMediaRecommendations } from "@/hooks/useML";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Globe,
  Camera,
  MessageSquare,
  Play,
  Briefcase,
  Sparkles,
  MessageCircle,
  Eye,
  MousePointerClick,
  Heart,
  TrendingUp,
  DollarSign,
  Send,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { toast } from "sonner";
import type { Platform, SocialMediaPost } from "@/types";

const platforms: {
  value: Platform | "All";
  label: string;
  icon: React.ElementType;
}[] = [
  { value: "All", label: "All", icon: TrendingUp },
  { value: "Facebook", label: "Facebook", icon: Globe },
  { value: "Instagram", label: "Instagram", icon: Camera },
  { value: "Twitter", label: "Twitter", icon: MessageSquare },
  { value: "TikTok", label: "TikTok", icon: Play },
  { value: "LinkedIn", label: "LinkedIn", icon: Briefcase },
  { value: "YouTube", label: "YouTube", icon: Play },
];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

function formatSafe(
  value: string | null | undefined,
  dateFormat: string,
  fallback = "—"
): string {
  if (value == null || value.trim() === "") return fallback;
  try {
    const d = /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
      ? parseISO(value.trim())
      : new Date(value.trim());
    return isValid(d) ? format(d, dateFormat) : fallback;
  } catch {
    return fallback;
  }
}

function truncate(text: string | null | undefined, max: number): string {
  if (!text) return "—";
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export default function SocialMediaPage() {
  const [activePlatform, setActivePlatform] = useState<Platform | "All">(
    "All"
  );
  const [activeTab, setActiveTab] = useState("analytics");
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [postsPage, setPostsPage] = useState(1);
  const postsPageSize = 20;

  const platformFilter =
    activePlatform !== "All" ? { platform: activePlatform } : {};
  const { data: allPostsData, isLoading: postsLoading } = useSocialPosts({
    ...platformFilter,
    pageSize: 1000,
  });
  const { data: pagedPostsData } = useSocialPosts({
    ...platformFilter,
    page: postsPage,
    pageSize: postsPageSize,
  });
  const { data: commentsData, isLoading: commentsLoading, refetch: refetchComments } = useSocialComments(platformFilter);
  const { data: mlRecs } = useSocialMediaRecommendations();
  const composePost = useComposePost();
  const replyToComment = useReplyToComment();

  const posts: SocialMediaPost[] = Array.isArray(allPostsData)
    ? allPostsData
    : (allPostsData?.data ?? []);

  const pagedPosts: SocialMediaPost[] = Array.isArray(pagedPostsData)
    ? pagedPostsData
    : (pagedPostsData?.data ?? []);
  const totalPostsCount =
    !Array.isArray(pagedPostsData) && pagedPostsData?.total
      ? pagedPostsData.total
      : posts.length;
  const totalPages = Math.max(1, Math.ceil(totalPostsCount / postsPageSize));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commentsRaw = commentsData as any;
  const comments = Array.isArray(commentsRaw)
    ? commentsRaw
    : Array.isArray(commentsRaw?.comments)
      ? commentsRaw.comments
      : [];

  const totalReach = posts.reduce((s, p) => s + (p.reach ?? 0), 0);
  const avgEngagement =
    posts.length > 0
      ? posts.reduce((s, p) => s + (p.engagement_rate ?? 0), 0) / posts.length
      : 0;
  const totalClicks = posts.reduce((s, p) => s + (p.click_throughs ?? 0), 0);
  const totalReferrals = posts.reduce(
    (s, p) => s + (p.donation_referrals ?? 0),
    0
  );

  const contentPerformance = Object.entries(
    posts.reduce<Record<string, { count: number; engagement: number }>>(
      (acc, p) => {
        if (!acc[p.post_type]) acc[p.post_type] = { count: 0, engagement: 0 };
        acc[p.post_type].count++;
        acc[p.post_type].engagement += p.engagement_rate;
        return acc;
      },
      {}
    )
  ).map(([type, data]) => ({
    type,
    avgEngagement: +(data.engagement / data.count).toFixed(2),
  }));

  const engagementOverTime = (() => {
    const sorted = posts
      .filter((p) => p.created_at)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    const buckets: Record<
      string,
      { totalEng: number; totalReach: number; count: number }
    > = {};
    for (const p of sorted) {
      const key = formatSafe(p.created_at, "MMM yyyy");
      if (key === "—") continue;
      if (!buckets[key])
        buckets[key] = { totalEng: 0, totalReach: 0, count: 0 };
      buckets[key].totalEng += p.engagement_rate ?? 0;
      buckets[key].totalReach += p.reach ?? 0;
      buckets[key].count++;
    }
    return Object.entries(buckets).map(([date, b]) => ({
      date,
      engagement: +(b.totalEng / b.count).toFixed(2),
      reach: Math.round(b.totalReach / b.count),
    }));
  })();

  const [localResponded, setLocalResponded] = useState<Set<string>>(new Set());
  const unrespondedCount = comments.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (c: any) => !c.responded && !localResponded.has(c.comment_id)
  ).length;

  return (
    <div>
      <PageHeader
        title="Social Media"
        description="Manage posts, track analytics, and engage with your audience."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Social Media" },
        ]}
      />

      {/* Platform filter tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto pb-2">
        {platforms.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={activePlatform === value ? "default" : "ghost"}
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={() => { setActivePlatform(value); setPostsPage(1); }}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <div className="mx-3 h-6 w-px bg-border" style={{ opacity: 0.6 }} />
          <TabsTrigger value="compose">Create Post</TabsTrigger>
          <TabsTrigger value="comments" className="gap-1.5">
            Comments Inbox
            {unrespondedCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                {unrespondedCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Analytics Tab ─────────────────────────────────── */}
        <TabsContent value="analytics" className="space-y-6">
          {postsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                <motion.div variants={item}>
                  <StatCard title="Total Reach" value={totalReach} icon={Eye} />
                </motion.div>
                <motion.div variants={item}>
                  <StatCard
                    title="Avg Engagement"
                    value={avgEngagement}
                    format="percent"
                    icon={Heart}
                  />
                </motion.div>
                <motion.div variants={item}>
                  <StatCard
                    title="Click-throughs"
                    value={totalClicks}
                    icon={MousePointerClick}
                  />
                </motion.div>
                <motion.div variants={item}>
                  <StatCard
                    title="Donation Referrals"
                    value={totalReferrals}
                    icon={DollarSign}
                  />
                </motion.div>
              </motion.div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Engagement Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={engagementOverTime}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{
                            fill: "var(--color-muted-foreground)",
                            fontSize: 11,
                          }}
                          label={{
                            value: "Date",
                            position: "insideBottom",
                            offset: -5,
                            style: {
                              fill: "var(--color-muted-foreground)",
                              fontSize: 12,
                            },
                          }}
                        />
                        <YAxis
                          tick={{
                            fill: "var(--color-muted-foreground)",
                            fontSize: 11,
                          }}
                          label={{
                            value: "Engagement Rate",
                            angle: -90,
                            position: "insideLeft",
                            offset: 10,
                            style: {
                              fill: "var(--color-muted-foreground)",
                              fontSize: 12,
                            },
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="engagement"
                          stroke="var(--color-primary)"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          animationDuration={1000}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Content Type Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={contentPerformance}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-border"
                        />
                        <XAxis
                          dataKey="type"
                          tick={{
                            fill: "var(--color-muted-foreground)",
                            fontSize: 10,
                          }}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                          label={{
                            value: "Content Type",
                            position: "insideBottom",
                            offset: -5,
                            style: {
                              fill: "var(--color-muted-foreground)",
                              fontSize: 12,
                            },
                          }}
                        />
                        <YAxis
                          tick={{
                            fill: "var(--color-muted-foreground)",
                            fontSize: 11,
                          }}
                          label={{
                            value: "Avg Engagement",
                            angle: -90,
                            position: "insideLeft",
                            offset: 10,
                            style: {
                              fill: "var(--color-muted-foreground)",
                              fontSize: 12,
                            },
                          }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar
                          dataKey="avgEngagement"
                          fill="var(--color-primary)"
                          radius={[4, 4, 0, 0]}
                          animationDuration={800}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Posts Data Table Tab ──────────────────────────── */}
        <TabsContent value="posts">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                All Posts
                {activePlatform !== "All" && (
                  <Badge variant="outline" className="ml-2 font-normal">
                    {activePlatform}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 rounded-md" />
                  ))}
                </div>
              ) : pagedPosts.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">
                  No posts found
                  {activePlatform !== "All"
                    ? ` for ${activePlatform}`
                    : ""}
                </p>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b bg-muted/40">
                          <TableHead>Platform</TableHead>
                          <TableHead>Post Type</TableHead>
                          <TableHead className="min-w-[200px]">Caption</TableHead>
                          <TableHead>Topic</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="text-right">Eng. Rate</TableHead>
                          <TableHead className="text-right">Reach</TableHead>
                          <TableHead className="text-right">Likes</TableHead>
                          <TableHead className="text-right">Comments</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence mode="popLayout">
                          {pagedPosts.map((post, idx) => (
                            <motion.tr
                              key={post.post_id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.2, delay: idx * 0.02 }}
                              className="border-b transition-colors hover:bg-muted/50"
                            >
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {post.platform}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {post.post_type}
                              </TableCell>
                              <TableCell
                                className="text-sm text-muted-foreground max-w-[260px] truncate"
                                title={post.caption ?? ""}
                              >
                                {truncate(post.caption, 60)}
                              </TableCell>
                              <TableCell className="text-sm">
                                {post.content_topic}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatSafe(post.created_at, "MMM d, yyyy")}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm font-medium">
                                {(post.engagement_rate * 100).toFixed(1)}%
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm">
                                {post.reach?.toLocaleString() ?? "—"}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm">
                                {post.likes?.toLocaleString() ?? "—"}
                              </TableCell>
                              <TableCell className="text-right tabular-nums text-sm">
                                {post.comments?.toLocaleString() ?? "—"}
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {postsPage} of {totalPages} ({totalPostsCount} posts)
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={postsPage <= 1}
                        onClick={() => setPostsPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={postsPage >= totalPages}
                        onClick={() => setPostsPage((p) => p + 1)}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Insights Tab ─────────────────────────────────── */}
        <TabsContent value="insights">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <Sparkles className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-lg font-semibold">Best Time to Post</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  Based on historical engagement patterns
                </p>
                <div className="mt-4 rounded-lg bg-primary/5 p-4">
                  <p className="text-2xl font-bold">
                    {mlRecs?.best_post_time
                      ? `${mlRecs.best_post_time.day}, ${mlRecs.best_post_time.hour}:00`
                      : "Loading..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Predicted engagement rate:{" "}
                    {mlRecs?.predicted_engagement_rate != null
                      ? `${(mlRecs.predicted_engagement_rate * 100).toFixed(2)}%`
                      : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <TrendingUp className="h-8 w-8 text-success mb-3" />
                <h3 className="text-lg font-semibold">
                  Content That Drives Donations
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  From social media optimizer model
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {(mlRecs?.campaign_insights ?? []).length > 0 ? (
                    mlRecs!.campaign_insights.map((insight: string, i: number) => (
                      <li key={i} className="text-muted-foreground">
                        {insight}
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">Loading insights…</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

          {/* ── Create Post Tab ────────────────────────────── */}
          <TabsContent value="compose">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <PlatformPostRouter
                  platform={activePlatform}
                  composePost={composePost}
                />
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="rounded-lg bg-primary/5 p-3">
                      <p className="font-medium text-primary">Best Time to Post</p>
                      <p className="text-muted-foreground">
                        {mlRecs?.best_post_time
                          ? `${mlRecs.best_post_time.day} ${mlRecs.best_post_time.hour}:00 — higher engagement`
                          : "Loading recommendations…"}
                      </p>
                    </div>
                    <div className="rounded-lg bg-success/5 p-3">
                      <p className="font-medium text-success">
                        Recommended Content
                      </p>
                      <p className="text-muted-foreground">
                        {mlRecs?.recommended_content_type
                          ? `${mlRecs.recommended_content_type} posts drive more donations`
                          : "Loading recommendations…"}
                      </p>
                    </div>
                    {mlRecs?.campaign_insights?.map(
                      (insight: string, i: number) => (
                        <div key={i} className="rounded-lg bg-accent/5 p-3">
                          <p className="text-muted-foreground">{insight}</p>
                        </div>
                      )
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ── Comments Inbox Tab ─────────────────────────── */}
          <TabsContent value="comments">
            {activePlatform === "All" ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <MessageCircle className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">
                    Select a Platform
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Choose a specific platform from the tabs above to view and
                    reply to comments.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">Comments Inbox</CardTitle>
                      <Badge variant="outline">{activePlatform}</Badge>
                      {unrespondedCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {unrespondedCount} unresponded
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={commentsLoading}
                      onClick={() => refetchComments()}
                    >
                      {commentsLoading ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {commentsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 rounded-lg" />
                      ))}
                    </div>
                  ) : comments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No comments from {activePlatform}
                    </p>
                  ) : (
                    <motion.div
                      variants={stagger}
                      initial="hidden"
                      animate="show"
                      className="space-y-3"
                    >
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {comments.map((comment: any) => {
                        const isResponded = comment.responded || localResponded.has(comment.comment_id);
                        return (
                        <motion.div
                          key={comment.comment_id}
                          variants={item}
                          className={cn(
                            "rounded-xl border p-4 transition-all",
                            isResponded
                              ? "bg-muted/30 border-border/50"
                              : "bg-card border-border shadow-sm"
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-bold uppercase text-muted-foreground">
                                  {(comment.commenter_name || "?")[0]}
                                </div>
                                <span className="font-semibold text-sm">
                                  {comment.commenter_name}
                                </span>
                                <Badge
                                  variant={isResponded ? "secondary" : "destructive"}
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {isResponded ? "Responded" : "Unresponded"}
                                </Badge>
                              </div>
                              <p className="text-sm text-foreground/80 mt-2 ml-9 leading-relaxed">
                                {comment.comment_text}
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground shrink-0 pt-1">
                              {formatSafe(comment.created_at ?? comment.timestamp, "MMM d, h:mm a")}
                            </span>
                          </div>

                          {!isResponded && (
                          <div className="mt-3 ml-9 flex gap-2">
                            <Input
                              placeholder="Write a reply…"
                              className="h-8 text-sm rounded-lg"
                              value={replyTexts[comment.comment_id] || ""}
                              onChange={(e) =>
                                setReplyTexts((prev) => ({
                                  ...prev,
                                  [comment.comment_id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const text = replyTexts[comment.comment_id];
                                  if (!text) return;
                                  replyToComment
                                    .mutateAsync({
                                      commentId: comment.comment_id,
                                      reply: text,
                                      platform: comment.platform,
                                    })
                                    .then(() => {
                                      toast.success("Reply sent!");
                                      setLocalResponded(prev => new Set(prev).add(comment.comment_id));
                                      setReplyTexts((prev) => ({
                                        ...prev,
                                        [comment.comment_id]: "",
                                      }));
                                    })
                                    .catch(() => {});
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              className="gap-1.5"
                              disabled={
                                replyToComment.isPending ||
                                !replyTexts[comment.comment_id]
                              }
                              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                              onClick={async () => {
                                const text = replyTexts[comment.comment_id];
                                if (!text) return;
                                try {
                                  await replyToComment.mutateAsync({
                                    commentId: comment.comment_id,
                                    reply: text,
                                    platform: comment.platform,
                                  });
                                  toast.success("Reply sent!");
                                  setLocalResponded(prev => new Set(prev).add(comment.comment_id));
                                  setReplyTexts((prev) => ({
                                    ...prev,
                                    [comment.comment_id]: "",
                                  }));
                                } catch {
                                  /* handled */
                                }
                              }}
                            >
                              <Send className="h-3.5 w-3.5" />
                              Reply
                            </Button>
                          </div>
                          )}
                        </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
      </Tabs>
    </div>
  );
}
