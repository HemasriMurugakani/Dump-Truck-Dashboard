import { ProtectedShell } from "@/components/dashboard-shell/ProtectedShell";
import { RoleLanding } from "@/components/dashboard-shell/RoleLanding";

export default function GlobalDashboardPage() {
  return (
    <ProtectedShell allowedRoles={["SUPER_ADMIN"]}>
      <RoleLanding
        title="Global Command"
        description="Cross-site operations overview, policy control, and enterprise risk orchestration."
      />
    </ProtectedShell>
  );
}
