import type { RefObject } from "react";
import { logLines } from "../data";

type DetailPageProps = {
  timelinePos: number;
  cycleCanvasRef: RefObject<HTMLCanvasElement>;
  onZoneClick: (zone: string) => void;
  sensorBars: {
    load: number[];
    acoustic: number[];
    camera: number[];
    ultrasonic: number[];
  };
};

export function DetailPage({ timelinePos, cycleCanvasRef, onZoneClick, sensorBars }: DetailPageProps) {
  return (
    <div className="page active">
      <div className="page-header">
        <div>
          <div className="page-title">CAT 793-11</div>
          <div style={{ fontSize: "12px", color: "var(--text3)", fontFamily: "var(--mono)", marginTop: "2px" }}>Caterpillar 793F | 240t payload class | CAT C175-16 | 2,610 HP</div>
        </div>
      </div>
      <div className="detail-layout">
        <div className="detail-left">
          <div className="panel">
            <div className="panel-title">Truck Info</div>
            <div className="info-row"><span className="info-label">Operator</span><span className="info-val">R. Krishnamurthy</span></div>
            <div className="info-row"><span className="info-label">Shift start</span><span className="info-val">06:00 AEST</span></div>
            <div className="info-row"><span className="info-label">Total cycles</span><span className="info-val">47</span></div>
            <div style={{ marginTop: "12px" }} className="alert-banner">CARRY-BACK DETECTED</div>
          </div>
          <div className="panel">
            <div className="panel-title yellow">Current Cycle #48</div>
            <div className="info-row"><span className="info-label">Load time</span><span className="info-val">06:14</span></div>
            <div className="info-row"><span className="info-label">Haul distance</span><span className="info-val">2.3 km</span></div>
            <div className="info-row"><span className="info-label">Dump start</span><span className="info-val">10:51:22</span></div>
            <div className="info-row"><span className="info-label">Dump duration</span><span className="info-val">43s</span></div>
            <div className="info-row"><span className="info-label">Bed angle</span><span className="info-val red">47.3°</span></div>
            <div className="info-row"><span className="info-label">Optimal angle</span><span className="info-val yellow">52.1°</span></div>
            <div className="info-row"><span className="info-label">Material type</span><span className="info-val">Wet clay / fine ore</span></div>
            <div className="info-row"><span className="info-label">Moisture</span><span className="info-val">18.4%</span></div>
          </div>
          <div className="panel">
            <div className="panel-title">Last 10 Cycles</div>
            <div className="cycle-chart-container"><canvas ref={cycleCanvasRef} /></div>
          </div>
        </div>
        <div className="detail-center">
          <div className="panel">
            <div className="bed-viz-title">
              Bed Visualization
              <div className="view-toggle">
                <button className="view-btn active">3D SIDE</button>
                <button className="view-btn">TOP</button>
              </div>
            </div>
            <div className="bed-3d">
              <svg className="bed-svg" viewBox="0 0 700 380" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="bedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#1e2330" }} />
                    <stop offset="100%" style={{ stopColor: "#141820" }} />
                  </linearGradient>
                </defs>
                <polygon points="120,40 580,40 640,340 60,340" fill="url(#bedGrad)" stroke="#252a35" strokeWidth="2" />
                <line x1="350" y1="40" x2="350" y2="340" stroke="#252a35" strokeWidth="1" strokeDasharray="4,4" />
                <line x1="120" y1="190" x2="640" y2="190" stroke="#252a35" strokeWidth="1" strokeDasharray="4,4" />
              </svg>
              <button className="zone-circle alert" style={{ left: "27%", top: "35%" }} onClick={() => onZoneClick("FL")}>FL<div className="zone-sub">5.3t</div></button>
              <div className="zone-circle clear" style={{ left: "50%", top: "35%" }}>FC<div className="zone-sub">0.0t</div></div>
              <div className="zone-circle clear" style={{ left: "73%", top: "35%" }}>FR<div className="zone-sub">0.0t</div></div>
              <button className="zone-circle alert" style={{ left: "27%", top: "70%" }} onClick={() => onZoneClick("RL")}>RL<div className="zone-sub">2.1t</div></button>
              <div className="zone-circle clear" style={{ left: "50%", top: "70%" }}>RC<div className="zone-sub">0.0t</div></div>
              <div className="zone-circle clear" style={{ left: "73%", top: "70%" }}>RR<div className="zone-sub">0.0t</div></div>
            </div>
          </div>
          <div className="timeline-bar">
            <div className="timeline-title">Dump Cycle Timeline</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}><span style={{ fontSize: "10px", color: "var(--text3)", fontFamily: "var(--mono)" }}>RAISED</span><span style={{ fontSize: "10px", color: "var(--text3)", fontFamily: "var(--mono)" }}>LOWERED</span></div>
            <div className="timeline-track">
              <div className="timeline-fill" style={{ width: `${timelinePos}%` }}>
                <div className="timeline-thumb" />
              </div>
            </div>
            <div className="timeline-status">T+43s — Vibration sequence initiated</div>
          </div>
        </div>
        <div className="detail-right">
          <div className="panel">
            <div className="panel-title">Sensor Telemetry</div>
            {[
              ["Load Cell", "5.3t detected", "ok", sensorBars.load, "bar-yellow"],
              ["Acoustic Array", "-56Hz deviation", "warn", sensorBars.acoustic, "bar-red"],
              ["Camera (IP67)", "FL, RL zones", "ok", sensorBars.camera, "bar-green"],
              ["Ultrasonic", "12.3cm avg", "ok", sensorBars.ultrasonic, "bar-blue"],
            ].map(([name, value, cls, bars, barClass]) => (
              <div className="sensor-row" key={String(name)}>
                <div className="sensor-header"><span className="sensor-name">{String(name)}</span><span className={`sensor-val ${cls}`}>{String(value)}</span></div>
                <div className="sensor-bars">{(bars as number[]).map((h, idx) => <div key={idx} className={`sensor-bar ${String(barClass)}`} style={{ height: `${h}%` }} />)}</div>
              </div>
            ))}
          </div>
          <div className="panel">
            <div className="panel-title">AI Decision Log</div>
            <div className="ai-log">{logLines.map((line) => <div key={`${line.time}-${line.key}`} className={`log-line ${line.cls}`}><span className="time">[{line.time}]</span> <span className="key">{line.key}</span><span className="val"> {line.val}</span></div>)}</div>
          </div>
          <div className="action-panel">
            <div className="action-title">Recommended Action</div>
            <div className="action-row"><span className="action-badge immediate">IMMEDIATE</span><span className="action-text">Increase dump angle to 52.1°</span></div>
            <div className="action-row"><span className="action-badge scheduled">SCHEDULED</span><span className="action-text">Bed surface inspection at shift end</span></div>
            <div className="action-row"><span className="action-badge note">NOTE</span><span className="action-text">Material moisture 18.4% — wet clay protocol active</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
