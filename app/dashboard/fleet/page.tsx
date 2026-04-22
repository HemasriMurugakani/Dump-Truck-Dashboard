import { ProtectedShell } from "@/components/dashboard-shell/ProtectedShell";
import { FleetOverview } from "@/components/fleet/FleetOverview";

export default function FleetDashboardPage() {
  return (
    <ProtectedShell allowedRoles={["FLEET_OPERATOR", "SITE_MANAGER", "SUPER_ADMIN", "TRUCK_OPERATOR", "ANALYST"]}>
      <FleetOverview />
    </ProtectedShell>
  );
}
