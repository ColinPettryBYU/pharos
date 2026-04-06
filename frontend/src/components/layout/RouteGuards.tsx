import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { SkeletonPage } from "@/components/shared/SkeletonPage";
import type { ReactNode } from "react";

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAdmin, isStaff, isLoading } = useAuth();
  if (isLoading) return <SkeletonPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin && !isStaff) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export function DonorRoute({ children }: { children: ReactNode }) {
  const { user, isDonor, isLoading } = useAuth();
  if (isLoading) return <SkeletonPage />;
  if (!user) return <Navigate to="/login" replace />;
  if (!isDonor) return <Navigate to="/" replace />;
  return <>{children}</>;
}
