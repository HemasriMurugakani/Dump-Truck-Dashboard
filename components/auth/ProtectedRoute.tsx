"use client";

import { routeForRole } from "@/lib/routes";
import type { UserRole } from "@/types/auth";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status !== "authenticated") {
      router.replace("/");
      return;
    }

    const role = session.user.role;

    if (role === "TRUCK_OPERATOR" && pathname.startsWith("/dashboard/truck/")) {
      const pathTruckId = pathname.split("/")[3] ?? "";
      const assignedTruckId = session.user.assignedTruckId ?? "793-11";
      if (pathTruckId && pathTruckId !== assignedTruckId) {
        toast.warning("Access limited to your assigned truck.");
        router.replace(`/dashboard/truck/${assignedTruckId}`);
        return;
      }
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
      const correctRoute = routeForRole(role, session.user.assignedTruckId);
      if (pathname !== correctRoute) {
        toast.warning("Unauthorized route. Redirected to your assigned workspace.");
        router.replace(correctRoute);
      }
    }
  }, [allowedRoles, pathname, router, session, status]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[#FFC107] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status !== "authenticated") {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return null;
  }

  return <>{children}</>;
}
