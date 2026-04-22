import type { AuthPermissions, UserRole } from "@/types/auth";

const PERMISSION_MAP: Record<UserRole, AuthPermissions> = {
  SUPER_ADMIN: {
    canControlActuators: true,
    canViewAllTrucks: true,
    canEditConfig: true,
    canExportData: true,
    canManageUsers: true,
    canViewGlobalAnalytics: true,
  },
  SITE_MANAGER: {
    canControlActuators: true,
    canViewAllTrucks: true,
    canEditConfig: true,
    canExportData: true,
    canManageUsers: false,
    canViewGlobalAnalytics: false,
  },
  FLEET_OPERATOR: {
    canControlActuators: true,
    canViewAllTrucks: true,
    canEditConfig: false,
    canExportData: true,
    canManageUsers: false,
    canViewGlobalAnalytics: false,
  },
  TRUCK_OPERATOR: {
    canControlActuators: true,
    canViewAllTrucks: false,
    canEditConfig: false,
    canExportData: false,
    canManageUsers: false,
    canViewGlobalAnalytics: false,
  },
  MAINTENANCE_TECH: {
    canControlActuators: false,
    canViewAllTrucks: true,
    canEditConfig: true,
    canExportData: true,
    canManageUsers: false,
    canViewGlobalAnalytics: false,
  },
  ANALYST: {
    canControlActuators: false,
    canViewAllTrucks: true,
    canEditConfig: false,
    canExportData: true,
    canManageUsers: false,
    canViewGlobalAnalytics: true,
  },
};

export function permissionsForRole(role: UserRole): AuthPermissions {
  return PERMISSION_MAP[role];
}
