"use client";

import type { GlobalSiteData } from "@/lib/mockData";

type GlobalFleetStatusProps = {
  sites: GlobalSiteData[];
  selectedSiteId?: string | null;
  onSelectSite?: (siteId: string) => void;
};

export function GlobalFleetStatus({ sites, selectedSiteId, onSelectSite }: GlobalFleetStatusProps) {
  return (
    <div className="fleet-status">
      <div className="fleet-stats">
        <div className="stat-box">
          <p className="stat-label">Total Fleet Size</p>
          <p className="stat-value">{sites.reduce((sum, s) => sum + s.trucksCount, 0)}</p>
        </div>
        <div className="stat-box">
          <p className="stat-label">Sites Reporting</p>
          <p className="stat-value">{sites.filter((s) => s.status === "OPERATIONAL").length}/{sites.length}</p>
        </div>
        <div className="stat-box">
          <p className="stat-label">Alert Avg</p>
          <p className="stat-value">{Math.round(sites.reduce((sum, s) => sum + s.alertCount, 0) / sites.length)}</p>
        </div>
      </div>

      <div className="site-health-list">
        <p className="list-title">Site Status Overview</p>
        {sites.map((site) => (
          <button
            key={site.id}
            type="button"
            className={`site-health-item ${selectedSiteId === site.id ? "selected" : ""}`}
            onClick={() => onSelectSite?.(site.id)}
          >
            <div className="site-info">
              <div className="site-name">{site.name}</div>
              <div className="site-stats">
                <span className="stat">Trucks: {site.trucksCount}</span>
                <span className="stat">CB: {site.avgCarryBackPct.toFixed(2)}%</span>
              </div>
            </div>
            <div className="site-status-indicator">
              <div className={`status-badge ${site.status.toLowerCase()}`}>{site.alertSeverity === "OK" ? "✓ OK" : `⚠ ${site.alertSeverity}`}</div>
              {site.alertCount > 0 && <div className="alert-badge">{site.alertCount}</div>}
            </div>
          </button>
        ))}
      </div>

      <style jsx>{`
        .fleet-status {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .fleet-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .stat-box {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 12px;
          text-align: center;
        }

        .stat-label {
          font-size: 10px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--yellow);
          font-family: var(--mono);
        }

        .site-health-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .list-title {
          font-size: 11px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .site-health-item {
          width: 100%;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.2s;
          cursor: pointer;
          text-align: left;
        }

        .site-health-item:hover {
          border-color: var(--border2);
          background: rgba(245, 200, 0, 0.02);
        }

        .site-health-item.selected {
          border-color: var(--yellow);
          box-shadow: inset 0 0 0 1px rgba(245, 200, 0, 0.15);
          background: rgba(245, 200, 0, 0.05);
        }

        .site-info {
          flex: 1;
        }

        .site-name {
          font-size: 12px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 4px;
        }

        .site-stats {
          display: flex;
          gap: 12px;
          font-size: 10px;
          color: var(--text2);
        }

        .stat {
          font-family: var(--mono);
        }

        .site-status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-badge {
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 3px;
          font-weight: 600;
          font-family: var(--mono);
        }

        .status-badge.operational {
          background: rgba(0, 200, 83, 0.15);
          color: #00c853;
        }

        .status-badge.degraded {
          background: rgba(255, 109, 0, 0.15);
          color: #ff6d00;
        }

        .status-badge.offline {
          background: rgba(229, 57, 53, 0.15);
          color: #e53935;
        }

        .alert-badge {
          background: #ff6d00;
          color: white;
          font-size: 10px;
          font-weight: 700;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
