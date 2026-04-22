import { ProtectedShell } from "@/components/dashboard-shell/ProtectedShell";
import { TruckDetailPage } from "@/components/truck-detail/TruckDetailPage";

export default function TruckDashboardPage({ params }: { params: { truckId: string } }) {
  return (
    <ProtectedShell allowedRoles={["TRUCK_OPERATOR", "FLEET_OPERATOR", "SITE_MANAGER", "SUPER_ADMIN", "ANALYST", "MAINTENANCE_TECH"]}>
      <TruckDetailPage truckId={params.truckId} />
    </ProtectedShell>
  );
}
