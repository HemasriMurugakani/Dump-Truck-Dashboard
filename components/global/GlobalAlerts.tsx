"use client";

import type { AlertRecord } from "@/lib/mockData";

type GlobalAlertsProps = {
  alerts: AlertRecord[];
  onSelectAlert?: (alertId: string) => void;
};

export function GlobalAlerts({ alerts, onSelectAlert }: GlobalAlertsProps) {
  const getSeverityColor = (severity: AlertRecord["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return "#e53935";
      case "HIGH":
        return "#ff6d00";
      case "MEDIUM":
        return "#ffc107";
      case "LOW":
        return "#00c853";
    }
  };

  const getSeverityBg = (severity: AlertRecord["severity"]) => {
    switch (severity) {
      case "CRITICAL":
        return "rgba(229, 57, 53, 0.12)";
      case "HIGH":
        return "rgba(255, 109, 0, 0.12)";
      case "MEDIUM":
        return "rgba(255, 193, 7, 0.12)";
      case "LOW":
        return "rgba(0, 200, 83, 0.12)";
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="no-alerts">
        <p className="no-alerts-icon">✓</p>
        <p className="no-alerts-text">All systems nominal</p>
        <style jsx>{`
          .no-alerts {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 32px;
            color: var(--text2);
          }

          .no-alerts-icon {
            font-size: 32px;
            color: #00c853;
            margin-bottom: 8px;
          }

          .no-alerts-text {
            font-size: 12px;
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <div className="global-alerts-list">
        {alerts.map((alert) => (
          <button
            key={alert.id}
            className="alert-item"
            type="button"
            onClick={() => onSelectAlert?.(alert.id)}
            style={{
              background: getSeverityBg(alert.severity),
              borderLeft: `3px solid ${getSeverityColor(alert.severity)}`,
            }}
          >
            <div className="alert-header">
              <div className="alert-title-section">
                <span className="alert-severity" style={{ color: getSeverityColor(alert.severity) }}>
                  {alert.severity}
                </span>
                <span className="alert-title">{alert.title}</span>
              </div>
              <span className="alert-id">{alert.id}</span>
            </div>
            <p className="alert-message">{alert.message}</p>
            <div className="alert-footer">
              <span className="truck-id">{alert.truckId}</span>
              <span className="timestamp">{new Date(alert.timestamp).toLocaleTimeString()}</span>
            </div>
          </button>
        ))}
      </div>

      <style jsx>{`
        .global-alerts-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 400px;
          overflow-y: auto;
        }

        .alert-item {
          width: 100%;
          padding: 12px;
          border-radius: 4px;
          transition: all 0.2s;
          border-top: 1px solid transparent;
          border-right: none;
          border-bottom: none;
          border-left-width: 3px;
          text-align: left;
          cursor: pointer;
        }

        .alert-item:hover {
          background-color: var(--border) !important;
        }

        .alert-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .alert-title-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .alert-severity {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: var(--mono);
        }

        .alert-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--text);
        }

        .alert-id {
          font-size: 9px;
          color: var(--text3);
          font-family: var(--mono);
        }

        .alert-message {
          font-size: 11px;
          color: var(--text2);
          margin: 0 0 6px 0;
          line-height: 1.4;
        }

        .alert-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9px;
          color: var(--text3);
          font-family: var(--mono);
        }

        .truck-id {
          font-weight: 600;
          color: var(--text2);
        }

        .timestamp {
          color: var(--text3);
        }
      `}</style>
    </>
  );
}
