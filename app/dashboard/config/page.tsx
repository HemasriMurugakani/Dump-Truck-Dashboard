import { ProtectedShell } from "@/components/dashboard-shell/ProtectedShell";
import { SystemConfigPage } from "@/components/config/SystemConfigPage";

export default function ConfigDashboardPage() {
  return (
    <ProtectedShell allowedRoles={["SUPER_ADMIN", "MAINTENANCE_TECH", "SITE_MANAGER"]}>
      <SystemConfigPage />
    </ProtectedShell>
  );
}
