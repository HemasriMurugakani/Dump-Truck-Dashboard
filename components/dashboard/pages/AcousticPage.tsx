import type { RefObject } from "react";

type AcousticPageProps = {
  peakFreq: number;
  spectrumCanvasRef: RefObject<HTMLCanvasElement>;
  spectrogramCanvasRef: RefObject<HTMLCanvasElement>;
  historicalCanvasRef: RefObject<HTMLCanvasElement>;
};

export function AcousticPage({
  peakFreq,
  spectrumCanvasRef,
  spectrogramCanvasRef,
  historicalCanvasRef,
}: AcousticPageProps) {
  return (
    <div className="page active">
      <div className="page-title" style={{ marginBottom: "20px" }}>Acoustic Analysis Lab</div>
      <div className="acoustic-grid">
        <div className="panel">
          <div className="panel-title">Live Spectrum Analyzer</div>
          <div className="spectrum-container"><canvas ref={spectrumCanvasRef} className="spectrum-canvas" /></div>
          <div style={{ display: "flex", gap: "16px", marginTop: "8px", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text2)" }}>
            <span>Peak freq: <span style={{ color: "var(--yellow)" }}>{peakFreq} Hz</span></span>
            <span>Baseline: <span style={{ color: "var(--text)" }}>847 Hz</span></span>
            <span>Δ: <span style={{ color: "var(--red)" }}>-56 Hz</span></span>
            <span>RMS: <span style={{ color: "var(--text)" }}>0.73</span></span>
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">Spectrogram — 30s Window</div>
          <canvas ref={spectrogramCanvasRef} width={400} height={220} style={{ width: "100%", borderRadius: "6px", background: "#0a1a0a" }} />
        </div>
        <div>
          <div className="panel" style={{ marginBottom: "14px" }}>
            <div className="panel-title">Material Classifier v2.1</div>
            <div className="classifier-bar"><div className="cls-header"><span>Wet clay</span><span>82.3%</span></div><div className="cls-track"><div className="cls-fill" style={{ width: "82.3%" }} /></div></div>
            <div className="classifier-bar"><div className="cls-header"><span>Fine ore</span><span>41.7%</span></div><div className="cls-track"><div className="cls-fill" style={{ width: "41.7%" }} /></div></div>
            <div className="classifier-bar"><div className="cls-header"><span>Dry rock</span><span>8.2%</span></div><div className="cls-track"><div className="cls-fill" style={{ width: "8.2%", background: "var(--orange)" }} /></div></div>
            <div className="classifier-bar"><div className="cls-header"><span>Sand/gravel</span><span>2.1%</span></div><div className="cls-track"><div className="cls-fill" style={{ width: "2.1%", background: "var(--text3)" }} /></div></div>
            <div className="material-badge wet-clay" style={{ marginTop: "14px" }}>
              <div className="material-type">WET CLAY</div>
              <div className="material-conf">(HIGH CONFIDENCE)</div>
            </div>
            <div className="protocol-box">
              <div className="protocol-title">Recommended Protocol:</div>
              <div className="protocol-line">EXTENDED VIBRATION — 5s duration</div>
              <div className="protocol-line">INCREASE BED ANGLE +4.8°</div>
              <div className="protocol-flag">⚑ FLAG FOR INSPECTION AFTER CYCLE</div>
            </div>
          </div>
        </div>
      </div>
      <div className="acoustic-bottom">
        <div className="panel">
          <div className="panel-title">Historical Acoustic Signatures</div>
          <canvas ref={historicalCanvasRef} style={{ width: "100%", height: "200px" }} />
          <div style={{ marginTop: "8px", background: "rgba(245,200,0,0.08)", border: "1px solid rgba(245,200,0,0.2)", borderRadius: "5px", padding: "8px 12px", fontSize: "11px", color: "var(--yellow)", fontFamily: "var(--mono)" }}>
            ⚠ PATTERN: Material moisture increasing. Recommend operator alert.
          </div>
        </div>
        <div className="panel">
          <div className="panel-title">Vibration Response Log</div>
          <table className="vib-table">
            <thead><tr><th>CYCLE</th><th>CB</th><th>V.CYC</th><th>DUR</th><th>RESULT</th></tr></thead>
            <tbody>
              <tr><td>48</td><td>5.3t</td><td>2</td><td>8s</td><td className="cleared-badge">✓ CLEARED</td></tr>
              <tr><td>47</td><td>3.8t</td><td>1</td><td>4s</td><td className="cleared-badge">✓ CLEARED</td></tr>
              <tr><td>46</td><td>2.1t</td><td>1</td><td>4s</td><td className="cleared-badge">✓ CLEARED</td></tr>
              <tr><td>45</td><td>0.8t</td><td>1</td><td>2s</td><td className="cleared-badge">✓ CLEARED</td></tr>
              <tr><td>44</td><td>1.1t</td><td>1</td><td>3s</td><td className="cleared-badge">✓ CLEARED</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
