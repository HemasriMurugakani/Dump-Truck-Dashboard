"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { GlobalMap } from "./GlobalMap";
import { GlobalFleetStatus } from "./GlobalFleetStatus";
import { MultiSiteComparison } from "./MultiSiteComparison";
import { GlobalAlerts } from "./GlobalAlerts";
import { UserManagement } from "./UserManagement";
import { SystemHealth } from "./SystemHealth";
import { KpiStrip } from "./KpiStrip";
import {
  ALERTS,
  AUDIT_LOG,
  GLOBAL_SITES,
  GLOBAL_USERS,
  SITE_COMPARISON,
  SYSTEM_HEALTH,
  TRUCKS,
} from "@/lib/mockData";

import type { GlobalSiteData, GlobalUser } from "@/lib/mockData";

type DrilldownState =
  | { kind: "site"; id: string }
  | { kind: "alert"; id: string }
  | { kind: "user"; id: string }
  | { kind: "device" };

const firstSite = GLOBAL_SITES[0];

export function GlobalCommandCenter() {
  const router = useRouter();
  const [selectedSiteId, setSelectedSiteId] = useState<string>(firstSite.id);
  const [selectedDrilldown, setSelectedDrilldown] = useState<DrilldownState>({ kind: "site", id: firstSite.id });
  const [sortBy, setSortBy] = useState<"cb" | "efficiency" | "fuel">("efficiency");
  const [userFilter, setUserFilter] = useState<"all" | "active" | "inactive">("all");
  const [expandedAuditLog, setExpandedAuditLog] = useState(true);

  const selectedSite = useMemo<GlobalSiteData>(() => {
    return GLOBAL_SITES.find((site) => site.id === selectedSiteId) ?? firstSite;
  }, [selectedSiteId]);

  const selectedAlert = useMemo(() => {
    if (selectedDrilldown.kind !== "alert") {
      return null;
    }
    return ALERTS.find((alert) => alert.id === selectedDrilldown.id) ?? null;
  }, [selectedDrilldown]);

  const selectedUser = useMemo(() => {
    if (selectedDrilldown.kind !== "user") {
      return null;
    }
    return GLOBAL_USERS.find((user) => user.id === selectedDrilldown.id) ?? null;
  }, [selectedDrilldown]);

  const activeAlerts = ALERTS.filter((alert) => !alert.resolved);

  const totalActiveSites = GLOBAL_SITES.filter((site) => site.status === "OPERATIONAL").length;
  const totalTrucks = GLOBAL_SITES.reduce((sum, site) => sum + site.trucksCount, 0);
  const payloadRecovered = Math.round(SITE_COMPARISON.reduce((sum, site) => sum + site.payloadEfficiency * 100, 0) / SITE_COMPARISON.length);
  const avgCarryBack = SITE_COMPARISON.reduce((sum, site) => sum + site.avgCarryBackPct, 0) / SITE_COMPARISON.length;
  const co2Saved = Math.round(SITE_COMPARISON.reduce((sum, site) => sum + site.fuelSaved, 0) * 3.21);
  const uptime = 99.94;

  const siteMetricLine = `${selectedSite.trucksCount} trucks · ${selectedSite.avgCarryBackPct.toFixed(2)}% CB · ${selectedSite.alertCount} alerts`;

  const drilldown = (() => {
    if (selectedDrilldown.kind === "alert" && selectedAlert) {
      const truck = TRUCKS.find((item) => item.id === selectedAlert.truckId);
      return {
        title: selectedAlert.title,
        eyebrow: `Alert ${selectedAlert.severity}`,
        subtitle: `${selectedAlert.truckId} · ${truck?.model ?? "Truck detail"}`,
        body: selectedAlert.message,
        facts: [
          ["Alert ID", selectedAlert.id],
          ["Severity", selectedAlert.severity],
          ["Status", selectedAlert.resolved ? "Resolved" : "Active"],
          ["Raised", new Date(selectedAlert.timestamp).toLocaleString()],
        ],
        primary: { label: "Open truck detail", action: () => router.push(`/dashboard/truck/${selectedAlert.truckId}`) },
        secondary: { label: "Open fleet view", action: () => router.push("/dashboard/fleet") },
      };
    }

    if (selectedDrilldown.kind === "user" && selectedUser) {
      return {
        title: selectedUser.name,
        eyebrow: `${selectedUser.role} user`,
        subtitle: `${selectedUser.site} site`,
        body: selectedUser.email,
        facts: [
          ["Status", selectedUser.status],
          ["Last login", new Date(selectedUser.lastLogin).toLocaleString()],
          ["Password changed", new Date(selectedUser.lastPasswordChange).toLocaleDateString()],
          ["Role", selectedUser.role],
        ],
        primary: { label: "Open site view", action: () => router.push("/dashboard/site") },
        secondary: { label: "Open fleet view", action: () => router.push("/dashboard/fleet") },
      };
    }

    if (selectedDrilldown.kind === "device") {
      return {
        title: "Fleet Device Health",
        eyebrow: "Device fleet",
        subtitle: `${SYSTEM_HEALTH.onlineJetsons}/${SYSTEM_HEALTH.totalJetsons} Jetsons online · ${SYSTEM_HEALTH.onlineMcus}/${SYSTEM_HEALTH.totalMcus} MCUs online`,
        body: "This view shows the current hardware health and version spread across the fleet. Use it to jump into maintenance workflows.",
        facts: [
          ["Avg inference", `${SYSTEM_HEALTH.avgInferenceTime} ms`],
          ["Devices needing update", String(SYSTEM_HEALTH.devicesNeedingUpdate)],
          ["Model version", SYSTEM_HEALTH.modelVersion],
          ["Uptime", `${uptime.toFixed(2)}%`],
        ],
        primary: { label: "Open maintenance", action: () => router.push("/dashboard/maintenance") },
        secondary: { label: "Open analytics", action: () => router.push("/dashboard/analytics") },
      };
    }

    return {
      title: selectedSite.name,
      eyebrow: "Site drill-down",
      subtitle: `${selectedSite.location} · ${selectedSite.zoneName}`,
      body: siteMetricLine,
      facts: [
        ["Status", selectedSite.status],
        ["Shift", `Shift ${selectedSite.activeShift}`],
        ["Alert level", selectedSite.alertSeverity],
        ["Fleet size", `${selectedSite.trucksCount} trucks`],
      ],
      primary: { label: "Open site view", action: () => router.push("/dashboard/site") },
      secondary: { label: "Open fleet view", action: () => router.push("/dashboard/fleet") },
    };
  })();

  const openSite = (siteId: string) => {
    setSelectedSiteId(siteId);
    setSelectedDrilldown({ kind: "site", id: siteId });
  };

  const openAlert = (alertId: string) => {
    setSelectedDrilldown({ kind: "alert", id: alertId });
  };

  const openUser = (userId: string) => {
    setSelectedDrilldown({ kind: "user", id: userId });
  };

  const openDeviceHealth = () => {
    setSelectedDrilldown({ kind: "device" });
  };

  return (
    <div className="global-shell">
      <div className="hero-card">
        <div>
          <p className="eyebrow">SUPER ADMIN COMMAND CENTER</p>
          <h1>Global HQ View</h1>
          <p className="hero-copy">
            Caterpillar HQ can see every site, every fleet, every truck, and every device stream in one place.
          </p>
        </div>
        <div className="hero-actions">
          <Button onClick={() => router.push("/dashboard/site")}>Open Site View</Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/fleet")}>Fleet View</Button>
          <Button variant="ghost" onClick={openDeviceHealth}>Device Health</Button>
        </div>
      </div>

      <KpiStrip
        activeSites={totalActiveSites}
        trucksMonitored={totalTrucks}
        payloadRecovered={payloadRecovered}
        avgCarryBackRate={avgCarryBack.toFixed(2)}
        co2Saved={co2Saved}
        uptime={uptime.toFixed(2)}
      />

      <div className="main-grid">
        <Card className="panel panel-map">
          <CardHeader className="panel-header">
            <div>
              <p className="panel-kicker">WORLD MAP</p>
              <h2>Live Global Operations</h2>
            </div>
            <div className="panel-pills">
              <span>{GLOBAL_SITES.length} sites</span>
              <span>Leaflet map</span>
            </div>
          </CardHeader>
          <CardContent>
            <GlobalMap sites={GLOBAL_SITES} selectedSite={selectedSiteId} onSelectSite={openSite} />
          </CardContent>
        </Card>

        <Card className="panel panel-fleet">
          <CardHeader className="panel-header">
            <div>
              <p className="panel-kicker">FLEET STATUS</p>
              <h2>{selectedSite.name}</h2>
            </div>
            <div className="panel-pills">
              <span>{selectedSite.status}</span>
            </div>
          </CardHeader>
          <CardContent>
            <GlobalFleetStatus sites={GLOBAL_SITES} selectedSiteId={selectedSiteId} onSelectSite={openSite} />
          </CardContent>
        </Card>
      </div>

      <Card className="panel inspector-panel">
        <CardHeader className="panel-header">
          <div>
            <p className="panel-kicker">DRILLDOWN INSPECTOR</p>
            <h2>{drilldown.title}</h2>
          </div>
          <div className="panel-pills">
            <span>{drilldown.eyebrow}</span>
            <span>{drilldown.subtitle}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="inspector-grid">
            <div>
              <p className="inspector-copy">{drilldown.body}</p>
              <div className="facts-grid">
                {drilldown.facts.map(([label, value]) => (
                  <div key={label} className="fact-card">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="inspector-actions">
              <Button onClick={drilldown.primary.action}>{drilldown.primary.label}</Button>
              <Button variant="outline" onClick={drilldown.secondary.action}>{drilldown.secondary.label}</Button>
              {selectedDrilldown.kind === "site" && (
                <Button variant="ghost" onClick={openDeviceHealth}>Inspect devices</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="split-grid">
        <Card className="panel">
          <CardHeader className="panel-header">
            <div>
              <p className="panel-kicker">SITE COMPARISON</p>
              <h2>Multi-Site Matrix</h2>
            </div>
            <div className="panel-pills">
              <span>Sortable</span>
              <span>Best performer highlighted</span>
            </div>
          </CardHeader>
          <CardContent>
            <MultiSiteComparison
              data={SITE_COMPARISON}
              sortBy={sortBy}
              onSortChange={setSortBy}
              selectedSiteId={selectedSiteId}
              onSelectSite={openSite}
            />
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader className="panel-header">
            <div>
              <p className="panel-kicker">GLOBAL ALERTS</p>
              <h2>{activeAlerts.length} Active</h2>
            </div>
            <div className="panel-pills">
              <span>Click for truck drill-down</span>
            </div>
          </CardHeader>
          <CardContent>
            <GlobalAlerts alerts={activeAlerts.slice(0, 6)} onSelectAlert={openAlert} />
          </CardContent>
        </Card>
      </div>

      <div className="split-grid">
        <Card className="panel">
          <CardHeader className="panel-header">
            <div>
              <p className="panel-kicker">USER MANAGEMENT</p>
              <h2>Governance Console</h2>
            </div>
            <div className="panel-pills">
              <span>Inline role change</span>
              <span>Audit logged</span>
            </div>
          </CardHeader>
          <CardContent>
            <UserManagement
              users={GLOBAL_USERS}
              userFilter={userFilter}
              onFilterChange={setUserFilter}
              auditLog={AUDIT_LOG}
              expandedAuditLog={expandedAuditLog}
              onToggleAuditLog={() => setExpandedAuditLog((value) => !value)}
              onSelectUser={openUser}
            />
          </CardContent>
        </Card>

        <Card className="panel">
          <CardHeader className="panel-header">
            <div>
              <p className="panel-kicker">SYSTEM HEALTH</p>
              <h2>Devices and Model Versions</h2>
            </div>
            <div className="panel-pills">
              <span>Click for maintenance</span>
            </div>
          </CardHeader>
          <CardContent>
            <SystemHealth health={SYSTEM_HEALTH} onOpenDevices={openDeviceHealth} />
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .global-shell {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-height: 100vh;
          padding: 20px;
          background:
            radial-gradient(circle at 18% 8%, rgba(245, 200, 0, 0.1), transparent 30%),
            radial-gradient(circle at 84% 12%, rgba(41, 121, 255, 0.09), transparent 28%),
            linear-gradient(180deg, #0a0b0d 0%, #0a0b0d 100%);
        }

        .global-shell::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          background-image: linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
          background-size: 46px 46px;
          mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.45), transparent 84%);
        }

        .hero-card,
        .panel {
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.06);
          background: linear-gradient(180deg, rgba(18, 21, 28, 0.98), rgba(13, 15, 19, 0.98));
          box-shadow: 0 18px 60px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(14px);
        }

        .hero-card {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
          padding: 22px 24px;
        }

        .eyebrow,
        .panel-kicker {
          color: var(--yellow);
          font-family: var(--mono);
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-size: 10px;
          margin-bottom: 8px;
        }

        .hero-card h1 {
          font-family: var(--cond);
          font-size: clamp(2.2rem, 4vw, 3.8rem);
          line-height: 0.95;
          letter-spacing: 0.02em;
        }

        .hero-copy {
          max-width: 760px;
          margin-top: 10px;
          color: var(--text2);
          line-height: 1.6;
        }

        .hero-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .main-grid,
        .split-grid {
          display: grid;
          gap: 20px;
        }

        .main-grid {
          grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
        }

        .split-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding-bottom: 0;
        }

        .panel-header h2 {
          font-family: var(--cond);
          font-size: 1.55rem;
        }

        .panel-pills {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .panel-pills span {
          display: inline-flex;
          align-items: center;
          min-height: 26px;
          padding: 0 10px;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.03);
          color: var(--text2);
          font-size: 10px;
          font-family: var(--mono);
        }

        .inspector-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 20px;
          align-items: start;
        }

        .inspector-copy {
          color: var(--text2);
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .facts-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .fact-card {
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 14px;
          background: rgba(255, 255, 255, 0.03);
        }

        .fact-card span {
          display: block;
          color: var(--text3);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 8px;
        }

        .fact-card strong {
          display: block;
          font-family: var(--mono);
          font-size: 14px;
          color: var(--text);
        }

        .inspector-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-width: 220px;
        }

        @media (max-width: 1400px) {
          .main-grid,
          .split-grid,
          .inspector-grid {
            grid-template-columns: 1fr;
          }

          .hero-card {
            align-items: flex-start;
            flex-direction: column;
          }

          .hero-actions {
            justify-content: flex-start;
          }

          .facts-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 900px) {
          .global-shell {
            padding: 14px;
          }

          .facts-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
