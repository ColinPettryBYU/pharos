import { Link, Outlet, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Sun, Moon, Menu, X, Lightbulb } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { PageTransition } from "./PageTransition";

const navLinks = [
  { label: "Mission", href: "/#mission" },
  { label: "Impact", href: "/impact" },
  { label: "Privacy", href: "/privacy" },
];

export function PublicLayout() {
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md"
      >
        <div className="mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Lightbulb className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Pharos</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} to={link.href}>
                <Button variant="ghost" size="sm" className="text-sm font-medium">
                  {link.label}
                </Button>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <Link
                  to={
                    user.roles?.includes("Admin")
                      ? "/admin"
                      : "/donor/dashboard"
                  }
                >
                  <Button size="sm">Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button size="sm">Get Started</Button>
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
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="text-lg font-medium py-2"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <div className="border-t pt-4 space-y-2">
                    {user ? (
                      <Link
                        to={
                          user.roles?.includes("Admin")
                            ? "/admin"
                            : "/donor/dashboard"
                        }
                        onClick={() => setMobileOpen(false)}
                      >
                        <Button className="w-full">Dashboard</Button>
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          onClick={() => setMobileOpen(false)}
                        >
                          <Button variant="outline" className="w-full">
                            Sign In
                          </Button>
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setMobileOpen(false)}
                        >
                          <Button className="w-full">Get Started</Button>
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
      <footer className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Lightbulb className="h-4 w-4" />
                </div>
                <span className="font-semibold">Pharos</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A beacon of hope for every girl. Providing safety, healing, and
                a path to a brighter future.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/" className="hover:text-foreground transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/impact" className="hover:text-foreground transition-colors">
                    Impact Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-foreground transition-colors">
                    Sign In
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Legal</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    to="/privacy"
                    className="hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-3">Contact</h3>
              <p className="text-sm text-muted-foreground">
                info@pharos.org
                <br />
                +63 912 345 6789
              </p>
            </div>
          </div>
          <div className="mt-8 border-t pt-6 text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Pharos. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
