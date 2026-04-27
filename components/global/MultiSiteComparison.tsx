"use client";

import { useState } from "react";
import type { SiteComparisonData } from "@/lib/mockData";

type MultiSiteComparisonProps = {
  data: SiteComparisonData[];
  sortBy: "cb" | "efficiency" | "fuel";
  onSortChange: (sort: "cb" | "efficiency" | "fuel") => void;
  selectedSiteId?: string | null;
  onSelectSite?: (siteId: string) => void;
};

export function MultiSiteComparison({ data, sortBy, onSortChange, selectedSiteId, onSelectSite }: MultiSiteComparisonProps) {
  const sortedData = [...data].sort((a, b) => {
    if (sortBy === "cb") {
      return a.avgCarryBackPct - b.avgCarryBackPct;
    }
    if (sortBy === "efficiency") {
      return b.payloadEfficiency - a.payloadEfficiency;
    }
    return b.fuelSaved - a.fuelSaved;
  });

  const bestPerformer = sortedData[0];

  return (
    <div className="comparison-table-wrapper">
      <div className="sort-controls">
        <button className={`sort-btn ${sortBy === "cb" ? "active" : ""}`} onClick={() => onSortChange("cb")}>
          ↕ By Carry-Back
        </button>
        <button className={`sort-btn ${sortBy === "efficiency" ? "active" : ""}`} onClick={() => onSortChange("efficiency")}>
          ↕ By Efficiency
        </button>
        <button className={`sort-btn ${sortBy === "fuel" ? "active" : ""}`} onClick={() => onSortChange("fuel")}>
          ↕ By Fuel Saved
        </button>
      </div>

      <table className="comparison-table">
        <thead>
          <tr>
            <th>SITE</th>
            <th>FLEET</th>
            <th>AVG CB%</th>
            <th>EFFICIENCY</th>
            <th>FUEL SAVED</th>
            <th>ALERTS</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((site) => (
            <tr
              key={site.siteId}
              className={`${bestPerformer.siteId === site.siteId ? "best-performer" : ""} ${selectedSiteId === site.siteId ? "selected" : ""}`}
              onClick={() => onSelectSite?.(site.siteId)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectSite?.(site.siteId);
                }
              }}
            >
              <td className="site-name-cell">
                <div className="site-name">{site.siteName}</div>
                <div className="site-id">{site.siteId}</div>
              </td>
              <td className="numeric">
                <span className="fleet-size">{site.fleetSize}</span>
              </td>
              <td className="numeric">
                <span className={site.avgCarryBackPct > 1 ? "warn" : "good"}>{site.avgCarryBackPct.toFixed(2)}%</span>
              </td>
              <td className="numeric">
                <span className="efficiency">{site.payloadEfficiency.toFixed(1)}%</span>
              </td>
              <td className="numeric">
                <span className="fuel-saved">{site.fuelSaved.toLocaleString()} L</span>
              </td>
              <td className="numeric">
                <span className={`alert-count ${site.alertCount > 0 ? "has-alerts" : "clear"}`}>{site.alertCount}</span>
              </td>
              <td className="status-cell">
                <span className={`status-tag ${site.status.toLowerCase()}`}>{site.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="comparison-footer">
        <p className="footer-text">
          🏆 <strong>Best Performer:</strong> {bestPerformer.siteName} ({bestPerformer.payloadEfficiency.toFixed(1)}% efficiency)
        </p>
      </div>

      <style jsx>{`
        .comparison-table-wrapper {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .sort-controls {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .sort-btn {
          padding: 6px 12px;
          font-size: 11px;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text2);
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
          font-family: var(--mono);
        }

        .sort-btn:hover {
          border-color: var(--yellow);
          color: var(--yellow);
        }

        .sort-btn.active {
          background: rgba(245, 200, 0, 0.15);
          border-color: var(--yellow);
          color: var(--yellow);
        }

        .comparison-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .comparison-table thead {
          border-bottom: 1px solid var(--border);
        }

        .comparison-table th {
          text-align: left;
          padding: 12px;
          color: var(--text2);
          font-weight: 600;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .comparison-table tbody tr {
          border-bottom: 1px solid var(--border);
          transition: all 0.2s;
          cursor: pointer;
        }

        .comparison-table tbody tr:hover {
          background: rgba(245, 200, 0, 0.02);
          border-color: var(--border2);
        }

        .comparison-table tbody tr.best-performer {
          background: rgba(0, 200, 83, 0.08);
        }

        .comparison-table tbody tr.selected {
          outline: 1px solid rgba(245, 200, 0, 0.7);
          outline-offset: -1px;
        }

        .comparison-table td {
          padding: 12px;
          color: var(--text);
        }

        .site-name-cell {
          font-weight: 600;
        }

        .site-name {
          font-size: 12px;
          margin-bottom: 2px;
        }

        .site-id {
          font-size: 10px;
          color: var(--text2);
          font-family: var(--mono);
        }

        .numeric {
          text-align: right;
          font-family: var(--mono);
          font-size: 11px;
        }

        .fleet-size {
          color: var(--yellow);
          font-weight: 600;
        }

        .warn {
          color: #ff6d00;
        }

        .good {
          color: #00c853;
        }

        .efficiency {
          color: #00c853;
          font-weight: 600;
        }

        .fuel-saved {
          color: var(--text);
        }

        .alert-count {
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 2px;
        }

        .alert-count.clear {
          color: #00c853;
        }

        .alert-count.has-alerts {
          color: #ff6d00;
          background: rgba(255, 109, 0, 0.12);
        }

        .status-cell {
          text-align: center;
        }

        .status-tag {
          font-size: 10px;
          padding: 4px 8px;
          border-radius: 3px;
          font-weight: 600;
          font-family: var(--mono);
        }

        .status-tag.operational {
          background: rgba(0, 200, 83, 0.15);
          color: #00c853;
        }

        .status-tag.degraded {
          background: rgba(255, 109, 0, 0.15);
          color: #ff6d00;
        }

        .comparison-footer {
          border-top: 1px solid var(--border);
          padding-top: 12px;
          margin-top: 4px;
        }

        .footer-text {
          font-size: 12px;
          color: var(--text2);
          margin: 0;
        }
      `}</style>
    </div>
  );
}
