import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/shared/PageHeader";
import {
  useSocialAccounts,
  useConnectSocialAccount,
  useDisconnectSocialAccount,
  usePlatformStatus,
} from "@/hooks/useSocialMedia";
import {
  Globe,
  Camera,
  MessageSquare,
  Play,
  Briefcase,
  Link2Off,
  ExternalLink,
  CheckCircle2,
  Circle,
  Info,
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { toast } from "sonner";
import type { ConnectedAccount } from "@/types";

interface PlatformConfig {
  name: string;
  key: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  description: string;
  connectable: boolean;
}

const platformConfigs: PlatformConfig[] = [
  {
    name: "Facebook",
    key: "facebook",
    icon: Globe,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    description: "Post to Pages, read comments, manage engagement",
    connectable: true,
  },
  {
    name: "Instagram",
    key: "instagram",
    icon: Camera,
    color: "text-pink-600",
    bgColor: "bg-pink-50 dark:bg-pink-950/30",
    description: "Publish photos/reels, manage comments",
    connectable: true,
  },
  {
    name: "LinkedIn",
    key: "linkedin",
    icon: Briefcase,
    color: "text-blue-700",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    description: "Organization posts, professional engagement",
    connectable: true,
  },
  {
    name: "YouTube",
    key: "youtube",
    icon: Play,
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    description: "Video uploads, comment management",
    connectable: true,
  },
  {
    name: "TikTok",
    key: "tiktok",
    icon: Play,
    color: "text-foreground",
    bgColor: "bg-muted",
    description: "Video publishing via Content Posting API",
    connectable: true,
  },
  {
    name: "Twitter",
    key: "twitter",
    icon: MessageSquare,
    color: "text-sky-500",
    bgColor: "bg-sky-50 dark:bg-sky-950/30",
    description: "Tweet publishing (pay-per-use API)",
    connectable: true,
  },
  {
    name: "WhatsApp",
    key: "whatsapp",
    icon: MessageSquare,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    description: "Display only — historical analytics available",
    connectable: false,
  },
];

const platformSetupInstructions: Record<string, { envVars: string[]; steps: string[]; link: string; linkLabel: string }> = {
  facebook: {
    envVars: ["SocialMedia__Meta__AppId", "SocialMedia__Meta__AppSecret"],
    steps: [
      "Create a Business App at Meta for Developers",
      "Add Facebook Login product",
      "Set Valid OAuth Redirect URI to: {BACKEND_URL}/api/admin/social-media/accounts/facebook/callback",
      "Copy App ID and App Secret to environment variables",
    ],
    link: "https://developers.facebook.com/",
    linkLabel: "Meta for Developers",
  },
  instagram: {
    envVars: ["SocialMedia__Meta__AppId", "SocialMedia__Meta__AppSecret"],
    steps: [
      "Uses the same Meta App as Facebook",
      "Ensure instagram_basic and instagram_content_publish scopes are enabled",
      "Connect a Facebook Page with a linked Instagram Business Account",
    ],
    link: "https://developers.facebook.com/",
    linkLabel: "Meta for Developers",
  },
  linkedin: {
    envVars: ["SocialMedia__LinkedIn__ClientId", "SocialMedia__LinkedIn__ClientSecret"],
    steps: [
      "Create an App at LinkedIn Developer Portal",
      "Verify your company page",
      'Add "Community Management API" product',
      "Set Redirect URL to: {BACKEND_URL}/api/admin/social-media/accounts/linkedin/callback",
    ],
    link: "https://www.linkedin.com/developers/",
    linkLabel: "LinkedIn Developer Portal",
  },
  youtube: {
    envVars: ["SocialMedia__Google__ClientId", "SocialMedia__Google__ClientSecret"],
    steps: [
      "Create a project in Google Cloud Console",
      "Enable YouTube Data API v3",
      "Create OAuth 2.0 credentials (Web application)",
      "Add Redirect URI: {BACKEND_URL}/api/admin/social-media/accounts/youtube/callback",
    ],
    link: "https://console.cloud.google.com/",
    linkLabel: "Google Cloud Console",
  },
  tiktok: {
    envVars: ["SocialMedia__TikTok__ClientKey", "SocialMedia__TikTok__ClientSecret"],
    steps: [
      "Create an App at TikTok for Developers",
      "Apply for Content Posting API access",
      "Set Redirect URI: {BACKEND_URL}/api/admin/social-media/accounts/tiktok/callback",
    ],
    link: "https://developers.tiktok.com/",
    linkLabel: "TikTok for Developers",
  },
  twitter: {
    envVars: ["SocialMedia__Twitter__ClientId", "SocialMedia__Twitter__ClientSecret"],
    steps: [
      "Create a Project + App at X Developer Portal",
      "Enable OAuth 2.0 (User Authentication)",
      "Set Redirect URI: {BACKEND_URL}/api/admin/social-media/accounts/twitter/callback",
      'Select "Read and Write" permissions',
    ],
    link: "https://developer.twitter.com/",
    linkLabel: "X Developer Portal",
  },
};

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = parseISO(value);
  return isValid(d) ? format(d, "MMM d, yyyy") : "—";
}

