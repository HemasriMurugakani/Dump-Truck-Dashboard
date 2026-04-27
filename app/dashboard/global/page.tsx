import { ProtectedShell } from "@/components/dashboard-shell/ProtectedShell";
import { GlobalCommandCenter } from "@/components/global/GlobalCommandCenter";

export default function GlobalDashboardPage() {
  return (
    <ProtectedShell allowedRoles={["SUPER_ADMIN"]}>
      <GlobalCommandCenter />
    </ProtectedShell>
  );
}
