import { useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatCard } from "@/components/shared/StatCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { mockSocialMediaPosts, mockSocialComments } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, LineChart, Line, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Globe, Camera, MessageSquare, Play, Briefcase,
  Send, Upload, Hash, Calendar, Sparkles, MessageCircle,
  Eye, MousePointerClick, Heart, TrendingUp, DollarSign,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Platform } from "@/types";
import type { ReactElement } from "react";

const platforms: { value: Platform | "All"; label: string; icon: React.ElementType }[] = [
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
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function SocialMediaPage() {
  const [activePlatform, setActivePlatform] = useState<Platform | "All">("All");
  const [activeTab, setActiveTab] = useState("analytics");

  const filteredPosts =
    activePlatform === "All"
      ? mockSocialMediaPosts
      : mockSocialMediaPosts.filter((p) => p.platform === activePlatform);

  const totalReach = filteredPosts.reduce((s, p) => s + p.reach, 0);
  const avgEngagement = filteredPosts.length > 0 ? filteredPosts.reduce((s, p) => s + p.engagement_rate, 0) / filteredPosts.length : 0;
  const totalClicks = filteredPosts.reduce((s, p) => s + p.click_throughs, 0);
  const totalReferrals = filteredPosts.reduce((s, p) => s + p.donation_referrals, 0);

  // Content type performance
  const contentPerformance = Object.entries(
    filteredPosts.reduce<Record<string, { count: number; engagement: number }>>((acc, p) => {
      if (!acc[p.post_type]) acc[p.post_type] = { count: 0, engagement: 0 };
      acc[p.post_type].count++;
      acc[p.post_type].engagement += p.engagement_rate;
      return acc;
    }, {})
  ).map(([type, data]) => ({ type, avgEngagement: +(data.engagement / data.count).toFixed(2) }));

  // Engagement over time
  const engagementOverTime = filteredPosts
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((p) => ({ date: format(new Date(p.created_at), "MMM d"), engagement: p.engagement_rate, reach: p.reach }));

  // Scatter: engagement vs donation referrals
  const scatterData = filteredPosts.map((p) => ({ engagement: p.engagement_rate, referrals: p.donation_referrals, name: p.post_type }));

  // Heatmap data
  const heatmapData: { day: string; hour: number; value: number }[] = [];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  days.forEach((day) => {
    for (let hour = 6; hour <= 22; hour++) {
      const matching = filteredPosts.filter((p) => p.day_of_week.startsWith(day) && p.post_hour === hour);
      const avgEng = matching.length > 0 ? matching.reduce((s, p) => s + p.engagement_rate, 0) / matching.length : 0;
      heatmapData.push({ day, hour, value: +avgEng.toFixed(2) });
    }
  });

  const filteredComments =
    activePlatform === "All"
      ? mockSocialComments
      : mockSocialComments.filter((c) => c.platform === activePlatform);

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

      {/* Platform Tabs */}
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
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="comments">Comments Inbox</TabsTrigger>
          <TabsTrigger value="recommendations">ML Insights</TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
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
                    <XAxis dataKey="date" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                    <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
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
                    <XAxis dataKey="type" tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }} />
                    <Bar dataKey="avgEngagement" fill="var(--color-primary)" radius={[4, 4, 0, 0]} animationDuration={800} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Social → Donation Correlation</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="engagement" name="Engagement %" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                    <YAxis dataKey="referrals" name="Referrals" tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: "8px" }} />
                    <Scatter data={scatterData} fill="var(--color-primary)" animationDuration={1000}>
                      {scatterData.map((_, i) => <Cell key={i} fill={`var(--color-chart-${(i % 5) + 1})`} />)}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Posting Heatmap</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="grid gap-0.5" style={{ gridTemplateColumns: `60px repeat(17, 1fr)` }}>
                    <div />
                    {Array.from({ length: 17 }, (_, i) => (
                      <div key={i} className="text-center text-[10px] text-muted-foreground">{i + 6}</div>
                    ))}
                    {days.map((day) => (
                      <>
                        <div key={day} className="text-xs text-muted-foreground flex items-center">{day}</div>
                        {Array.from({ length: 17 }, (_, i) => {
                          const cell = heatmapData.find((h) => h.day === day && h.hour === i + 6);
                          const intensity = Math.min((cell?.value ?? 0) / 10, 1);
                          return (
                            <div
                              key={`${day}-${i}`}
                              className="aspect-square rounded-sm"
                              style={{ backgroundColor: `oklch(0.535 ${0.15 * intensity} 250 / ${0.1 + intensity * 0.8})` }}
                              title={`${day} ${i + 6}:00 — ${cell?.value ?? 0}% engagement`}
                            />
                          );
                        })}
                      </>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compose Tab */}
        <TabsContent value="compose">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader><CardTitle className="text-lg">Compose Post</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Platforms</Label>
                    <div className="flex flex-wrap gap-2">
                      {["Facebook", "Instagram", "Twitter", "LinkedIn", "TikTok", "YouTube"].map((p) => (
                        <Badge key={p} variant="outline" className="cursor-pointer hover:bg-primary/10 transition-colors">{p}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Caption</Label>
                    <Textarea placeholder="Write your caption here..." rows={5} />
                    <p className="text-xs text-muted-foreground text-right">0 / 2200 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Media</Label>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground hover:border-primary/50 transition-colors cursor-pointer">
                      <Upload className="mx-auto h-8 w-8 mb-2" />
                      <p className="text-sm">Drag & drop media here or click to upload</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Content Topic</Label>
                      <Select>
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
                      <Select>
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
                    <Input placeholder="#PharosHope #ProtectChildren" />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Schedule</Label>
                    <Input type="datetime-local" />
                  </div>
                  <div className="flex gap-3">
                    <Button className="flex-1 gap-2" onClick={() => toast.success("Post scheduled!")}>
                      <Send className="h-4 w-4" />
                      Schedule Post
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => toast.success("Post published!")}>
                      Post Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                    <p className="text-muted-foreground">Wednesday 10:00 AM — 2.3x higher engagement</p>
                  </div>
                  <div className="rounded-lg bg-success/5 p-3">
                    <p className="font-medium text-success">Recommended Content</p>
                    <p className="text-muted-foreground">Impact Story posts drive 45% more donations</p>
                  </div>
                  <div className="rounded-lg bg-accent/5 p-3">
                    <p className="font-medium text-accent-foreground">Platform Tip</p>
                    <p className="text-muted-foreground">Instagram Reels get 3x reach vs static photos</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Comments Inbox */}
        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Comments Inbox
                <Badge variant="secondary" className="ml-2">{filteredComments.filter((c) => !c.is_read).length} unread</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
                {filteredComments.map((comment) => {
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
                          <span className="text-xs text-muted-foreground ml-auto">{format(new Date(comment.timestamp), "MMM d, h:mm a")}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{comment.comment_text}</p>
                        <div className="mt-2 flex gap-2">
                          <Input placeholder="Reply..." className="h-8 text-sm" />
                          <Button size="sm" variant="outline" onClick={() => toast.success("Reply sent!")}>Reply</Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ML Recommendations */}
        <TabsContent value="recommendations">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="p-6">
                <Sparkles className="h-8 w-8 text-primary mb-3" />
                <h3 className="text-lg font-semibold">Best Time to Post</h3>
                <p className="text-muted-foreground text-sm mt-1">Based on historical engagement patterns</p>
                <div className="mt-4 rounded-lg bg-primary/5 p-4">
                  <p className="text-2xl font-bold">Wednesday, 10:00 AM</p>
                  <p className="text-sm text-muted-foreground">Predicted engagement rate: 6.8%</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <TrendingUp className="h-8 w-8 text-success mb-3" />
                <h3 className="text-lg font-semibold">Content That Drives Donations</h3>
                <p className="text-muted-foreground text-sm mt-1">From social media optimizer model</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex justify-between"><span>Impact Stories</span><span className="font-medium text-success">+45% donations</span></li>
                  <li className="flex justify-between"><span>Fundraising Appeals</span><span className="font-medium text-success">+32% donations</span></li>
                  <li className="flex justify-between"><span>Video content</span><span className="font-medium text-success">+28% engagement</span></li>
                  <li className="flex justify-between"><span>Posts with CTA</span><span className="font-medium text-success">+23% click-throughs</span></li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <DollarSign className="h-8 w-8 text-accent mb-3" />
                <h3 className="text-lg font-semibold">Campaign Insights</h3>
                <p className="text-muted-foreground text-sm mt-1">Which campaigns convert best</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex justify-between"><span>Year-End Hope</span><span className="font-medium">₱125,000 referred</span></li>
                  <li className="flex justify-between"><span>GivingTuesday</span><span className="font-medium">₱98,000 referred</span></li>
                  <li className="flex justify-between"><span>Back to School</span><span className="font-medium">₱67,000 referred</span></li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Eye className="h-8 w-8 text-chart-5 mb-3" />
                <h3 className="text-lg font-semibold">Platform Comparison</h3>
                <p className="text-muted-foreground text-sm mt-1">Where your audience is most active</p>
                <ul className="mt-4 space-y-2 text-sm">
                  <li className="flex justify-between"><span>Facebook</span><span className="font-medium">Highest reach</span></li>
                  <li className="flex justify-between"><span>Instagram</span><span className="font-medium">Best engagement</span></li>
                  <li className="flex justify-between"><span>LinkedIn</span><span className="font-medium">Most donations</span></li>
                  <li className="flex justify-between"><span>TikTok</span><span className="font-medium">Fastest growth</span></li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
