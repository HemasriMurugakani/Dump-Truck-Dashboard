import { ProtectedShell } from "@/components/dashboard-shell/ProtectedShell";
import { RoleLanding } from "@/components/dashboard-shell/RoleLanding";

export default function SiteDashboardPage() {
  return (
    <ProtectedShell allowedRoles={["SITE_MANAGER", "SUPER_ADMIN"]}>
      <RoleLanding
        title="Site Management Workspace"
        description="Mine-level performance, crew alignment, and on-shift carry-back reduction controls."
      />
    </ProtectedShell>
  );
}
