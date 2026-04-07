import { useState } from "react";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { useSocialPosts, useSocialComments, useComposePost, useReplyToComment } from "@/hooks/useSocialMedia";
import { useSocialMediaRecommendations } from "@/hooks/useML";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Globe, Camera, MessageSquare, Play, Briefcase,
  Send, Hash, Calendar, Sparkles, MessageCircle,
  Eye, MousePointerClick, Heart, TrendingUp, DollarSign,
} from "lucide-react";
import { format, isValid, parseISO } from "date-fns";
import { toast } from "sonner";
import type { Platform } from "@/types";

const platforms: { value: Platform | "All"; label: string; icon: React.ElementType }[] = [
  { value: "All", label: "All", icon: TrendingUp },
  { value: "Facebook", label: "Facebook", icon: Globe },
  { value: "Instagram", label: "Instagram", icon: Camera },
  { value: "Twitter", label: "Twitter", icon: MessageSquare },
  { value: "TikTok", label: "TikTok", icon: Play },
  { value: "LinkedIn", label: "LinkedIn", icon: Briefcase },
  { value: "YouTube", label: "YouTube", icon: Play },
];

const stagger = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

function formatSafe(value: string | null | undefined, dateFormat: string, fallback = "—"): string {
  if (value == null || value.trim() === "") return fallback;
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? parseISO(value.trim()) : new Date(value.trim());
  return isValid(d) ? format(d, dateFormat) : fallback;
}

const composeSchema = z.object({
  Platforms: z.array(z.string()).min(1, "Select at least one platform"),
  Caption: z.string().min(1, "Caption is required"),
  ContentTopic: z.string().optional(),
  CallToActionType: z.string().optional(),
  Hashtags: z.string().optional(),
  ScheduledTime: z.string().optional(),
});

type ComposeForm = z.infer<typeof composeSchema>;

