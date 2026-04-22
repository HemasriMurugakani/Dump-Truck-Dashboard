export type UserRole =
  | "SUPER_ADMIN"
  | "SITE_MANAGER"
  | "FLEET_OPERATOR"
  | "TRUCK_OPERATOR"
  | "MAINTENANCE_TECH"
  | "ANALYST";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  siteId: string;
  assignedTruckId?: string;
};

export type SiteContext = {
  id: string;
  name: string;
  location: string;
  activeShift: number;
  zoneName: string;
};

export type AuthPermissions = {
  canControlActuators: boolean;
  canViewAllTrucks: boolean;
  canEditConfig: boolean;
  canExportData: boolean;
  canManageUsers: boolean;
  canViewGlobalAnalytics: boolean;
};

export type AuthContextShape = {
  user: AuthUser | null;
  site: SiteContext | null;
  permissions: AuthPermissions;
};
