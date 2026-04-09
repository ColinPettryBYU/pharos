import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Sun, Moon, Menu, LogOut, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PageTransition } from "./PageTransition";

const navLinks = [
  { label: "Mission", href: "/#mission" },
  { label: "Impact", href: "/impact" },
  { label: "Privacy", href: "/privacy" },
];

function PharosLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const textSize = size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/images/pharos-logo.png"
        alt="Pharos"
        className={`${dims} object-contain`}
      />
      <span
        className={`${textSize} font-bold tracking-tight`}
        style={{ fontFamily: "var(--font-editorial)", color: "var(--pharos-forest)" }}
      >
        Pharos
      </span>
    </div>
  );
}

export function PublicLayout() {
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b border-[var(--pharos-sage)]/20 bg-[var(--pharos-cream)]/90 dark:bg-background/90 backdrop-blur-md shadow-sm"
      >
        <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}>
              <PharosLogo size="md" />
            </motion.div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm font-medium text-[var(--pharos-forest)] dark:text-foreground hover:bg-[var(--pharos-sage)]/10 hover:text-[var(--pharos-forest)]"
                >
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="text-[var(--pharos-forest)] dark:text-foreground"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <Link to={user.roles?.includes("Admin") ? "/admin" : "/donor/dashboard"}>
                    <Button
                      size="sm"
                      className="bg-[var(--pharos-forest)] hover:bg-[var(--pharos-sage)] text-white"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="gap-1.5 text-muted-foreground"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--pharos-forest)] dark:text-foreground"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button
                      size="sm"
                      className="bg-[var(--pharos-forest)] hover:bg-[var(--pharos-sage)] text-white"
                    >
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                className="md:hidden"
                render={
                  <Button variant="ghost" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                }
              />
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-4 mt-8">
                  <div className="mb-4">
                    <PharosLogo size="md" />
                  </div>
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="text-lg font-medium py-2 text-[var(--pharos-forest)] dark:text-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="border-t pt-4 space-y-2">
                    {user ? (
                      <>
                        <Link
                          to={user.roles?.includes("Admin") ? "/admin" : "/donor/dashboard"}
                          onClick={() => setMobileOpen(false)}
                        >
                          <Button className="w-full bg-[var(--pharos-forest)] hover:bg-[var(--pharos-sage)] text-white">
                            Dashboard
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="w-full gap-1.5"
                          onClick={() => { setMobileOpen(false); handleLogout(); }}
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Sign Out
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" onClick={() => setMobileOpen(false)}>
                          <Button variant="outline" className="w-full">Sign In</Button>
                        </Link>
                        <Link to="/register" onClick={() => setMobileOpen(false)}>
                          <Button className="w-full bg-[var(--pharos-forest)] hover:bg-[var(--pharos-sage)] text-white">
                            Get Started
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="flex-1">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>

      {/* Footer */}
      <footer className="relative overflow-hidden border-t border-[var(--pharos-sage)]/20">
        {/* Forest green top bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[var(--pharos-forest)] via-[var(--pharos-sage)] to-[var(--pharos-blush)]" />

        {/* Footer background with subtle green tint */}
        <div className="relative bg-[var(--pharos-cream)] dark:bg-card">
          {/* Decorative dot grid */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, var(--pharos-sage) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {/* Brand */}
              <div className="lg:col-span-1">
                <div className="mb-4">
                  <PharosLogo size="md" />
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground max-w-xs">
                  A beacon of hope for every girl — providing safety, healing,
                  and a path to a brighter future in the Philippines.
                </p>
                {/* Accent bar */}
                <div className="mt-4 h-0.5 w-16 rounded-full bg-gradient-to-r from-[var(--pharos-sage)] to-[var(--pharos-blush)]" />
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 text-[var(--pharos-forest)] dark:text-foreground">
                  Explore
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>
                    <Link to="/" className="hover:text-[var(--pharos-forest)] transition-colors flex items-center gap-1.5 group">
                      <span className="h-px w-3 bg-[var(--pharos-sage)] transition-all group-hover:w-5" />
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link to="/impact" className="hover:text-[var(--pharos-forest)] transition-colors flex items-center gap-1.5 group">
                      <span className="h-px w-3 bg-[var(--pharos-sage)] transition-all group-hover:w-5" />
                      Impact Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to="/login" className="hover:text-[var(--pharos-forest)] transition-colors flex items-center gap-1.5 group">
                      <span className="h-px w-3 bg-[var(--pharos-sage)] transition-all group-hover:w-5" />
                      Sign In
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 text-[var(--pharos-forest)] dark:text-foreground">
                  Legal
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li>
                    <Link to="/privacy" className="hover:text-[var(--pharos-forest)] transition-colors flex items-center gap-1.5 group">
                      <span className="h-px w-3 bg-[var(--pharos-sage)] transition-all group-hover:w-5" />
                      Privacy Policy
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-4 text-[var(--pharos-forest)] dark:text-foreground">
                  Contact
                </h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-[var(--pharos-sage)] shrink-0" />
                    info@pharos.org
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-[var(--pharos-sage)] shrink-0" />
                    +63 912 345 6789
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-10 border-t border-[var(--pharos-sage)]/15 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>&copy; {new Date().getFullYear()} Pharos. All rights reserved.</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--pharos-sage)]" />
                Registered 501(c)(3) Nonprofit
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