export default function SocialMediaPage() {
  const [activePlatform, setActivePlatform] = useState<Platform | "All">("All");
  const [activeTab, setActiveTab] = useState("analytics");
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const platformFilter = activePlatform !== "All" ? { platform: activePlatform } : {};
  const { data: postsData, isLoading: postsLoading } = useSocialPosts(platformFilter);
  const { data: commentsData } = useSocialComments(platformFilter);
  const { data: mlRecs } = useSocialMediaRecommendations();
  const composePost = useComposePost();
  const replyToComment = useReplyToComment();

  const posts = Array.isArray(postsData) ? postsData : (postsData?.data ?? []);
  // Backend returns { comments, totalCount, page, pageSize } or may still return a flat array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const commentsRaw = commentsData as any;
  const comments = Array.isArray(commentsRaw)
    ? commentsRaw
    : Array.isArray(commentsRaw?.comments)
      ? commentsRaw.comments
      : [];

  const totalReach = posts.reduce((s, p) => s + p.reach, 0);
  const avgEngagement = posts.length > 0 ? posts.reduce((s, p) => s + p.engagement_rate, 0) / posts.length : 0;
  const totalClicks = posts.reduce((s, p) => s + p.click_throughs, 0);
  const totalReferrals = posts.reduce((s, p) => s + p.donation_referrals, 0);

  const contentPerformance = Object.entries(
    posts.reduce<Record<string, { count: number; engagement: number }>>((acc, p) => {
      if (!acc[p.post_type]) acc[p.post_type] = { count: 0, engagement: 0 };
      acc[p.post_type].count++;
      acc[p.post_type].engagement += p.engagement_rate;
      return acc;
    }, {})
  ).map(([type, data]) => ({ type, avgEngagement: +(data.engagement / data.count).toFixed(2) }));

  const engagementOverTime = posts
    .filter((p) => p.created_at)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((p) => ({ date: formatSafe(p.created_at, "MMM d"), engagement: p.engagement_rate, reach: p.reach }));

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const form = useForm<ComposeForm>({
    resolver: zodResolver(composeSchema),
    defaultValues: { Platforms: [], Caption: "", ContentTopic: "", CallToActionType: "", Hashtags: "", ScheduledTime: "" },
  });

  const onCompose = form.handleSubmit(async (values) => {
    try {
      await composePost.mutateAsync({ ...values, Platforms: selectedPlatforms } as unknown as Record<string, unknown>);
      toast.success("Post scheduled!");
      form.reset();
      setSelectedPlatforms([]);
    } catch { /* handled by api client */ }
  });

  return (
    <div>
      <PageHeader
        title="Social Media Command Center"
        description="Manage posts, track analytics, and engage with your audience."
        breadcrumbs={[{ label: "Dashboard", href: "/admin" }, { label: "Social Media" }]}
      />

      <div className="mb-6 flex gap-1 overflow-x-auto pb-2">
        {platforms.map(({ value, label, icon: Icon }) => (
          <Button key={value} variant={activePlatform === value ? "default" : "ghost"} size="sm" className="gap-1.5 shrink-0" onClick={() => setActivePlatform(value)}>
            <Icon className="h-4 w-4" />{label}
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

        <TabsContent value="analytics" className="space-y-6">
          {postsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
            </div>
          ) : (
            <>
              <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <motion.div variants={item}><StatCard title="Total Reach" value={totalReach} icon={Eye} /></motion.div>
                <motion.div variants={item}><StatCard title="Avg Engagement" value={avgEngagement} format="percent" icon={Heart} /></motion.div>
                <motion.div variants={item}><StatCard title="Click-throughs" value={totalClicks} icon={MousePointerClick} /></motion.div>
                <motion.div variants={item}><StatCard title="Donation Referrals" value={totalReferrals} icon={DollarSign} /></motion.div>
              </motion.div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Engagement Over Time</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={engagementOverTime}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} label={{ value: "Date", position: "insideBottom", offset: -5, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} label={{ value: "Engagement Rate", angle: -90, position: "insideLeft", offset: 10, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }} />
                        <Line type="monotone" dataKey="engagement" stroke="var(--color-primary)" strokeWidth={2} dot={{ r: 3 }} animationDuration={1000} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Content Type Performance</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={contentPerformance}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="type" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} angle={-20} textAnchor="end" height={60} label={{ value: "Content Type", position: "insideBottom", offset: -5, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} label={{ value: "Avg Engagement", angle: -90, position: "insideLeft", offset: 10, style: { fill: "var(--color-muted-foreground)", fontSize: 12 } }} />
                        <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }} />
                        <Bar dataKey="avgEngagement" fill="var(--color-primary)" radius={[4, 4, 0, 0]} animationDuration={800} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="compose">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader><CardTitle className="text-lg">Create Post</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={onCompose} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Platforms</Label>
                      <div className="flex flex-wrap gap-2">
                        {["Facebook", "Instagram", "Twitter", "LinkedIn", "TikTok", "YouTube"].map((p) => (
                          <Badge
                            key={p}
                            variant={selectedPlatforms.includes(p) ? "default" : "outline"}
                            className="cursor-pointer hover:bg-primary/10 transition-colors"
                            onClick={() => togglePlatform(p)}
                          >
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Caption</Label>
                      <Textarea {...form.register("Caption")} placeholder="Write your caption here..." rows={5} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Content Topic</Label>
                        <Select value={form.watch("ContentTopic") ?? ""} onValueChange={(v) => form.setValue("ContentTopic", v)}>
                          <SelectTrigger><SelectValue placeholder="Select topic" /></SelectTrigger>
                          <SelectContent>
                            {["Education", "Health", "Reintegration", "DonorImpact", "SafehouseLife", "Gratitude", "AwarenessRaising"].map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Call to Action</Label>
                        <Select value={form.watch("CallToActionType") ?? ""} onValueChange={(v) => form.setValue("CallToActionType", v)}>
                          <SelectTrigger><SelectValue placeholder="Select CTA" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DonateNow">Donate Now</SelectItem>
                            <SelectItem value="LearnMore">Learn More</SelectItem>
                            <SelectItem value="ShareStory">Share Story</SelectItem>
                            <SelectItem value="SignUp">Sign Up</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" />Hashtags</Label>
                      <Input {...form.register("Hashtags")} placeholder="#PharosHope #ProtectChildren" />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Schedule</Label>
                      <Input type="datetime-local" {...form.register("ScheduledTime")} />
                    </div>
                    <div className="flex gap-3">
                      <Button type="submit" className="flex-1 gap-2" disabled={composePost.isPending}>
                        <Send className="h-4 w-4" />{composePost.isPending ? "Posting..." : "Schedule Post"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="rounded-lg bg-primary/5 p-3">
                    <p className="font-medium text-primary">Best Time to Post</p>
                    <p className="text-muted-foreground">
                      {mlRecs?.best_post_time ? `${mlRecs.best_post_time.day} ${mlRecs.best_post_time.hour}:00` : "Wednesday 10:00 AM"} — higher engagement
                    </p>
                  </div>
                  <div className="rounded-lg bg-success/5 p-3">
                    <p className="font-medium text-success">Recommended Content</p>
                    <p className="text-muted-foreground">
                      {mlRecs?.recommended_content_type ?? "ImpactStory"} posts drive more donations
                    </p>
                  </div>
                  {mlRecs?.campaign_insights?.map((insight, i) => (
                    <div key={i} className="rounded-lg bg-accent/5 p-3">
                      <p className="text-muted-foreground">{insight}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />Comments Inbox
                <Badge variant="secondary" className="ml-2">{comments.filter((c) => !c.is_read).length} unread</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No comments yet</p>
              ) : (
                <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                  {comments.map((comment) => {
                    const PlatformIcon = platforms.find((p) => p.value === comment.platform)?.icon || MessageCircle;
                    return (
                      <motion.div
                        key={comment.comment_id}
                        variants={item}
                        className={cn("flex gap-3 rounded-lg border p-4 transition-colors", !comment.is_read && "bg-primary/5 border-primary/20")}
                      >
                        <PlatformIcon className="h-4 w-4 mt-1 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{comment.commenter_name}</span>
                            <Badge variant="outline" className="text-xs">{comment.platform}</Badge>
                            <span className="text-xs text-muted-foreground ml-auto">{formatSafe(comment.timestamp, "MMM d, h:mm a")}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{comment.comment_text}</p>
                          <div className="mt-2 flex gap-2">
                            <Input
                              placeholder="Reply..."
                              className="h-8 text-sm"
                              value={replyTexts[comment.comment_id] || ""}
                              onChange={(e) => setReplyTexts((prev) => ({ ...prev, [comment.comment_id]: e.target.value }))}
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={replyToComment.isPending}
                              onClick={async () => {
                                const text = replyTexts[comment.comment_id];
                                if (!text) return;
                                try {
                                  await replyToComment.mutateAsync({ commentId: comment.comment_id, reply: text, platform: comment.platform });
                                  toast.success("Reply sent!");
                                  setReplyTexts((prev) => ({ ...prev, [comment.comment_id]: "" }));
                                } catch { /* handled */ }
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

        <TabsContent value="recommendations">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <Sparkles className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-lg font-semibold">Best Time to Post</h3>
                <p className="text-muted-foreground text-sm mt-1">Based on historical engagement patterns</p>
                <div className="mt-4 rounded-lg bg-primary/5 p-4">
                  <p className="text-2xl font-bold">
                    {mlRecs?.best_post_time ? `${mlRecs.best_post_time.day}, ${mlRecs.best_post_time.hour}:00` : "Loading..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Predicted engagement rate: {mlRecs?.predicted_engagement_rate ? `${mlRecs.predicted_engagement_rate}%` : "—"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <TrendingUp className="h-8 w-8 text-success mb-3" />
                <h3 className="text-lg font-semibold">Content That Drives Donations</h3>
                <p className="text-muted-foreground text-sm mt-1">From social media optimizer model</p>
                <ul className="mt-4 space-y-2 text-sm">
                  {(mlRecs?.campaign_insights ?? ["Impact Stories drive +45% donations", "Video content boosts +28% engagement", "Posts with CTA increase +23% click-throughs"]).map((insight, i) => (
                    <li key={i} className="text-muted-foreground">{insight}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
