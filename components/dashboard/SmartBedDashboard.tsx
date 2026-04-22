"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SidebarNav } from "./SidebarNav";
import { AcousticPage } from "./pages/AcousticPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ConfigPage } from "./pages/ConfigPage";
import { DetailPage } from "./pages/DetailPage";
import { FleetPage } from "./pages/FleetPage";
import { MaintenancePage } from "./pages/MaintenancePage";
import type { PageName, RoiState } from "./types";

function formatRoi(roi: RoiState) {
  const cbKg = roi.payload * 1000 * (roi.cb / 100);
  const cycles = 35;
  const annualCycles = roi.fleet * cycles * 365;
  const payloadRecovered = (annualCycles * cbKg / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 });
  const fuelSaved = Math.round((annualCycles * 0.65 * roi.cb) / 3.2).toLocaleString();
  const savings = (((annualCycles * cbKg) / 1000) * 46.5 / 1000000).toFixed(1);

  return {
    payloadRecovered,
    fuelSaved,
    savings,
  };
}

export function SmartBedDashboard() {
  const [activePage, setActivePage] = useState<PageName>("fleet");
  const [timelinePos, setTimelinePos] = useState(72);
  const [roi, setRoi] = useState<RoiState>({ fleet: 100, payload: 240, cb: 3.2 });
  const [analyticsRange, setAnalyticsRange] = useState("today");
  const [saveLabel, setSaveLabel] = useState("SAVE CONFIG");
  const [peakFreq, setPeakFreq] = useState(791);
  const [acousticSensitivity, setAcousticSensitivity] = useState("HIGH");
  const [cameraRes, setCameraRes] = useState("1080p");

  const cycleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrogramCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const historicalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const payloadCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const roiSummary = useMemo(() => formatRoi(roi), [roi]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTimelinePos((prev) => {
        const next = Math.min(100, prev + Math.random() * 1.2);
        return next >= 100 ? 0 : next;
      });
    }, 800);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (activePage !== "detail") {
      return;
    }

    const canvas = cycleCanvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth ?? 300;
    const height = 80;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.height = `${height}px`;
    canvas.style.width = `${width}px`;
    ctx.scale(dpr, dpr);

    const data = [0.2, 0.8, 0.3, 3.8, 0.4, 2.1, 0.8, 1.1, 0.5, 5.3];
    const maxV = Math.max(...data);
    const bw = (width - 20) / data.length;
    ctx.clearRect(0, 0, width, height);

    data.forEach((value, index) => {
      const bh = (value / maxV) * (height - 20);
      const x = 10 + index * bw + 2;
      ctx.fillStyle = value > 3 ? "rgba(229,57,53,0.8)" : value > 1 ? "rgba(255,109,0,0.8)" : "rgba(245,200,0,0.6)";
      ctx.beginPath();
      ctx.roundRect(x, height - bh - 5, bw - 4, bh, 2);
      ctx.fill();
      ctx.fillStyle = "#5a6275";
      ctx.font = "8px var(--font-space-mono)";
      ctx.textAlign = "center";
      ctx.fillText(String(38 + index), x + (bw - 4) / 2, height - 1);
    });
  }, [activePage]);

  useEffect(() => {
    if (activePage !== "analytics") {
      return;
    }

    const canvas = payloadCanvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement?.clientWidth ?? 500;
    const h = 220;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.height = `${h}px`;
    canvas.style.width = `${w}px`;
    ctx.scale(dpr, dpr);

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const vals = [800, 650, 700, 1100, 1550, 1700, 1847];
    const target = 2000;
    const pad = { l: 40, r: 20, t: 20, b: 30 };
    const cw = w - pad.l - pad.r;
    const ch = h - pad.t - pad.b;

    const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + ch);
    grad.addColorStop(0, "rgba(245,200,0,0.35)");
    grad.addColorStop(1, "rgba(245,200,0,0.03)");

    ctx.beginPath();
    vals.forEach((v, i) => {
      const x = pad.l + (i / (days.length - 1)) * cw;
      const y = pad.t + ch - (v / target) * ch;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.lineTo(pad.l + cw, pad.t + ch);
    ctx.lineTo(pad.l, pad.t + ch);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.strokeStyle = "#f5c800";
    ctx.lineWidth = 2.5;
    vals.forEach((v, i) => {
      const x = pad.l + (i / (days.length - 1)) * cw;
      const y = pad.t + ch - (v / target) * ch;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, pad.t);
    ctx.lineTo(pad.l + cw, pad.t);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#5a6275";
    ctx.font = "10px var(--font-space-mono)";
    ctx.textAlign = "center";
    days.forEach((d, i) => {
      ctx.fillText(d, pad.l + (i / (days.length - 1)) * cw, h - 4);
    });

    const ax = pad.l + (3 / (days.length - 1)) * cw + 10;
    const ay = pad.t + ch - (vals[3] / target) * ch - 15;
    ctx.fillStyle = "#f5c800";
    ctx.font = "10px var(--font-barlow-condensed)";
    ctx.textAlign = "left";
    ctx.fillText("SmartBed activated Day 3 -> gap closes", ax + 4, ay);
    ctx.strokeStyle = "rgba(245,200,0,0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ax, ay + 3);
    ctx.lineTo(ax - 6, ay + 12);
    ctx.stroke();
  }, [activePage]);

  useEffect(() => {
    if (activePage !== "acoustic") {
      return;
    }

    const spectrumCanvas = spectrumCanvasRef.current;
    const spectrogramCanvas = spectrogramCanvasRef.current;
    const historicalCanvas = historicalCanvasRef.current;

    if (!spectrumCanvas || !spectrogramCanvas || !historicalCanvas) {
      return;
    }

    let spectrumFrame = 0;
    let spectrogramFrame = 0;

    const drawSpectrum = () => {
      const ctx = spectrumCanvas.getContext("2d");
      if (!ctx) {
        return;
      }
      const dpr = window.devicePixelRatio || 1;
      const w = spectrumCanvas.parentElement?.clientWidth ?? 400;
      const h = 220;
      spectrumCanvas.width = w * dpr;
      spectrumCanvas.height = h * dpr;
      spectrumCanvas.style.width = `${w}px`;
      spectrumCanvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);

      let phase = 0;
      const frame = () => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#0d1117";
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = "#1e2330";
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i += 1) {
          const y = h * 0.2 + i * (h * 0.6 / 4);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        const baseY = h * 0.38;
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = "rgba(229,57,53,0.5)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        ctx.lineTo(w, baseY);
        ctx.stroke();
        ctx.setLineDash([]);

        const peakX = w * 0.39;
        ctx.fillStyle = "rgba(200,0,0,0.25)";
        ctx.fillRect(peakX - 14, 0, 28, h);

        const peak = 791 + Math.sin(phase * 0.7) * 8;
        setPeakFreq(Math.round(peak));
        ctx.beginPath();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        for (let x = 0; x < w; x += 1) {
          const freq = (x / w) * 2000;
          const d = freq - peak;
          const gauss = Math.exp(-(d * d) / 8000) * 0.85;
          const noise = (Math.random() - 0.5) * 0.04;
          const y = h - gauss * (h * 0.72) - noise * h - h * 0.08;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = "rgba(245,200,0,0.6)";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        const baseFreq = 847;
        for (let x = 0; x < w; x += 1) {
          const freq = (x / w) * 2000;
          const d = freq - baseFreq;
          const gauss = Math.exp(-(d * d) / 8000) * 0.75;
          const y = h - gauss * (h * 0.65) - h * 0.08;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#f5c800";
        ctx.font = "11px var(--font-space-mono)";
        ctx.fillText(`${Math.round(peak)}Hz`, peakX - 18, 18);

        ctx.fillStyle = "#5a6275";
        ctx.font = "10px var(--font-space-mono)";
        ctx.textAlign = "left";
        ctx.fillText("0 Hz", 4, h - 4);
        ctx.textAlign = "right";
        ctx.fillText("2000 Hz", w - 4, h - 4);

        phase += 0.05;
        spectrumFrame = requestAnimationFrame(frame);
      };

      frame();
    };

    const drawSpectrogram = () => {
      const ctx = spectrogramCanvas.getContext("2d");
      if (!ctx) {
        return;
      }
      const w = spectrogramCanvas.width;
      const h = spectrogramCanvas.height;

      const frame = () => {
        const img = ctx.getImageData(1, 0, w - 1, h);
        ctx.putImageData(img, 0, 0);

        for (let y = 0; y < h; y += 1) {
          const freq = (1 - y / h) * 1200;
          let intensity = 0;
          if (freq > 700 && freq < 850) {
            intensity = 0.7 + Math.random() * 0.3;
          } else if (freq > 400 && freq < 1000) {
            intensity = 0.1 + Math.random() * 0.2;
          } else {
            intensity = Math.random() * 0.1;
          }
          const r = Math.floor(intensity * 100);
          const g = Math.floor(intensity * 255);
          const b = Math.floor(intensity * 30);
          ctx.fillStyle = `rgb(${r},${g},${b})`;
          ctx.fillRect(w - 1, y, 1, 1);
        }

        spectrogramFrame = requestAnimationFrame(frame);
      };

      frame();
    };

    const drawHistorical = () => {
      const ctx = historicalCanvas.getContext("2d");
      if (!ctx) {
        return;
      }
      const dpr = window.devicePixelRatio || 1;
      const w = historicalCanvas.parentElement?.clientWidth ?? 400;
      const h = 200;
      historicalCanvas.width = w * dpr;
      historicalCanvas.height = h * dpr;
      historicalCanvas.style.height = `${h}px`;
      historicalCanvas.style.width = `${w}px`;
      ctx.scale(dpr, dpr);
      ctx.fillStyle = "#0d1117";
      ctx.fillRect(0, 0, w, h);

      const data = Array.from({ length: 40 }, (_, i) => (i > 34 ? 40 + Math.random() * 30 : 5 + Math.random() * 20));
      const maxV = 80;
      const minV = 0;

      [
        [20, "rgba(245,200,0,0.3)"],
        [40, "rgba(229,57,53,0.3)"],
      ].forEach(([v, c]) => {
        const y = h - 10 - (Number(v) / (maxV - minV)) * (h - 20);
        ctx.strokeStyle = String(c);
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(w - 10, y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      data.forEach((v, i) => {
        const x = 30 + (i / (data.length - 1)) * (w - 40);
        const y = h - 10 - (v / (maxV - minV)) * (h - 20);
        ctx.fillStyle = v > 40 ? "#e53935" : v > 20 ? "#ff6d00" : "#f5c800";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        if (i > 0) {
          const px = 30 + ((i - 1) / (data.length - 1)) * (w - 40);
          const py = h - 10 - (data[i - 1] / (maxV - minV)) * (h - 20);
          ctx.strokeStyle = v > 40 ? "rgba(229,57,53,0.5)" : v > 20 ? "rgba(255,109,0,0.5)" : "rgba(245,200,0,0.3)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      });

      ctx.fillStyle = "#5a6275";
      ctx.font = "9px var(--font-space-mono)";
      ctx.textAlign = "center";
      ctx.fillText("Cycle Number", w / 2, h - 1);
      ctx.save();
      ctx.translate(14, h / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("Deviation (Hz)", 0, 0);
      ctx.restore();
    };

    drawSpectrum();
    drawSpectrogram();
    drawHistorical();

    return () => {
      if (spectrumFrame) {
        cancelAnimationFrame(spectrumFrame);
      }
      if (spectrogramFrame) {
        cancelAnimationFrame(spectrogramFrame);
      }
    };
  }, [activePage]);

  const sensorBars = useMemo(
    () => ({
      load: Array.from({ length: 18 }, () => 20 + Math.random() * 80),
      acoustic: Array.from({ length: 18 }, () => 20 + Math.random() * 80),
      camera: Array.from({ length: 18 }, () => 20 + Math.random() * 80),
      ultrasonic: Array.from({ length: 18 }, () => 20 + Math.random() * 80),
    }),
    [],
  );

  const showAlert = () => {
    window.alert("Alert: CAT 793-11 - CARRY-BACK DETECTED\nFront-Left and Rear-Left zones affected.\nAction: Vibration sequence initiated.");
  };

  const onZoneClick = (zone: string) => {
    window.alert(`Zone ${zone}: Residue detected - 5.3t carry-back. Vibration sequence recommended.`);
  };

  const onSaveConfig = () => {
    setSaveLabel("CONFIG SAVED ✓");
    window.setTimeout(() => setSaveLabel("SAVE CONFIG"), 2000);
  };

  return (
    <div className="app relative">
      <header className="topbar">
        <div className="logo-mark">
          <svg viewBox="0 0 24 24">
            <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
          </svg>
        </div>
        <div className="logo-text">
          <div className="name">SmartBed</div>
          <div className="sub">Detection System</div>
        </div>
        <div className="site-info">Mine Site Alpha • Eastern Operations</div>
        <div className="topbar-right">
          <div className="online-badge">
            <span className="pulse-dot" />ONLINE
          </div>
          <button className="notif-btn" onClick={showAlert}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeWidth="2" strokeLinecap="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <div className="notif-badge">1</div>
          </button>
        </div>
      </header>

      <div className="statusbar">
        <div className="status-pill"><span className="dot" style={{ background: "var(--green)" }} /><span className="label">Active Trucks</span><span className="val">8/8</span></div>
        <div className="status-pill"><span className="dot" style={{ background: "var(--red)" }} /><span className="label">Alerts</span><span className="val red">1</span></div>
        <div className="status-pill"><span className="dot" style={{ background: "var(--blue)" }} /><span className="label">Fleet Payload Today</span><span className="val yellow">1,847 t</span></div>
        <div className="status-pill"><span className="dot" style={{ background: "var(--yellow)" }} /><span className="label">Shift</span><span className="val">2 of 3</span></div>
        <div className="status-pill"><span className="label">Operator</span><span className="val">J. Ramesh</span></div>
        <div className="status-pill"><span className="label">Wind</span><span className="val">12 km/h NE</span></div>
        <div className="status-pill"><span className="label">Temp</span><span className="val">31°C</span></div>
        <div className="status-pill"><span className="label">Dust Index</span><span className="val yellow">MODERATE</span></div>
      </div>

      <div className="main">
        <SidebarNav activePage={activePage} setActivePage={setActivePage} />

        <div className="content">
          {activePage === "fleet" && <FleetPage onOpenDetail={() => setActivePage("detail")} />}

          {activePage === "detail" && (
            <DetailPage
              timelinePos={timelinePos}
              cycleCanvasRef={cycleCanvasRef}
              onZoneClick={onZoneClick}
              sensorBars={sensorBars}
            />
          )}

          {activePage === "acoustic" && (
            <AcousticPage
              peakFreq={peakFreq}
              spectrumCanvasRef={spectrumCanvasRef}
              spectrogramCanvasRef={spectrogramCanvasRef}
              historicalCanvasRef={historicalCanvasRef}
            />
          )}

          {activePage === "analytics" && (
            <AnalyticsPage
              analyticsRange={analyticsRange}
              setAnalyticsRange={setAnalyticsRange}
              payloadCanvasRef={payloadCanvasRef}
              roi={roi}
              setRoi={setRoi}
              roiSummary={roiSummary}
            />
          )}

          {activePage === "maintenance" && <MaintenancePage />}

          {activePage === "config" && (
            <ConfigPage
              acousticSensitivity={acousticSensitivity}
              setAcousticSensitivity={setAcousticSensitivity}
              cameraRes={cameraRes}
              setCameraRes={setCameraRes}
              saveLabel={saveLabel}
              onSaveConfig={onSaveConfig}
            />
          )}
        </div>
      </div>
    </div>
  );
}
