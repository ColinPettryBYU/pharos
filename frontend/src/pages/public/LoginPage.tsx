import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import { Mail, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      const messages: Record<string, string> = {
        "google-failed": "Google sign-in failed. Please try again.",
        "google-not-configured": "Google sign-in is not available at this time.",
        "no-email": "Could not retrieve email from your Google account.",
        "creation-failed": "Failed to create account. Email may already be in use.",
      };
      toast.error(messages[error] || "Sign-in failed. Please try again.");
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast.success("Welcome back!");
      navigate(redirectTo || "/admin");
    } catch (error: unknown) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      const message =
        error instanceof Error ? error.message : "Invalid credentials";
      if (message === "MFA_REQUIRED") {
        toast.info("Please enter your MFA code");
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-y-auto px-4 py-8 sm:py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full blur-[120px]" style={{ background: "rgba(176,196,216,0.15)" }} />
        <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full blur-3xl" style={{ background: "rgba(245,184,184,0.12)" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full blur-[100px]" style={{ background: "rgba(176,196,216,0.08)" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md mx-auto"
      >
        <motion.div
          animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-border/60 shadow-xl overflow-hidden">
            {/* Colored top bar */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(to right, var(--pharos-sky), var(--pharos-blush), var(--pharos-sky))" }} />

            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-4">
                <img src="/images/pharos-logo-black.png" alt="Pharos" className="h-14 w-14 object-contain mx-auto dark:hidden" />
                <img src="/images/pharos-logo-white.png" alt="Pharos" className="h-14 w-14 object-contain mx-auto hidden dark:block" />
              </div>
              <CardTitle className="text-2xl font-bold" style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}>
                Welcome back
              </CardTitle>
              <CardDescription>Sign in to your Pharos account</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com" className="pl-9" {...register("email")} />
                  </div>
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="Enter your password" className="pl-9" {...register("password")} />
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                </div>
                <Button type="submit" className="w-full font-semibold" disabled={isLoading} style={{ background: "var(--pharos-forest)", color: "white" }}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>

              <div className="relative my-6">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">or</span>
              </div>

              <Button variant="outline" className="w-full border-border/60" onClick={loginWithGoogle}>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </Button>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link to={redirectTo ? `/register?redirect=${encodeURIComponent(redirectTo)}` : "/register"} className="font-medium hover:underline" style={{ color: "var(--pharos-forest)" }}>Create one</Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
