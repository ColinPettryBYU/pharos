import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/auth";
import { api, formatCurrency } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Heart, LogIn, UserPlus, Loader2, Check, Repeat, Gift } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRESET_AMOUNTS = [500, 1000, 5000, 10000];

type Frequency = "one-time" | "monthly" | "yearly";

const frequencyOptions: { value: Frequency; label: string; icon: typeof Gift }[] = [
  { value: "one-time", label: "One-time", icon: Gift },
  { value: "monthly", label: "Monthly", icon: Repeat },
  { value: "yearly", label: "Yearly", icon: Repeat },
];

export default function DonatePage() {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  const [amount, setAmount] = useState<number | null>(1000);
  const [customAmount, setCustomAmount] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [frequency, setFrequency] = useState<Frequency>("one-time");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [donated, setDonated] = useState(false);

  const effectiveAmount = isCustom ? Number(customAmount) || 0 : amount ?? 0;

  const handlePresetClick = (preset: number) => {
    setAmount(preset);
    setIsCustom(false);
    setCustomAmount("");
  };

  const handleCustomFocus = () => {
    setIsCustom(true);
    setAmount(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveAmount <= 0) {
      toast.error("Please enter a valid donation amount.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post("/donor/donate", {
        Amount: effectiveAmount,
        IsRecurring: frequency !== "one-time",
        Notes: message || null,
      });
      setDonated(true);
      toast.success("Thank you for your generous donation!");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full blur-[140px] opacity-20"
          style={{ background: "var(--pharos-blush)" }}
        />
        <div
          className="absolute bottom-0 -left-20 h-96 w-96 rounded-full blur-[120px] opacity-15"
          style={{ background: "var(--pharos-sage)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full blur-[180px] opacity-10"
          style={{ background: "var(--pharos-sky)" }}
        />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-16 sm:py-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 20 }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "linear-gradient(135deg, var(--pharos-blush), var(--pharos-sage))" }}
          >
            <Heart className="h-8 w-8 text-white" fill="white" />
          </motion.div>
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
            style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}
          >
            Make a Difference Today
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every peso brings safety, healing, and hope to girls recovering from abuse
            and trafficking in the Philippines. Your generosity lights the way.
          </p>
        </motion.div>

        {/* Impact stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="grid grid-cols-3 gap-4 mb-12 max-w-lg mx-auto"
        >
          {[
            { value: "9", label: "Safe Homes" },
            { value: "60+", label: "Girls Protected" },
            { value: "100%", label: "Goes to Care" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div
                className="text-2xl sm:text-3xl font-bold tabular-nums"
                style={{ color: "var(--pharos-forest)" }}
              >
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="max-w-xl mx-auto"
        >
          <Card className="border-border/60 shadow-xl overflow-hidden">
            <div
              className="h-1.5 w-full"
              style={{
                background:
                  "linear-gradient(to right, var(--pharos-forest), var(--pharos-sage), var(--pharos-blush))",
              }}
            />
            <CardContent className="p-6 sm:p-8">
              <AnimatePresence mode="wait">
                {!isLoggedIn ? (
                  /* ── Not logged in ── */
                  <motion.div
                    key="auth-prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-4"
                  >
                    <div
                      className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
                      style={{ background: "color-mix(in srgb, var(--pharos-sage) 18%, transparent)" }}
                    >
                      <LogIn className="h-6 w-6" style={{ color: "var(--pharos-forest)" }} />
                    </div>
                    <h2
                      className="text-xl font-semibold mb-2"
                      style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}
                    >
                      Sign in to donate
                    </h2>
                    <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                      Create a donor account or sign in to make a donation and track your impact over time.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link to="/login?redirect=/donate">
                        <Button
                          className="w-full sm:w-auto gap-2 font-semibold"
                          style={{ background: "var(--pharos-forest)", color: "white" }}
                        >
                          <LogIn className="h-4 w-4" />
                          Sign In
                        </Button>
                      </Link>
                      <Link to="/register?redirect=/donate">
                        <Button variant="outline" className="w-full sm:w-auto gap-2 font-semibold border-[var(--pharos-forest)]/30">
                          <UserPlus className="h-4 w-4" />
                          Create Account
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                ) : donated ? (
                  /* ── Success state ── */
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                      className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                      style={{ background: "var(--pharos-sage)" }}
                    >
                      <Check className="h-8 w-8 text-white" />
                    </motion.div>
                    <h2
                      className="text-2xl font-bold mb-2"
                      style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}
                    >
                      Thank you!
                    </h2>
                    <p className="text-muted-foreground mb-2">
                      Your donation of <strong>{formatCurrency(effectiveAmount)}</strong> has been recorded.
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Thank you for your generosity. Every contribution makes a difference.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Link to="/">
                        <Button style={{ background: "var(--pharos-forest)", color: "white" }}>
                          Back to Home
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDonated(false);
                          setAmount(1000);
                          setIsCustom(false);
                          setCustomAmount("");
                          setFrequency("one-time");
                          setMessage("");
                        }}
                      >
                        Donate Again
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  /* ── Donation form ── */
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    {/* Frequency toggle */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Donation type</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {frequencyOptions.map((opt) => {
                          const Icon = opt.icon;
                          const active = frequency === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setFrequency(opt.value)}
                              className={cn(
                                "relative flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                                active
                                  ? "border-[var(--pharos-forest)] text-[var(--pharos-forest)] bg-[var(--pharos-sage)]/10"
                                  : "border-border text-muted-foreground hover:border-[var(--pharos-sage)]/50"
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Amount selection */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Amount (PHP)</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        {PRESET_AMOUNTS.map((preset) => (
                          <motion.button
                            key={preset}
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => handlePresetClick(preset)}
                            className={cn(
                              "rounded-lg border px-3 py-3 text-sm font-semibold tabular-nums transition-all",
                              !isCustom && amount === preset
                                ? "border-[var(--pharos-forest)] text-[var(--pharos-forest)] bg-[var(--pharos-sage)]/10 shadow-sm"
                                : "border-border text-muted-foreground hover:border-[var(--pharos-sage)]/50"
                            )}
                          >
                            {formatCurrency(preset)}
                          </motion.button>
                        ))}
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                          ₱
                        </span>
                        <Input
                          type="number"
                          min={1}
                          step="0.01"
                          placeholder="Custom amount"
                          className={cn(
                            "pl-7 tabular-nums",
                            isCustom && "ring-2 ring-[var(--pharos-forest)]/30"
                          )}
                          value={customAmount}
                          onFocus={handleCustomFocus}
                          onChange={(e) => {
                            setCustomAmount(e.target.value);
                            setIsCustom(true);
                            setAmount(null);
                          }}
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <Label htmlFor="message" className="text-sm font-medium mb-2 block">
                        Message <span className="text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Leave an encouraging message..."
                        rows={3}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="resize-none"
                      />
                    </div>

                    {/* Summary */}
                    {effectiveAmount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="rounded-lg p-4"
                        style={{ background: "var(--pharos-sage)", opacity: 0.08 }}
                      >
                        <div
                          className="rounded-lg p-4 -m-4"
                          style={{ background: "var(--pharos-cream)" }}
                        >
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              {frequency === "one-time"
                                ? "One-time donation"
                                : frequency === "monthly"
                                  ? "Monthly donation"
                                  : "Yearly donation"}
                            </span>
                            <span
                              className="text-lg font-bold tabular-nums"
                              style={{ color: "var(--pharos-forest)" }}
                            >
                              {formatCurrency(effectiveAmount)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={isSubmitting || effectiveAmount <= 0}
                      className="w-full h-12 text-base font-semibold gap-2"
                      style={{ background: "var(--pharos-forest)", color: "white" }}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Heart className="h-5 w-5" />
                      )}
                      {isSubmitting ? "Processing..." : `Donate ${effectiveAmount > 0 ? formatCurrency(effectiveAmount) : ""}`}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      Pharos is a registered 501(c)(3) nonprofit. All donations are tax-deductible.
                    </p>
                  </motion.form>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