function SetupGuide({ platformKey }: { platformKey: string }) {
  const [open, setOpen] = useState(false);
  const instructions = platformSetupInstructions[platformKey];
  if (!instructions) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        Setup Guide
      </button>
      {open && (
        <div className="mt-2 space-y-2 rounded-lg bg-muted/50 p-3 text-xs">
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            {instructions.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <div className="pt-1 border-t border-border/50">
            <p className="font-medium text-muted-foreground">Environment variables needed:</p>
            <ul className="mt-1 space-y-0.5">
              {instructions.envVars.map((v) => (
                <li key={v}>
                  <code className="rounded bg-muted px-1 py-0.5 text-[11px]">{v}</code>
                </li>
              ))}
            </ul>
          </div>
          <a
            href={instructions.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline pt-1"
          >
            <ExternalLink className="h-3 w-3" />
            {instructions.linkLabel}
          </a>
        </div>
      )}
    </div>
  );
}

export default function SocialAccountsPage() {
  const [searchParams] = useSearchParams();
  const [disconnectTarget, setDisconnectTarget] = useState<string | null>(null);

  const { data: accounts, isLoading, isError: isAccountsError, refetch: refetchAccounts } = useSocialAccounts();
  const { data: platformStatus } = usePlatformStatus();
  const connectMutation = useConnectSocialAccount();
  const disconnectMutation = useDisconnectSocialAccount();

  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected) {
      toast.success(`${connected} connected successfully!`);
    }
    if (error) {
      toast.error(`Connection failed: ${error}`);
    }
  }, [searchParams]);

  const getAccountForPlatform = (platformName: string): ConnectedAccount | undefined =>
    accounts?.find(
      (a) => a.platform.toLowerCase() === platformName.toLowerCase() && a.status === "Active"
    );

  const isPlatformConfigured = (platformKey: string): boolean => {
    if (!platformStatus) return true;
    return platformStatus[platformKey] ?? false;
  };

  const handleConnect = (platform: string) => {
    connectMutation.mutate(platform, {
      onError: (error) => {
        const message = error instanceof Error
          ? error.message
          : "Failed to initiate connection. API keys may not be configured.";
        toast.error(message);
      },
    });
  };

  const handleDisconnect = () => {
    if (!disconnectTarget) return;
    disconnectMutation.mutate(disconnectTarget, {
      onSuccess: () => {
        toast.success(`${disconnectTarget} disconnected.`);
        setDisconnectTarget(null);
      },
      onError: () => {
        toast.error(`Failed to disconnect ${disconnectTarget}.`);
        setDisconnectTarget(null);
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Connected Accounts"
        description="Manage your social media platform connections for the Command Center."
        breadcrumbs={[
          { label: "Dashboard", href: "/admin" },
          { label: "Social Media", href: "/admin/social" },
          { label: "Connected Accounts" },
        ]}
      />

      {isAccountsError ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive mb-3" />
          <h3 className="font-semibold text-lg">Failed to load accounts</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            Could not fetch connected accounts. The server may be unavailable.
          </p>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => refetchAccounts()}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {platformConfigs.map((platform) => {
            const account = getAccountForPlatform(platform.name);
            const isConnected = !!account;
            const configured = isPlatformConfigured(platform.key);
            const Icon = platform.icon;

            return (
              <motion.div key={platform.key} variants={item}>
                <Card className="relative overflow-hidden transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${platform.bgColor}`}
                        >
                          <Icon className={`h-5 w-5 ${platform.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{platform.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {platform.description}
                          </p>
                        </div>
                      </div>
                      {isConnected ? (
                        <Badge
                          variant="default"
                          className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Connected
                        </Badge>
                      ) : !platform.connectable ? (
                        <Badge
                          variant="secondary"
                          className="gap-1 text-muted-foreground"
                        >
                          <Info className="h-3 w-3" />
                          Display Only
                        </Badge>
                      ) : !configured ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Not Configured
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Circle className="h-3 w-3" />
                          Not Connected
                        </Badge>
                      )}
                    </div>

                    {isConnected && account && (
                      <div className="mt-4 space-y-2 rounded-lg bg-muted/50 p-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Account</span>
                          <span className="font-medium">{account.account_name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Connected</span>
                          <span className="text-muted-foreground">
                            {formatDate(account.connected_at)}
                          </span>
                        </div>
                        {account.token_expires_at && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Token Expires
                            </span>
                            <span className="text-muted-foreground">
                              {formatDate(account.token_expires_at)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {!isConnected && platform.connectable && !configured && (
                      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-800 dark:text-amber-300">
                            API keys not configured. Add the required environment variables to enable this platform.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      {isConnected ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/5"
                          onClick={() => setDisconnectTarget(platform.name)}
                          disabled={disconnectMutation.isPending}
                        >
                          <Link2Off className="h-4 w-4" />
                          Disconnect
                        </Button>
                      ) : platform.connectable && configured ? (
                        <Button
                          variant="default"
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => handleConnect(platform.key)}
                          disabled={connectMutation.isPending}
                        >
                          {connectMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <ExternalLink className="h-4 w-4" />
                          )}
                          Connect {platform.name}
                        </Button>
                      ) : platform.connectable && !configured ? (
                        <SetupGuide platformKey={platform.key} />
                      ) : (
                        <p className="text-center text-xs text-muted-foreground">
                          Analytics available from imported data
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <AlertDialog
        open={!!disconnectTarget}
        onOpenChange={(open) => !open && setDisconnectTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect {disconnectTarget}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the connection to your {disconnectTarget} account.
              You will no longer be able to post or read comments from this
              platform until you reconnect.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisconnect}
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={disconnectMutation.isPending}
            >
              {disconnectMutation.isPending ? "Disconnecting..." : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
