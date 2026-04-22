import type { UserRole } from "@/types/auth";

export function routeForRole(role: UserRole, assignedTruckId?: string): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/dashboard/global";
    case "SITE_MANAGER":
      return "/dashboard/site";
    case "FLEET_OPERATOR":
      return "/dashboard/fleet";
    case "TRUCK_OPERATOR":
      return `/dashboard/truck/${assignedTruckId ?? "793-11"}`;
    case "MAINTENANCE_TECH":
      return "/dashboard/maintenance";
    case "ANALYST":
      return "/dashboard/acoustic";
    default:
      return "/dashboard/fleet";
  }
}
