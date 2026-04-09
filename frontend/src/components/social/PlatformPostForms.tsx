import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Globe,
  Camera,
  MessageSquare,
  Play,
  Briefcase,
  Send,
  Loader2,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import type { UseMutationResult } from "@tanstack/react-query";
import type { Platform } from "@/types";
import { MediaDropZone } from "./MediaDropZone";

const CONTENT_TOPICS = [
  "Education",
  "Health",
  "Reintegration",
  "DonorImpact",
  "SafehouseLife",
  "EventRecap",
  "CampaignLaunch",
  "Gratitude",
  "AwarenessRaising",
] as const;

const CTA_OPTIONS = [
  { value: "DonateNow", label: "Donate Now" },
  { value: "LearnMore", label: "Learn More" },
  { value: "ShareStory", label: "Share Story" },
  { value: "SignUp", label: "Sign Up" },
] as const;

interface PostFormProps {
  composePost: UseMutationResult<unknown, Error, Record<string, unknown>>;
  onSuccess?: () => void;
}

function CharCounter({
  current,
  max,
}: {
  current: number;
  max: number;
}) {
  const over = current > max;
  return (
    <span
      className={`text-xs tabular-nums ${over ? "text-destructive font-medium" : "text-muted-foreground"}`}
    >
      {current.toLocaleString()}/{max.toLocaleString()}
    </span>
  );
}

function PlatformNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted/60 p-3">
      <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <p className="text-xs text-muted-foreground leading-relaxed">
        {children}
      </p>
    </div>
  );
}

function TopicSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Content Topic</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger>
          <SelectValue placeholder="Select topic" />
        </SelectTrigger>
        <SelectContent>
          {CONTENT_TOPICS.map((t) => (
            <SelectItem key={t} value={t}>
              {t.replace(/([A-Z])/g, " $1").trim()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function CtaSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Call to Action</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger>
          <SelectValue placeholder="Select CTA" />
        </SelectTrigger>
        <SelectContent>
          {CTA_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Facebook ──────────────────────────────────────────────────

export function FacebookPostForm({ composePost, onSuccess }: PostFormProps) {
  const [caption, setCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [contentTopic, setContentTopic] = useState("");
  const [cta, setCta] = useState("");
  const [schedule, setSchedule] = useState(false);
  const [scheduledTime, setScheduledTime] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) {
      toast.error("Caption is required");
      return;
    }
    await composePost.mutateAsync({
      Platforms: ["Facebook"],
      PostType: "Campaign",
      Caption: caption,
      LinkUrl: linkUrl || undefined,
      PhotoUrl: photoUrl || undefined,
      ContentTopic: contentTopic || undefined,
      CallToActionType: cta || undefined,
      ScheduledTime: schedule ? scheduledTime : undefined,
    });
    toast.success("Post published to Facebook!");
    setCaption("");
    setLinkUrl("");
    setPhotoUrl("");
    setContentTopic("");
    setCta("");
    setSchedule(false);
    setScheduledTime("");
    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="h-5 w-5 text-blue-600" />
          Post to Facebook
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PlatformNote>
            Posts to your connected Facebook Page via the Graph API.
          </PlatformNote>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Message</Label>
              <CharCounter current={caption.length} max={63206} />
            </div>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="What's on your mind?"
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label>Link URL (optional)</Label>
            <Input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <MediaDropZone
            value={photoUrl}
            onChange={setPhotoUrl}
            accept="image/*"
            label="Photo (optional)"
          />

          <div className="grid grid-cols-2 gap-4">
            <TopicSelect value={contentTopic} onChange={setContentTopic} />
            <CtaSelect value={cta} onChange={setCta} />
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={schedule} onCheckedChange={setSchedule} />
            <Label>Schedule for later</Label>
          </div>
          {schedule && (
            <Input
              type="datetime-local"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          )}

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={composePost.isPending || !caption.trim()}
          >
            {composePost.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {schedule ? "Schedule Post" : "Post Now"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Instagram ─────────────────────────────────────────────────

export function InstagramPostForm({ composePost, onSuccess }: PostFormProps) {
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("Image");
  const [altText, setAltText] = useState("");
  const [contentTopic, setContentTopic] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl.trim()) {
      toast.error("Media URL is required for Instagram");
      return;
    }
    await composePost.mutateAsync({
      Platforms: ["Instagram"],
      PostType: "Campaign",
      Caption: caption,
      MediaUrl: mediaUrl,
      MediaType: mediaType,
      AltText: altText || undefined,
      ContentTopic: contentTopic || undefined,
    });
    toast.success("Published to Instagram!");
    setCaption("");
    setMediaUrl("");
    setMediaType("Image");
    setAltText("");
    setContentTopic("");
    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5 text-pink-600" />
          Post to Instagram
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PlatformNote>
            Instagram requires a photo or video with every post. Drop your media below.
          </PlatformNote>

          <MediaDropZone
            value={mediaUrl}
            onChange={setMediaUrl}
            label="Media"
            required
          />

          <div className="space-y-2">
            <Label>Media Type</Label>
            <Select value={mediaType} onValueChange={(v) => setMediaType(v ?? "Image")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Image", "Video", "Reel", "Carousel"].map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Caption</Label>
              <CharCounter current={caption.length} max={2200} />
            </div>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write your caption..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Alt Text (optional)</Label>
            <Input
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Describe the image for accessibility"
            />
          </div>

          <TopicSelect value={contentTopic} onChange={setContentTopic} />

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={composePost.isPending || !mediaUrl.trim()}
          >
            {composePost.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publish
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Twitter/X ─────────────────────────────────────────────────

export function TwitterPostForm({ composePost, onSuccess }: PostFormProps) {
  const [text, setText] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [contentTopic, setContentTopic] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error("Tweet text is required");
      return;
    }
    if (text.length > 280) {
      toast.error("Tweet exceeds 280 characters");
      return;
    }
    await composePost.mutateAsync({
      Platforms: ["Twitter"],
      PostType: "Campaign",
      Caption: text,
      MediaUrl: mediaUrl || undefined,
      ContentTopic: contentTopic || undefined,
    });
    toast.success("Tweet posted!");
    setText("");
    setMediaUrl("");
    setContentTopic("");
    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-sky-500" />
          Post to X (Twitter)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PlatformNote>
            Posts as a tweet from your connected X account.
          </PlatformNote>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Tweet</Label>
              <CharCounter current={text.length} max={280} />
            </div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's happening?"
              rows={4}
              className={text.length > 280 ? "border-destructive" : ""}
            />
          </div>

          <MediaDropZone
            value={mediaUrl}
            onChange={setMediaUrl}
            label="Media (optional)"
          />

          <TopicSelect value={contentTopic} onChange={setContentTopic} />

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={
              composePost.isPending || !text.trim() || text.length > 280
            }
          >
            {composePost.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Tweet
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── LinkedIn ──────────────────────────────────────────────────

export function LinkedInPostForm({ composePost, onSuccess }: PostFormProps) {
  const [commentary, setCommentary] = useState("");
  const [mediaCategory, setMediaCategory] = useState("None");
  const [articleUrl, setArticleUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [contentTopic, setContentTopic] = useState("");
  const [visibility, setVisibility] = useState("Public");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentary.trim()) {
      toast.error("Commentary text is required");
      return;
    }
    await composePost.mutateAsync({
      Platforms: ["LinkedIn"],
      PostType: "Campaign",
      Caption: commentary,
      MediaCategory: mediaCategory,
      ArticleUrl: mediaCategory === "Article" ? articleUrl : undefined,
      ImageUrl: mediaCategory === "Image" ? imageUrl : undefined,
      ContentTopic: contentTopic || undefined,
      Visibility: visibility,
    });
    toast.success("Posted to LinkedIn!");
    setCommentary("");
    setMediaCategory("None");
    setArticleUrl("");
    setImageUrl("");
    setContentTopic("");
    setVisibility("Public");
    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Briefcase className="h-5 w-5 text-blue-700" />
          Post to LinkedIn
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PlatformNote>
            Posts to your LinkedIn organization page via the UGC Post API.
          </PlatformNote>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Commentary</Label>
              <CharCounter current={commentary.length} max={3000} />
            </div>
            <Textarea
              value={commentary}
              onChange={(e) => setCommentary(e.target.value)}
              placeholder="Share a professional update..."
              rows={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Media</Label>
              <Select value={mediaCategory} onValueChange={(v) => setMediaCategory(v ?? "None")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Article">Article (URL)</SelectItem>
                  <SelectItem value="Image">Image</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Visibility</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v ?? "Public")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Public</SelectItem>
                  <SelectItem value="ConnectionsOnly">
                    Connections Only
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {mediaCategory === "Article" && (
            <div className="space-y-2">
              <Label>Article URL</Label>
              <Input
                type="url"
                value={articleUrl}
                onChange={(e) => setArticleUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}

          {mediaCategory === "Image" && (
            <MediaDropZone
              value={imageUrl}
              onChange={setImageUrl}
              accept="image/*"
              label="Image"
            />
          )}

          <TopicSelect value={contentTopic} onChange={setContentTopic} />

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={composePost.isPending || !commentary.trim()}
          >
            {composePost.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publish
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── TikTok ────────────────────────────────────────────────────

export function TikTokPostForm({ composePost, onSuccess }: PostFormProps) {
  const [videoUrl, setVideoUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [privacy, setPrivacy] = useState("Public");
  const [allowComments, setAllowComments] = useState(true);
  const [allowDuet, setAllowDuet] = useState(true);
  const [allowStitch, setAllowStitch] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) {
      toast.error("Video URL is required for TikTok");
      return;
    }
    await composePost.mutateAsync({
      Platforms: ["TikTok"],
      PostType: "Campaign",
      VideoUrl: videoUrl,
      Caption: caption,
      PrivacyLevel: privacy,
      AllowComments: allowComments,
      AllowDuet: allowDuet,
      AllowStitch: allowStitch,
    });
    toast.success("Video published to TikTok!");
    setVideoUrl("");
    setCaption("");
    setPrivacy("Public");
    setAllowComments(true);
    setAllowDuet(true);
    setAllowStitch(true);
    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Play className="h-5 w-5" />
          Post to TikTok
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PlatformNote>
            TikTok only supports video content (MP4/H.264, up to 100 MB).
          </PlatformNote>

          <MediaDropZone
            value={videoUrl}
            onChange={setVideoUrl}
            accept="video/*"
            label="Video"
            required
          />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Caption</Label>
              <CharCounter current={caption.length} max={2200} />
            </div>
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Describe your video..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Privacy Level</Label>
            <Select value={privacy} onValueChange={(v) => setPrivacy(v ?? "Public")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Public">Public</SelectItem>
                <SelectItem value="Friends">Friends</SelectItem>
                <SelectItem value="SelfOnly">Self Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Interaction Settings</p>
            <div className="flex items-center justify-between">
              <Label className="font-normal">Allow Comments</Label>
              <Switch
                checked={allowComments}
                onCheckedChange={setAllowComments}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-normal">Allow Duet</Label>
              <Switch checked={allowDuet} onCheckedChange={setAllowDuet} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="font-normal">Allow Stitch</Label>
              <Switch
                checked={allowStitch}
                onCheckedChange={setAllowStitch}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={composePost.isPending || !videoUrl.trim()}
          >
            {composePost.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publish Video
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── YouTube ───────────────────────────────────────────────────

const YOUTUBE_CATEGORIES = [
  { value: "1", label: "Film & Animation" },
  { value: "2", label: "Autos & Vehicles" },
  { value: "22", label: "People & Blogs" },
  { value: "25", label: "News & Politics" },
  { value: "27", label: "Education" },
  { value: "29", label: "Nonprofits & Activism" },
] as const;

export function YouTubePostForm({ composePost, onSuccess }: PostFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("29");
  const [privacy, setPrivacy] = useState("Public");
  const [videoUrl, setVideoUrl] = useState("");
  const [notifySubs, setNotifySubs] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!videoUrl.trim()) {
      toast.error("Video URL is required for YouTube");
      return;
    }
    await composePost.mutateAsync({
      Platforms: ["YouTube"],
      PostType: "Campaign",
      Title: title,
      Caption: description,
      Tags: tags,
      CategoryId: category,
      Privacy: privacy,
      VideoUrl: videoUrl,
      NotifySubscribers: notifySubs,
    });
    toast.success("Video uploaded to YouTube!");
    setTitle("");
    setDescription("");
    setTags("");
    setCategory("29");
    setPrivacy("Public");
    setVideoUrl("");
    setNotifySubs(true);
    onSuccess?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Play className="h-5 w-5 text-red-600" />
          Upload to YouTube
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <PlatformNote>
            Upload a video to your YouTube channel.
          </PlatformNote>

          <MediaDropZone
            value={videoUrl}
            onChange={setVideoUrl}
            accept="video/*"
            label="Video"
            required
          />

          <div className="space-y-2">
            <Label>
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Video title"
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your video..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags (comma-separated)</Label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="nonprofit, children, Philippines"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "29")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YOUTUBE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Privacy</Label>
              <Select value={privacy} onValueChange={(v) => setPrivacy(v ?? "Public")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Public">Public</SelectItem>
                  <SelectItem value="Unlisted">Unlisted</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label className="font-normal">Notify Subscribers</Label>
            <Switch checked={notifySubs} onCheckedChange={setNotifySubs} />
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={
              composePost.isPending || !title.trim() || !videoUrl.trim()
            }
          >
            {composePost.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Upload Video
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Router ────────────────────────────────────────────────────

const PLATFORM_FORMS: Record<
  Platform,
  React.ComponentType<PostFormProps> | null
> = {
  Facebook: FacebookPostForm,
  Instagram: InstagramPostForm,
  Twitter: TwitterPostForm,
  LinkedIn: LinkedInPostForm,
  TikTok: TikTokPostForm,
  YouTube: YouTubePostForm,
  WhatsApp: null,
};

export function PlatformPostRouter({
  platform,
  composePost,
  onSuccess,
}: {
  platform: Platform | "All";
  composePost: UseMutationResult<unknown, Error, Record<string, unknown>>;
  onSuccess?: () => void;
}) {
  if (platform === "All") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Send className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Select a Platform</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Choose a specific platform from the tabs above to create a post.
            Each platform has unique posting capabilities and requirements.
          </p>
        </CardContent>
      </Card>
    );
  }

  const FormComponent = PLATFORM_FORMS[platform];

  if (!FormComponent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Posting is not available for {platform}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return <FormComponent composePost={composePost} onSuccess={onSuccess} />;
}
