import { ProtectedShell } from "@/components/dashboard-shell/ProtectedShell";
import { AcousticAnalysisLab } from "@/components/acoustic/AcousticAnalysisLab";

export default function AcousticDashboardPage() {
  return (
    <ProtectedShell allowedRoles={["ANALYST", "SUPER_ADMIN", "SITE_MANAGER", "FLEET_OPERATOR", "MAINTENANCE_TECH", "TRUCK_OPERATOR"]}>
      <AcousticAnalysisLab />
    </ProtectedShell>
  );
}
