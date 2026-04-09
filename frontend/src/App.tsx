import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import { ThemeProvider } from "@/lib/theme";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { AdminRoute, DonorRoute } from "@/components/layout/RouteGuards";
import { SkeletonPage } from "@/components/shared/SkeletonPage";
import { CookieConsentBanner } from "@/components/shared/CookieConsentBanner";

// Lazy-loaded pages
const LandingPage = lazy(() => import("@/pages/public/LandingPage"));
const LoginPage = lazy(() => import("@/pages/public/LoginPage"));
const RegisterPage = lazy(() => import("@/pages/public/RegisterPage"));
const ImpactDashboard = lazy(() => import("@/pages/public/ImpactDashboard"));
const PrivacyPolicy = lazy(() => import("@/pages/public/PrivacyPolicy"));
const DonatePage = lazy(() => import("@/pages/public/DonatePage"));

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const DonorsPage = lazy(() => import("@/pages/admin/DonorsPage"));
const DonorDetailPage = lazy(() => import("@/pages/admin/DonorDetailPage"));
const DonationsPage = lazy(() => import("@/pages/admin/DonationsPage"));
const ResidentsPage = lazy(() => import("@/pages/admin/ResidentsPage"));
const ResidentDetailPage = lazy(() => import("@/pages/admin/ResidentDetailPage"));
const ProcessRecordingsPage = lazy(() => import("@/pages/admin/ProcessRecordingsPage"));
const HomeVisitationsPage = lazy(() => import("@/pages/admin/HomeVisitationsPage"));
const SocialMediaPage = lazy(() => import("@/pages/admin/SocialMediaPage"));
const SafehousesPage = lazy(() => import("@/pages/admin/SafehousesPage"));
const PartnersPage = lazy(() => import("@/pages/admin/PartnersPage"));
const UserManagementPage = lazy(() => import("@/pages/admin/UserManagementPage"));
const SocialAccountsPage = lazy(() => import("@/pages/admin/SocialAccountsPage"));
const ReportsPage = lazy(() => import("@/pages/admin/ReportsPage"));
const ChatPage = lazy(() => import("@/pages/admin/ChatPage"));
const ProfilePage = lazy(() => import("@/pages/admin/ProfilePage"));

const DonorDashboard = lazy(() => import("@/pages/donor/DonorDashboard"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <BrowserRouter>
              <ScrollToTop />
              <Suspense fallback={<SkeletonPage />}>
                <Routes>
                  {/* Public Routes */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/impact" element={<ImpactDashboard />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/donate" element={<DonatePage />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route
                    element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }
                  >
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/donors" element={<DonorsPage />} />
                    <Route path="/admin/donors/:id" element={<DonorDetailPage />} />
                    <Route path="/admin/donations" element={<DonationsPage />} />
                    <Route path="/admin/residents" element={<ResidentsPage />} />
                    <Route path="/admin/residents/:id" element={<ResidentDetailPage />} />
                    <Route path="/admin/process-recordings" element={<ProcessRecordingsPage />} />
                    <Route path="/admin/home-visitations" element={<HomeVisitationsPage />} />
                    <Route path="/admin/social" element={<SocialMediaPage />} />
                    <Route path="/admin/safehouses" element={<SafehousesPage />} />
                    <Route path="/admin/partners" element={<PartnersPage />} />
                    <Route path="/admin/users" element={<UserManagementPage />} />
                    <Route path="/admin/reports" element={<ReportsPage />} />
                    <Route path="/admin/chat" element={<ChatPage />} />
                    <Route path="/admin/settings/social-accounts" element={<SocialAccountsPage />} />
                    <Route path="/admin/profile" element={<ProfilePage />} />
                  </Route>

                  {/* Donor Routes */}
                  <Route
                    element={
                      <DonorRoute>
                        <PublicLayout />
                      </DonorRoute>
                    }
                  >
                    <Route path="/donor/dashboard" element={<DonorDashboard />} />
                  </Route>
                </Routes>
              </Suspense>
              <CookieConsentBanner />
              <Toaster richColors position="top-right" />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
