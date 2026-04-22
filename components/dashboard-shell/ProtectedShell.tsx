"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardShell } from "@/components/dashboard-shell/DashboardShell";
import type { UserRole } from "@/types/auth";

export function ProtectedShell({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  return (
    <AuthProvider>
      <ProtectedRoute allowedRoles={allowedRoles}>
        <DashboardShell>{children}</DashboardShell>
      </ProtectedRoute>
    </AuthProvider>
  );
}
