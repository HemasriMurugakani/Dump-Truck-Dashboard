import { ProtectedShell } from "@/components/dashboard-shell/ProtectedShell";
import { AnalyticsReportingPage } from "@/components/analytics/AnalyticsReportingPage";

export default function AnalyticsDashboardPage() {
  return (
    <ProtectedShell allowedRoles={["ANALYST", "SUPER_ADMIN", "SITE_MANAGER", "FLEET_OPERATOR", "MAINTENANCE_TECH", "TRUCK_OPERATOR"]}>
      <AnalyticsReportingPage />
    </ProtectedShell>
  );
}
