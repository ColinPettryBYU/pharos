import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  useSavePlatformCredentials,
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
  KeyRound,
  Save,
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

const platformCredentialLabels: Record<
  string,
  { idLabel: string; secretLabel: string; link: string; linkLabel: string; steps: string[] }
> = {
  facebook: {
    idLabel: "Meta App ID",
    secretLabel: "Meta App Secret",
    link: "https://developers.facebook.com/",
    linkLabel: "Meta for Developers",
    steps: [
      "Create a Meta Business App",
      "Add Facebook Login product",
      "Set redirect URI to your callback URL",
      "Copy App ID and App Secret",
    ],
  },
  instagram: {
    idLabel: "Meta App ID",
    secretLabel: "Meta App Secret",
    link: "https://developers.facebook.com/",
    linkLabel: "Meta for Developers",
    steps: [
      "Uses the same Meta App as Facebook",
      "Enable instagram_basic and instagram_content_publish scopes",
      "Connect an Instagram Business account to your Facebook Page",
    ],
  },
  linkedin: {
    idLabel: "Client ID",
    secretLabel: "Client Secret",
    link: "https://www.linkedin.com/developers/",
    linkLabel: "LinkedIn Developer Portal",
    steps: [
      "Create App at LinkedIn Developer Portal",
      "Add Community Management API product",
      "Set redirect URL to your callback URL",
      "Copy Client ID and Client Secret",
    ],
  },
  youtube: {
    idLabel: "Google Client ID",
    secretLabel: "Google Client Secret",
    link: "https://console.cloud.google.com/",
    linkLabel: "Google Cloud Console",
    steps: [
      "Create a project in Google Cloud Console",
      "Enable YouTube Data API v3",
      "Create OAuth 2.0 credentials",
      "Set authorized redirect URI",
    ],
  },
  tiktok: {
    idLabel: "Client Key",
    secretLabel: "Client Secret",
    link: "https://developers.tiktok.com/",
    linkLabel: "TikTok for Developers",
    steps: [
      "Register at TikTok for Developers",
      "Apply for Content Posting API access",
      "Set redirect URI to your callback URL",
      "Copy Client Key and Client Secret",
    ],
  },
  twitter: {
    idLabel: "Client ID",
    secretLabel: "Client Secret",
    link: "https://developer.twitter.com/",
    linkLabel: "X Developer Portal",
    steps: [
      "Create Project + App at X Developer Portal",
      "Enable OAuth 2.0 User Authentication",
      "Set redirect URI to your callback URL",
      "Select Read and Write permissions",
    ],
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

function CredentialForm({
  platformKey,
  onSaved,
}: {
  platformKey: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const saveMutation = useSavePlatformCredentials();
  const labels = platformCredentialLabels[platformKey];
  if (!labels) return null;

  const handleSave = () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error("Both fields are required.");
      return;
    }
    saveMutation.mutate(
      { platform: platformKey, clientId: clientId.trim(), clientSecret: clientSecret.trim() },
      {
        onSuccess: () => {
          toast.success(`Credentials saved for ${platformKey}.`);
          setClientId("");
          setClientSecret("");
          setOpen(false);
          onSaved();
        },
        onError: () => {
          toast.error("Failed to save credentials.");
        },
      }
    );
  };

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <KeyRound className="h-3.5 w-3.5" />
        Configure API Credentials
      </button>
      {open && (
        <div className="mt-2 space-y-3 rounded-lg bg-muted/50 p-3">
          {labels.steps.length > 0 && (
            <ol className="space-y-1 text-xs text-muted-foreground list-decimal list-inside">
              {labels.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          )}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{labels.idLabel}</label>
            <Input
              type="text"
              placeholder={labels.idLabel}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">{labels.secretLabel}</label>
            <Input
              type="password"
              placeholder={labels.secretLabel}
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-center justify-between pt-1">
            <a
              href={labels.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              {labels.linkLabel}
            </a>
            <Button
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Save Credentials
            </Button>
          </div>
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
                          <KeyRound className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-amber-800 dark:text-amber-300">
                            API credentials not configured. Enter your app credentials below to enable this platform.
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
                        <div className="space-y-2">
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
                          <CredentialForm
                            platformKey={platform.key}
                            onSaved={() => refetchAccounts()}
                          />
                        </div>
                      ) : platform.connectable && !configured ? (
                        <CredentialForm
                          platformKey={platform.key}
                          onSaved={() => refetchAccounts()}
                        />
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
