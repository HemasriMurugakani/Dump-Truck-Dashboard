import type { RefObject } from "react";
import { hmData } from "../data";
import type { RoiState, RoiSummary } from "../types";

type AnalyticsPageProps = {
  analyticsRange: string;
  setAnalyticsRange: (value: string) => void;
  payloadCanvasRef: RefObject<HTMLCanvasElement>;
  roi: RoiState;
  setRoi: (updater: (prev: RoiState) => RoiState) => void;
  roiSummary: RoiSummary;
};

export function AnalyticsPage({
  analyticsRange,
  setAnalyticsRange,
  payloadCanvasRef,
  roi,
  setRoi,
  roiSummary,
}: AnalyticsPageProps) {
  return (
    <div className="page active">
      <div className="page-header">
        <div className="page-title">Analytics &amp; Reporting</div>
        <div style={{ display: "flex", gap: "6px" }}>
          {[
            ["today", "TODAY"],
            ["week", "THIS WEEK"],
            ["month", "THIS MONTH"],
            ["custom", "CUSTOM"],
          ].map(([value, label], idx) => (
            <button key={value} className={`toggle-opt ${analyticsRange === value ? "active" : ""}`} onClick={() => setAnalyticsRange(value)} style={{ borderRadius: idx === 0 || idx === 3 ? "5px" : "0" }}>{label}</button>
          ))}
        </div>
      </div>
      <div className="kpi-grid">
        <div className="kpi-card"><div className="kpi-label">Total Payload Recovered</div><div><span className="kpi-val">847.3</span><span className="kpi-unit"> t</span></div><div className="kpi-delta pos">↑ +12.4%</div></div>
        <div className="kpi-card"><div className="kpi-label">Total Fuel Saved</div><div><span className="kpi-val">5,832</span><span className="kpi-unit"> L</span></div><div className="kpi-delta pos">↑ +8.1%</div></div>
        <div className="kpi-card"><div className="kpi-label">Avg Carry-Back Rate</div><div><span className="kpi-val">1.24</span><span className="kpi-unit">%</span></div><div className="kpi-delta neg">↓ -0.3%</div></div>
        <div className="kpi-card"><div className="kpi-label">Vibration Cycles Today</div><div><span className="kpi-val">143</span></div></div>
        <div className="kpi-card"><div className="kpi-label">System Detections</div><div><span className="kpi-val">89</span></div><div style={{ fontSize: "10px", color: "var(--blue)", fontFamily: "var(--mono)", marginTop: "3px" }}>98.9% acc</div></div>
      </div>
      <div className="analytics-grid">
        <div className="panel">
          <div className="panel-title">Payload Efficiency Timeline</div>
          <canvas ref={payloadCanvasRef} style={{ width: "100%", height: "220px" }} />
        </div>
        <div className="panel">
          <div className="panel-title">Carry-Back by Material Type</div>
          {[["Wet clay", "4.2%", 84], ["Fine ore", "2.8%", 56], ["Mixed", "1.9%", 38], ["Dry rock", "0.6%", 12]].map(([label, val, width]) => (
            <div key={String(label)} style={{ marginBottom: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text2)", marginBottom: "5px" }}><span>{String(label)}</span><span>{String(val)}</span></div>
              <div style={{ height: "14px", background: "var(--bg3)", borderRadius: "3px", overflow: "hidden" }}><div style={{ height: "100%", width: `${width}%`, background: "var(--yellow)", borderRadius: "3px" }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="analytics-bottom">
        <div className="panel">
          <div className="panel-title">Carry-Back Severity — Fleet × Day</div>
          <div className="heatmap">
            <div className="heatmap-header"><span className="heatmap-label" style={{ width: "52px" }} /><div className="heatmap-days">{hmData.days.map((d, i) => <span key={`${d}-${i}`} className="heatmap-day-label">{d}</span>)}</div></div>
            {hmData.trucks.map((truck, rowIndex) => (
              <div key={truck} className="heatmap-row">
                <span className="heatmap-truck-label">{truck}</span>
                <div className="heatmap-cells">
                  {hmData.vals[rowIndex].map((v, index) => {
                    const classes = ["excellent", "excellent", "warning", "poor"];
                    const title = ["Excellent", "Good", "Warning", "Poor"];
                    return <div key={`${truck}-${index}`} title={title[v]} className={`hm-cell ${classes[v]}`} />;
                  })}
                </div>
              </div>
            ))}
            <div className="hm-legend">
              <div className="hm-legend-item"><div className="hm-legend-dot" style={{ background: "#1a4731" }} />Excellent</div>
              <div className="hm-legend-item"><div className="hm-legend-dot" style={{ background: "#7c3d00" }} />Warning</div>
              <div className="hm-legend-item"><div className="hm-legend-dot" style={{ background: "#5c1010" }} />Poor</div>
            </div>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">ROI Calculator (Interactive)</div>
          <div className="roi-input"><div className="roi-label">Fleet size (trucks):</div><input className="roi-field" type="number" value={roi.fleet} onChange={(e) => setRoi((prev) => ({ ...prev, fleet: Number(e.target.value) || 100 }))} /></div>
          <div className="roi-input"><div className="roi-label">Avg payload (t):</div><input className="roi-field" type="number" value={roi.payload} onChange={(e) => setRoi((prev) => ({ ...prev, payload: Number(e.target.value) || 240 }))} /></div>
          <div className="roi-input"><div className="roi-label">Carry-back %:</div><input className="roi-field" type="number" step="0.1" value={roi.cb} onChange={(e) => setRoi((prev) => ({ ...prev, cb: Number(e.target.value) || 3.2 }))} /></div>
          <div className="roi-results">
            <div className="roi-result-row"><div className="roi-result-label">Annual payload recovered:</div><div className="roi-result-val">{roiSummary.payloadRecovered} t</div></div>
            <div className="roi-result-row"><div className="roi-result-label">Annual fuel saved:</div><div className="roi-result-val">{roiSummary.fuelSaved} L</div></div>
            <div className="roi-result-row"><div className="roi-result-label">Annual savings:</div><div className="roi-result-val">${roiSummary.savings}M</div></div>
            <div className="roi-result-row"><div className="roi-result-label">Payback period:</div><div className="roi-result-val">0.0 months</div></div>
          </div>
          <button className="export-btn">EXPORT REPORT ↗</button>
        </div>
        <div className="panel">
          <div className="panel-title">Alerts Summary (24h)</div>
          <table className="alerts-table">
            <thead><tr><th>TIME</th><th>TRUCK</th><th>SEV</th><th>CB</th><th>RES</th></tr></thead>
            <tbody>
              <tr><td>10:52</td><td>793-11</td><td><span className="sev-badge high">HIGH</span></td><td>5.3t</td><td className="res-badge">✓ 8s</td></tr>
              <tr><td>09:14</td><td>785-04</td><td><span className="sev-badge med">MED</span></td><td>2.1t</td><td className="res-badge">✓ 4s</td></tr>
              <tr><td>08:33</td><td>793-02</td><td><span className="sev-badge low">LOW</span></td><td>0.8t</td><td className="res-badge">✓ 2s</td></tr>
              <tr><td>07:11</td><td>797-01</td><td><span className="sev-badge med">MED</span></td><td>1.9t</td><td className="res-badge">✓ 4s</td></tr>
              <tr><td>06:44</td><td>785-12</td><td><span className="sev-badge low">LOW</span></td><td>0.6t</td><td className="res-badge">✓ 2s</td></tr>
            </tbody>
          </table>
          <div className="resolution-rate"><div className="res-rate-val">100%</div><div className="res-rate-label">Resolution Rate</div></div>
        </div>
      </div>
    </div>
  );
}
