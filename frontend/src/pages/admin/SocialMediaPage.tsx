import { useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { toast } from "sonner";
import type { Platform } from "@/types";

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
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
    ? parseISO(value.trim())
    : new Date(value.trim());
  return isValid(d) ? format(d, dateFormat) : fallback;
}

export default function SocialMediaPage() {
  const [activePlatform, setActivePlatform] = useState<Platform | "All">(
    "All"
  );
  const [activeTab, setActiveTab] = useState("analytics");
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const platformFilter =
    activePlatform !== "All" ? { platform: activePlatform } : {};
  const { data: postsData, isLoading: postsLoading } = useSocialPosts({
    ...platformFilter,
    pageSize: 1000,
  });
  const { data: commentsData } = useSocialComments(platformFilter);
  const { data: mlRecs } = useSocialMediaRecommendations();
  const composePost = useComposePost();
  const replyToComment = useReplyToComment();

  const posts = Array.isArray(postsData)
    ? postsData
    : (postsData?.data ?? []);
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

  return (
    <div>
      <PageHeader
        title="Social Media Command Center"
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
            onClick={() => setActivePlatform(value)}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="compose">Create Post</TabsTrigger>
          <TabsTrigger value="comments">Comments Inbox</TabsTrigger>
          <TabsTrigger value="recommendations">Insights</TabsTrigger>
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

        {/* ── Create Post Tab (Platform-Specific) ──────────── */}
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

        {/* ── Comments Inbox Tab ───────────────────────────── */}
        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Comments Inbox
                {activePlatform !== "All" && (
                  <Badge variant="outline" className="ml-1">
                    {activePlatform}
                  </Badge>
                )}
                <Badge variant="secondary" className="ml-2">
                  {
                    comments.filter(
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      (c: any) => !c.is_read
                    ).length
                  }{" "}
                  unread
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {activePlatform !== "All"
                    ? `No comments from ${activePlatform}`
                    : "No comments yet"}
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
                    const PlatformIcon =
                      platforms.find((p) => p.value === comment.platform)
                        ?.icon || MessageCircle;
                    return (
                      <motion.div
                        key={comment.comment_id}
                        variants={item}
                        className={cn(
                          "flex gap-3 rounded-lg border p-4 transition-colors",
                          !comment.is_read && "bg-primary/5 border-primary/20"
                        )}
                      >
                        <PlatformIcon className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {comment.commenter_name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {comment.platform}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {formatSafe(comment.timestamp, "MMM d, h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {comment.comment_text}
                          </p>
                          <div className="mt-2 flex gap-2">
                            <Input
                              placeholder="Reply..."
                              className="h-8 text-sm"
                              value={replyTexts[comment.comment_id] || ""}
                              onChange={(e) =>
                                setReplyTexts((prev) => ({
                                  ...prev,
                                  [comment.comment_id]: e.target.value,
                                }))
                              }
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={replyToComment.isPending}
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
                                  setReplyTexts((prev) => ({
                                    ...prev,
                                    [comment.comment_id]: "",
                                  }));
                                } catch {
                                  /* handled */
                                }
                              }}
                            >
                              Reply
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Insights Tab ─────────────────────────────────── */}
        <TabsContent value="recommendations">
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
                    {mlRecs?.predicted_engagement_rate
                      ? `${mlRecs.predicted_engagement_rate}%`
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
      </Tabs>
    </div>
  );
}
