import { ProtectedShell } from "@/components/dashboard-shell/ProtectedShell";
import { RoleLanding } from "@/components/dashboard-shell/RoleLanding";

export default function AnalyticsDashboardPage() {
  return (
    <ProtectedShell allowedRoles={["ANALYST", "SUPER_ADMIN"]}>
      <RoleLanding
        title="Analytics Studio"
        description="Signal correlation, trend decomposition, and residue prediction confidence calibration."
      />
    </ProtectedShell>
  );
}
