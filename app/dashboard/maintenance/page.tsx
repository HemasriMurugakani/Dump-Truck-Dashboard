import { ProtectedShell } from "@/components/dashboard-shell/ProtectedShell";
import { RoleLanding } from "@/components/dashboard-shell/RoleLanding";

export default function MaintenanceDashboardPage() {
  return (
    <ProtectedShell allowedRoles={["MAINTENANCE_TECH", "SUPER_ADMIN"]}>
      <RoleLanding
        title="Maintenance Command"
        description="Diagnostics queue, actuator health signals, and smart scheduling for interventions."
      />
    </ProtectedShell>
  );
}
