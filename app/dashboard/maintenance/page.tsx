import { ProtectedShell } from "@/components/dashboard-shell/ProtectedShell";
import { PredictiveMaintenancePage } from "@/components/maintenance/PredictiveMaintenancePage";

export default function MaintenanceDashboardPage() {
  return (
    <ProtectedShell allowedRoles={["MAINTENANCE_TECH", "SUPER_ADMIN", "SITE_MANAGER"]}>
      <PredictiveMaintenancePage />
    </ProtectedShell>
  );
}
