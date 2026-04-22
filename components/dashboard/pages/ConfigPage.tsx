type ConfigPageProps = {
  acousticSensitivity: string;
  setAcousticSensitivity: (value: string) => void;
  cameraRes: string;
  setCameraRes: (value: string) => void;
  saveLabel: string;
  onSaveConfig: () => void;
};

export function ConfigPage({
  acousticSensitivity,
  setAcousticSensitivity,
  cameraRes,
  setCameraRes,
  saveLabel,
  onSaveConfig,
}: ConfigPageProps) {
  return (
    <div className="page active">
      <div className="page-title" style={{ marginBottom: "20px" }}>System Configuration</div>
      <div className="config-grid">
        <div>
          <div className="panel" style={{ marginBottom: "16px" }}>
            <div className="config-title">Load Cell Config</div>
            <div className="config-row"><div className="config-label">Threshold (kg):</div><input className="config-input" defaultValue="500" /></div>
            <div className="config-row"><div className="config-label">Sampling rate (Hz):</div><input className="config-input" defaultValue="10" /></div>
            <div className="config-row"><div className="config-label">Calibration offset:</div><input className="config-input" defaultValue="0.023" readOnly /></div>
            <div className="config-row"><div className="config-label">Last calibrated:</div><div className="config-display">2026-04-05 06:00</div></div>
            <div style={{ marginTop: "8px" }}><span className="calibrated-badge"><span className="pulse-dot" style={{ background: "var(--green)", width: "6px", height: "6px", marginRight: "2px" }} />CALIBRATED</span></div>
          </div>
          <div className="panel" style={{ marginBottom: "16px" }}>
            <div className="config-title">Acoustic Config</div>
            <div className="config-row"><div className="config-label">Baseline capture interval (hr):</div><input className="config-input" defaultValue="24" /></div>
            <div className="config-row"><div className="config-label">Deviation threshold (Hz):</div><input className="config-input" defaultValue="15" /></div>
            <div className="config-row"><div className="config-label">Frequency range:</div><div className="config-display">200–1200 Hz</div></div>
            <div className="config-row"><div className="config-label">Sensitivity:</div><div className="toggle-group">{["HIGH", "MED", "LOW"].map((s) => <button key={s} className={`toggle-opt ${acousticSensitivity === s ? "active" : ""}`} onClick={() => setAcousticSensitivity(s)}>{s}</button>)}</div></div>
            <div className="config-row"><div className="config-label">Noise filter:</div><label className="switch"><input type="checkbox" defaultChecked /><div className="switch-track" /><div className="switch-thumb" /></label></div>
          </div>
          <div className="panel">
            <div className="config-title">Camera Config</div>
            <div className="config-row"><div className="config-label">Resolution:</div><div className="toggle-group">{["1080p", "720p"].map((res) => <button key={res} className={`toggle-opt ${cameraRes === res ? "active" : ""}`} onClick={() => setCameraRes(res)}>{res}</button>)}</div></div>
            <div className="config-row"><div className="config-label">Detection model:</div><div className="config-display">YOLOv8-mining v2.3</div></div>
            <div className="config-row"><div className="config-label">Confidence threshold:</div><input className="config-input" defaultValue="0.85" /></div>
            <div className="config-row"><div className="config-label">Night mode:</div><div className="config-display">AUTO</div></div>
          </div>
          <div className="panel" style={{ marginTop: "16px" }}>
            <div className="config-title">Vibrator Config</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="config-row"><div className="config-label">Min duration (s):</div><input className="config-input" defaultValue="2" /></div>
              <div className="config-row"><div className="config-label">Max duration (s):</div><input className="config-input" defaultValue="8" /></div>
            </div>
            <div className="config-row"><div className="config-label">Max cycles per dump:</div><input className="config-input" defaultValue="3" /></div>
            <div className="config-row"><div className="config-label">Frequency (Hz):</div><input className="config-input" defaultValue="25" /></div>
            <div className="config-row"><div className="config-label">Cool-down period (s):</div><input className="config-input" defaultValue="30" /></div>
          </div>
          <button className="save-btn" onClick={onSaveConfig}>{saveLabel}</button>
        </div>
        <div>
          <div className="panel" style={{ marginBottom: "16px" }}>
            <div className="config-title">Hardware Topology</div>
            <div className="topo-container" style={{ height: "320px" }}>
              <svg className="topo-svg" viewBox="0 0 700 300">
                <line x1="160" y1="55" x2="340" y2="130" stroke="#f5c800" strokeWidth="1.5" opacity="0.4" />
                <line x1="160" y1="130" x2="340" y2="150" stroke="#3a3d4a" strokeWidth="1.5" />
                <line x1="160" y1="205" x2="340" y2="160" stroke="#3a3d4a" strokeWidth="1.5" />
                <line x1="160" y1="245" x2="340" y2="170" stroke="#3a3d4a" strokeWidth="1.5" />
                <line x1="420" y1="150" x2="490" y2="150" stroke="#f5c800" strokeWidth="2" />
                <line x1="490" y1="150" x2="580" y2="100" stroke="#3a3d4a" strokeWidth="1.5" />
                <line x1="490" y1="150" x2="580" y2="200" stroke="#3a3d4a" strokeWidth="1.5" />
                <text x="200" y="88" fill="#5a6275" fontFamily="Space Mono" fontSize="9">USB</text>
                <text x="222" y="140" fill="#5a6275" fontFamily="Space Mono" fontSize="9">I²C</text>
                <text x="450" y="145" fill="#f5c800" fontFamily="Space Mono" fontSize="9">SPI</text>
                <text x="540" y="88" fill="#5a6275" fontFamily="Space Mono" fontSize="9">4G</text>
                <text x="530" y="195" fill="#5a6275" fontFamily="Space Mono" fontSize="9">J1939</text>
              </svg>
              <div className="topo-node" style={{ left: "50px", top: "35px" }}><div className="node-name">IP67 Camera</div><div className="node-sub">1080p</div></div>
              <div className="topo-node" style={{ left: "50px", top: "110px" }}><div className="node-name">Acoustic x2</div><div className="node-sub">I²C</div></div>
              <div className="topo-node" style={{ left: "50px", top: "185px" }}><div className="node-name">Load Cell x2</div><div className="node-sub">I²C</div></div>
              <div className="topo-node" style={{ left: "50px", top: "230px" }}><div className="node-name">Ultrasonic x2</div><div className="node-sub">I²C</div></div>
              <div className="topo-node" style={{ left: "290px", top: "120px" }}><div className="node-name">MCU STM32</div><div className="node-sub">Sensor Hub</div></div>
              <div className="topo-node highlight" style={{ left: "400px", top: "100px" }}><div className="node-name">Jetson Orin NX</div><div className="node-sub">Edge AI Compute</div><div className="node-sub">TensorRT</div></div>
              <div className="topo-node" style={{ left: "530px", top: "68px" }}><div className="node-name">Mine Control</div><div className="node-sub">4G/LTE</div></div>
              <div className="topo-node" style={{ left: "530px", top: "175px" }}><div className="node-name">Truck ECU / VIMS</div><div className="node-sub">CAN J1939</div></div>
            </div>
          </div>
          <div className="panel" style={{ marginBottom: "16px" }}>
            <div className="config-title">System Metrics</div>
            <table className="sys-table">
              <thead><tr><th>COMPONENT</th><th>TEMP</th><th>CPU/LOAD</th><th>STATUS</th></tr></thead>
              <tbody>
                <tr><td>Jetson Orin NX</td><td>61°C</td><td>43%</td><td className="sys-ok">● OK</td></tr>
                <tr><td>MCU STM32</td><td>38°C</td><td>12%</td><td className="sys-ok">● OK</td></tr>
                <tr><td>IP67 Camera</td><td>44°C</td><td>—</td><td className="sys-ok">● OK</td></tr>
                <tr><td>Acoustic Array</td><td>35°C</td><td>—</td><td className="sys-ok">● OK</td></tr>
                <tr><td>Load Cell Array</td><td>31°C</td><td>—</td><td className="sys-ok">● OK</td></tr>
                <tr><td>CAN Bus</td><td>—</td><td>12 msg/s</td><td className="sys-ok">● OK</td></tr>
                <tr><td>4G Uplink</td><td>—</td><td>2.3 Mbps</td><td className="sys-ok">● OK</td></tr>
              </tbody>
            </table>
          </div>
          <div className="panel">
            <div className="config-title">Edge AI Model Performance</div>
            <div className="edge-ai-box">
              <div className="edge-ai-item"><div className="edge-ai-label">Model</div><div className="edge-ai-val">YOLOv8-mining-v2.3</div></div>
              <div className="edge-ai-item"><div className="edge-ai-label">mAP</div><div className="edge-ai-val good">0.94</div></div>
              <div className="edge-ai-item"><div className="edge-ai-label">Inference</div><div className="edge-ai-val warn">23ms</div></div>
              <div className="edge-ai-item"><div className="edge-ai-label">Last retrained</div><div className="edge-ai-val">2026-03-28</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
