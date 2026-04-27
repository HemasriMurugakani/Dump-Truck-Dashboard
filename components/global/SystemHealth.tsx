"use client";

import type { SystemHealthData } from "@/lib/mockData";

type SystemHealthProps = {
  health: SystemHealthData;
  onOpenDevices?: () => void;
};

export function SystemHealth({ health, onOpenDevices }: SystemHealthProps) {
  const jetsonPercentage = (health.onlineJetsons / health.totalJetsons) * 100;
  const mcuPercentage = (health.onlineMcus / health.totalMcus) * 100;

  const modelVersionDistribution = [
    { version: "2.4.1", count: 6, percentage: 75 },
    { version: "2.4.0", count: 2, percentage: 25 },
  ];

  return (
    <div className="system-health">
      <div className="health-grid">
        {/* Jetson devices */}
        <div className="health-card">
          <p className="health-label">Jetson Devices</p>
          <div className="health-metric">
            <div className="metric-value">
              <span className="online">{health.onlineJetsons}</span>
              <span className="divider">/</span>
              <span className="total">{health.totalJetsons}</span>
            </div>
            <div className="health-bar">
              <div className="health-fill" style={{ width: `${jetsonPercentage}%` }}></div>
            </div>
            <p className="health-pct">{jetsonPercentage.toFixed(0)}% Online</p>
          </div>
        </div>

        {/* MCU devices */}
        <div className="health-card">
          <p className="health-label">MCU Units</p>
          <div className="health-metric">
            <div className="metric-value">
              <span className="online">{health.onlineMcus}</span>
              <span className="divider">/</span>
              <span className="total">{health.totalMcus}</span>
            </div>
            <div className="health-bar">
              <div className="health-fill" style={{ width: `${mcuPercentage}%` }}></div>
            </div>
            <p className="health-pct">{mcuPercentage.toFixed(0)}% Online</p>
          </div>
        </div>

        {/* Inference time */}
        <div className="health-card">
          <p className="health-label">Avg Inference Time</p>
          <div className="health-metric">
            <p className="metric-large">{health.avgInferenceTime}<span className="unit">ms</span></p>
            <p className="metric-note">Fleet average</p>
          </div>
        </div>

        {/* Updates needed */}
        <div className="health-card">
          <p className="health-label">Devices Needing Update</p>
          <div className="health-metric">
            <p className="metric-large">{health.devicesNeedingUpdate}</p>
            <button className="update-btn" onClick={onOpenDevices}>View List →</button>
          </div>
        </div>
      </div>

      {/* Model version distribution */}
      <div className="model-distribution">
        <p className="dist-title">Model Version Distribution</p>
        <div className="dist-chart">
          <div className="distribution-ring">
            <div
              className="ring"
              style={{ background: `conic-gradient(#f5c800 0 75%, rgba(255,255,255,0.08) 75% 100%)` }}
            >
              <div className="ring-center">
                <span className="ring-value">{health.modelVersion}</span>
                <span className="ring-label">Current</span>
              </div>
            </div>
          </div>
          {modelVersionDistribution.map((item) => (
            <div key={item.version} className="dist-item">
              <div className="dist-label">{item.version}</div>
              <div className="dist-bar-container">
                <div className="dist-bar" style={{ width: `${item.percentage}%` }}></div>
              </div>
              <div className="dist-count">
                {item.count} ({item.percentage}%)
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .system-health {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .health-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .health-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 12px;
        }

        .health-label {
          font-size: 10px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 8px 0;
          font-weight: 600;
        }

        .health-metric {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .metric-value {
          font-size: 18px;
          font-weight: 700;
          color: var(--text);
          font-family: var(--mono);
          display: flex;
          align-items: baseline;
          gap: 2px;
        }

        .online {
          color: #00c853;
        }

        .divider {
          color: var(--text3);
          font-size: 14px;
        }

        .total {
          color: var(--text2);
          font-size: 14px;
        }

        .health-bar {
          width: 100%;
          height: 8px;
          background: var(--bg);
          border-radius: 2px;
          overflow: hidden;
        }

        .health-fill {
          height: 100%;
          background: linear-gradient(90deg, #00c853, #4caf50);
          transition: width 0.3s ease;
        }

        .health-pct {
          font-size: 10px;
          color: var(--text2);
          margin: 0;
          font-family: var(--mono);
        }

        .metric-large {
          font-size: 20px;
          font-weight: 700;
          color: var(--yellow);
          margin: 0 0 4px 0;
          font-family: var(--mono);
        }

        .unit {
          font-size: 12px;
          color: var(--text2);
          margin-left: 2px;
        }

        .metric-note {
          font-size: 10px;
          color: var(--text2);
          margin: 0;
        }

        .update-btn {
          padding: 4px 8px;
          font-size: 10px;
          background: var(--yellow);
          color: #000;
          border: none;
          border-radius: 2px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .update-btn:hover {
          background: var(--yellow2);
        }

        .model-distribution {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 12px;
        }

        .distribution-ring {
          display: flex;
          justify-content: center;
          padding-bottom: 4px;
        }

        .ring {
          width: 132px;
          height: 132px;
          border-radius: 50%;
          padding: 10px;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
        }

        .ring-center {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(180deg, rgba(10, 11, 13, 0.96), rgba(19, 22, 28, 0.98));
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
        }

        .ring-value {
          font-family: var(--mono);
          font-size: 18px;
          color: var(--yellow);
          font-weight: 700;
        }

        .ring-label {
          margin-top: 4px;
          font-size: 10px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .dist-title {
          font-size: 11px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 12px 0;
          font-weight: 600;
        }

        .dist-chart {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .dist-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dist-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--text);
          font-family: var(--mono);
          min-width: 60px;
        }

        .dist-bar-container {
          flex: 1;
          height: 18px;
          background: var(--bg);
          border-radius: 2px;
          overflow: hidden;
        }

        .dist-bar {
          height: 100%;
          background: linear-gradient(90deg, #f5c800, #ffd832);
          transition: width 0.3s ease;
        }

        .dist-count {
          font-size: 10px;
          color: var(--text2);
          font-family: var(--mono);
          text-align: right;
          min-width: 60px;
        }
      `}</style>
    </div>
  );
}
