import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Cookie, Shield } from "lucide-react";

const COOKIE_NAME = "pharos_cookie_consent";

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  preferences: boolean;
}

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : undefined;
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    preferences: false,
  });

  useEffect(() => {
    const consent = getCookie(COOKIE_NAME);
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(consent) as CookiePreferences;
        setPreferences(parsed);
        applyPreferences(parsed);
      } catch {
        setVisible(true);
      }
    }
  }, []);

  function applyPreferences(prefs: CookiePreferences) {
    if (!prefs.analytics) {
      // Remove analytics cookies if they exist
      deleteCookie("_ga");
      deleteCookie("_gid");
    }
    if (!prefs.preferences) {
      // Don't remove theme cookie — that's essential-adjacent
    }
  }

  function saveConsent(prefs: CookiePreferences) {
    setCookie(COOKIE_NAME, JSON.stringify(prefs));
    setPreferences(prefs);
    applyPreferences(prefs);
    setVisible(false);
    setManageOpen(false);
  }

  function acceptAll() {
    saveConsent({ essential: true, analytics: true, preferences: true });
  }

  function rejectAll() {
    saveConsent({ essential: true, analytics: false, preferences: false });
  }

  function saveManaged() {
    saveConsent(preferences);
  }

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-md p-4 shadow-lg"
          >
            <div className="mx-auto max-w-5xl flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">We use cookies</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We use cookies to improve your experience, analyze site
                    traffic, and personalize content.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={rejectAll}>
                  Reject
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setManageOpen(true)}
                >
                  Manage
                </Button>
                <Button size="sm" onClick={acceptAll}>
                  Accept All
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet open={manageOpen} onOpenChange={setManageOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Cookie Preferences
            </SheetTitle>
            <SheetDescription>
              Manage which cookies you allow. Essential cookies are always
              required for the site to function.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            {/* Essential */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Essential Cookies</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Required for the website to function. Cannot be disabled.
                </p>
              </div>
              <Switch checked disabled />
            </div>
            <Separator />

            {/* Analytics */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Analytics Cookies</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Help us understand how visitors interact with the website.
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences((p) => ({ ...p, analytics: checked }))
                }
              />
            </div>
            <Separator />

            {/* Preferences */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-medium">Preference Cookies</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Remember your settings and personalization choices.
                </p>
              </div>
              <Switch
                checked={preferences.preferences}
                onCheckedChange={(checked) =>
                  setPreferences((p) => ({ ...p, preferences: checked }))
                }
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={rejectAll}>
                Reject All
              </Button>
              <Button className="flex-1" onClick={saveManaged}>
                Save Preferences
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
