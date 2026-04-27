"use client";

import { useState, useEffect, useRef } from "react";
import { GLOBAL_SITES, GLOBAL_USERS, SYSTEM_HEALTH, SITE_COMPARISON, ALERTS, TRUCKS, AUDIT_LOG } from "@/lib/mockData";
import { KpiStrip } from "./KpiStrip";
import { GlobalMap } from "./GlobalMap";
import { GlobalFleetStatus } from "./GlobalFleetStatus";
import { MultiSiteComparison } from "./MultiSiteComparison";
import { GlobalAlerts } from "./GlobalAlerts";
import { UserManagement } from "./UserManagement";
import { SystemHealth } from "./SystemHealth";

export function GlobalDashboard() {
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"cb" | "efficiency" | "fuel">("efficiency");
  const [userFilter, setUserFilter] = useState<"all" | "active" | "inactive">("all");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [expandedAuditLog, setExpandedAuditLog] = useState(false);

  // Calculate global metrics
  const totalActiveSites = GLOBAL_SITES.filter((s) => s.status === "OPERATIONAL").length;
  const totalTrucks = GLOBAL_SITES.reduce((sum, site) => sum + site.trucksCount, 0);
  const globalPayloadRecovered = SITE_COMPARISON.reduce((sum, site) => sum + site.payloadEfficiency * 100, 0) / SITE_COMPARISON.length;
  const globalAvgCb = SITE_COMPARISON.reduce((sum, site) => sum + site.avgCarryBackPct, 0) / SITE_COMPARISON.length;
  const co2Saved = SITE_COMPARISON.reduce((sum, site) => sum + site.fuelSaved, 0) * 3.21; // CO2 per liter fuel
  const systemUptime = 99.94;

  // Global alerts (unresolved)
  const globalAlerts = ALERTS.filter((a) => !a.resolved);

  return (
    <div className="global-dashboard">
      {/* Top KPI Strip */}
      <KpiStrip
        activeSites={totalActiveSites}
        trucksMonitored={totalTrucks}
        payloadRecovered={Math.round(globalPayloadRecovered)}
        avgCarryBackRate={globalAvgCb.toFixed(2)}
        co2Saved={Math.round(co2Saved)}
        uptime={systemUptime.toFixed(2)}
      />

      {/* Main content grid: Map + Fleet Status */}
      <div className="global-main-grid">
        <div className="map-section">
          <h2 className="section-title">Global Operations Map</h2>
          <GlobalMap sites={GLOBAL_SITES} selectedSite={selectedSite} onSelectSite={setSelectedSite} />
        </div>
        <div className="fleet-status-section">
          <h2 className="section-title">Global Fleet Status</h2>
          <GlobalFleetStatus sites={GLOBAL_SITES} />
        </div>
      </div>

      {/* Multi-Site Comparison */}
      <div className="comparison-section">
        <h2 className="section-title">Multi-Site Performance</h2>
        <MultiSiteComparison data={SITE_COMPARISON} sortBy={sortBy} onSortChange={setSortBy} />
      </div>

      {/* Alerts + User Management in a grid */}
      <div className="alerts-users-grid">
        <div className="alerts-section">
          <h2 className="section-title">Global Alerts ({globalAlerts.length} Active)</h2>
          <GlobalAlerts alerts={globalAlerts.slice(0, 6)} />
        </div>
        <div className="users-section">
          <h2 className="section-title">User Management</h2>
          <UserManagement
            users={GLOBAL_USERS}
            userFilter={userFilter}
            onFilterChange={setUserFilter}
            auditLog={AUDIT_LOG}
            expandedAuditLog={expandedAuditLog}
            onToggleAuditLog={() => setExpandedAuditLog(!expandedAuditLog)}
          />
        </div>
      </div>

      {/* System Health Dashboard */}
      <div className="health-section">
        <h2 className="section-title">System Health & Device Status</h2>
        <SystemHealth health={SYSTEM_HEALTH} />
      </div>

      <style jsx>{`
        .global-dashboard {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 20px;
          background: var(--bg);
          min-height: 100vh;
        }

        .global-main-grid {
          display: grid;
          grid-template-columns: 55fr 45fr;
          gap: 20px;
        }

        .map-section,
        .fleet-status-section,
        .comparison-section,
        .alerts-section,
        .users-section,
        .health-section {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
        }

        .section-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .alerts-users-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        @media (max-width: 1400px) {
          .global-main-grid {
            grid-template-columns: 1fr;
          }

          .alerts-users-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
