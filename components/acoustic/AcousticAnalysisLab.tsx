"use client";

import { TRUCKS, type TruckRecord } from "@/lib/mockData";
import { Download, Pause, Play, Radio, Waves } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type SpectrumPoint = {
  hz: number;
  baseline: number;
  current: number;
};

type MaterialKey = "wetClay" | "fineOre" | "dryRock" | "sandGravel";

type MaterialState = Record<MaterialKey, number>;

type HistoryPoint = {
  cycle: number;
  deviation: number;
  cbTon: number;
  vCycles: number;
  duration: number;
  result: "CLEARED" | "PARTIAL" | "FAILED";
  timestamp: string;
};

const MATERIAL_LABEL: Record<MaterialKey, string> = {
  wetClay: "Wet clay",
  fineOre: "Fine ore",
  dryRock: "Dry rock",
  sandGravel: "Sand/gravel",
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hashNumber(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0);
}

function seededNoise(seed: number, i: number, t: number) {
  return Math.sin(seed * 0.001 + i * 0.29 + t * 0.017) * 0.5 + Math.cos(seed * 0.0004 + i * 0.11 + t * 0.023) * 0.5;
}

function generateSpectrum(truck: TruckRecord, tick: number): SpectrumPoint[] {
  const seed = hashNumber(truck.id + truck.operator);
  const center = clamp(truck.sensors.acoustic.peakFreq + truck.sensors.acoustic.deviation * 0.42 + Math.sin(tick * 0.07) * 14, 240, 1750);

  const points: SpectrumPoint[] = [];
  for (let hz = 0; hz <= 2000; hz += 25) {
    const g1 = Math.exp(-Math.pow(hz - center, 2) / (2 * 110 * 110)) * 58;
    const g2 = Math.exp(-Math.pow(hz - (center + 170), 2) / (2 * 170 * 170)) * 20;
    const floor = 6 + (Math.sin(hz * 0.008 + tick * 0.04) + 1) * 3;
    const baselinePeak = Math.exp(-Math.pow(hz - truck.sensors.acoustic.baseline, 2) / (2 * 150 * 150)) * 42;

    const baseline = clamp(floor + baselinePeak * 0.75 + seededNoise(seed, hz, 10) * 1.4, 0, 98);
    const current = clamp(floor + g1 + g2 + seededNoise(seed, hz, tick) * 3.5, 0, 100);

    points.push({ hz, baseline, current });
  }
  return points;
}

function normaliseMaterial(state: MaterialState): MaterialState {
  const sum = state.wetClay + state.fineOre + state.dryRock + state.sandGravel;
  return {
    wetClay: +(state.wetClay / sum * 100).toFixed(1),
    fineOre: +(state.fineOre / sum * 100).toFixed(1),
    dryRock: +(state.dryRock / sum * 100).toFixed(1),
    sandGravel: +(state.sandGravel / sum * 100).toFixed(1),
  };
}

function initialMaterials(truck: TruckRecord): MaterialState {
  const wetBias = clamp(45 + truck.carryBackPct * 18, 18, 84);
  const fineBias = clamp(30 + Math.abs(truck.sensors.acoustic.deviation) * 0.18, 8, 70);
  const dryBias = clamp(16 - truck.carryBackPct * 2.2, 3, 30);
  const sandBias = clamp(8 - truck.carryBackPct * 0.9, 2, 18);
  return normaliseMaterial({ wetClay: wetBias, fineOre: fineBias, dryRock: dryBias, sandGravel: sandBias });
}

function evolveMaterials(previous: MaterialState, truck: TruckRecord, phase: number): MaterialState {
  const next = {
    wetClay: clamp(previous.wetClay + Math.sin(phase * 0.9) * 2.2 + truck.carryBackPct * 0.38, 8, 92),
    fineOre: clamp(previous.fineOre + Math.cos(phase * 0.8) * 1.8 + Math.abs(truck.sensors.acoustic.deviation) * 0.05, 4, 88),
    dryRock: clamp(previous.dryRock - Math.sin(phase * 0.7) * 1.4 - truck.carryBackPct * 0.1, 1, 35),
    sandGravel: clamp(previous.sandGravel - Math.cos(phase * 0.5) * 0.7, 1, 24),
  };
  return normaliseMaterial(next);
}

function formatClock(ts: string) {
  return new Date(ts).toLocaleTimeString("en-AU", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Australia/Brisbane",
  });
}

function buildHistory(truck: TruckRecord): HistoryPoint[] {
  const seed = hashNumber(truck.id);
  const start = Math.max(1, truck.cyclesTotal - 39);
  const points: HistoryPoint[] = [];

  for (let i = 0; i < 40; i += 1) {
    const cycle = start + i;
    const trend = i * 0.62;
    const wave = Math.sin(i * 0.45 + seed * 0.0003) * 10;
    const deviation = clamp(Math.abs(truck.sensors.acoustic.deviation) * 0.42 + trend + wave + (seededNoise(seed, i, cycle) + 1) * 5, 2, 68);
    const cbTon = +(clamp(truck.carryBackKg / 1000 * (0.35 + i * 0.012 + Math.abs(Math.sin(i * 0.22)) * 0.6), 0.2, 7.6)).toFixed(1);
    const result: HistoryPoint["result"] = deviation >= 43 ? "FAILED" : deviation >= 24 ? "PARTIAL" : "CLEARED";
    const vCycles = result === "FAILED" ? 3 : result === "PARTIAL" ? 2 : 1;
    const duration = result === "FAILED" ? 10 : result === "PARTIAL" ? 7 : 4;

    points.push({
      cycle,
      deviation: +deviation.toFixed(1),
      cbTon,
      vCycles,
      duration,
      result,
      timestamp: new Date(Date.now() - (40 - i) * 82_000).toISOString(),
    });
  }

  return points;
}

function energyToColor(value: number) {
  const v = clamp(value, 0, 1);
  if (v < 0.22) {
    return `rgb(0, ${Math.round(25 + v * 70)}, 0)`;
  }
  if (v < 0.58) {
    return `rgb(${Math.round((v - 0.22) * 40)}, ${Math.round(85 + (v - 0.22) * 330)}, 0)`;
  }
  return `rgb(${Math.round(160 + (v - 0.58) * 220)}, ${Math.round(190 + (v - 0.58) * 85)}, 0)`;
}

function MiniDot(props: { cx?: number; cy?: number; payload?: HistoryPoint; onPointSelect: (p: HistoryPoint) => void }) {
  const { cx = 0, cy = 0, payload, onPointSelect } = props;
  if (!payload) {
    return null;
  }

  const critical = payload.deviation >= 43;
  const warning = payload.deviation >= 24;
  const fill = critical ? "#EF4444" : warning ? "#F97316" : "#22C55E";

  return (
    <g onClick={() => onPointSelect(payload)} style={{ cursor: "pointer" }}>
      {critical ? <circle cx={cx} cy={cy} r={10} fill="#EF4444" opacity={0.2} className="smartbed-badge-pulse" /> : null}
      <circle cx={cx} cy={cy} r={critical ? 5.2 : 4} fill={fill} stroke="#090909" strokeWidth={1} />
    </g>
  );
}

function SpectrumPane({
  title,
  truck,
  tick,
  markerHz,
}: {
  title: string;
  truck: TruckRecord;
  tick: number;
  markerHz: number;
}) {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [chartWidth, setChartWidth] = useState(520);

  useEffect(() => {
    const element = chartRef.current;
    if (!element) {
      return;
    }

    const update = () => setChartWidth(Math.max(320, Math.floor(element.clientWidth)));
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const data = useMemo(() => generateSpectrum(truck, tick), [tick, truck]);
  const peak = useMemo(() => data.reduce((acc, p) => (p.current > acc.current ? p : acc), data[0]), [data]);
  const rms = useMemo(() => {
    const sqMean = data.reduce((acc, point) => acc + point.current * point.current, 0) / data.length;
    return Math.sqrt(sqMean / 100).toFixed(2);
  }, [data]);
  const delta = +(peak.hz - truck.sensors.acoustic.baseline).toFixed(0);

  return (
    <div className="rounded-lg border border-[#2B2B2B] bg-gradient-to-b from-[#131313] to-[#0D0D0D] p-3 h-full shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-[#FACC15] tracking-[0.1em]">{title}</p>
        <p className="text-xs text-[#9CA3AF]">Peak: <span className="text-[#F5F5F5] tabular-nums">{peak.hz.toFixed(2)} Hz</span></p>
      </div>
      <div ref={chartRef} className="h-[220px] relative overflow-hidden rounded-md border border-[#242424] bg-[#0A0A0A]">
        <LineChart width={chartWidth} height={220} data={data} margin={{ top: 20, right: 14, left: 2, bottom: 0 }}>
            <CartesianGrid stroke="#1E1E1E" strokeDasharray="3 3" />
            <XAxis dataKey="hz" tick={{ fill: "#6B7280", fontSize: 10 }} domain={[0, 2000]} type="number" ticks={[0, 400, 800, 1200, 1600, 2000]} />
            <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]} />
            <ReferenceLine x={markerHz} stroke="#EF4444" strokeDasharray="6 4" strokeWidth={1.4} />
            <ReferenceArea x1={Math.max(0, peak.hz - 42)} x2={Math.min(2000, peak.hz + 42)} fill="#F97316" fillOpacity={0.17} />
            <Tooltip
              cursor={{ stroke: "#F5F5F5", strokeOpacity: 0.35 }}
              contentStyle={{ background: "#0A0A0A", border: "1px solid #303030", borderRadius: 8 }}
              formatter={((value: unknown, name: unknown) => [`${Number(value ?? 0).toFixed(2)}%`, name === "current" ? "Current" : "Baseline"]) as any}
              labelFormatter={(value) => `${Number(value).toFixed(2)} Hz`}
            />
            <Line dataKey="baseline" stroke="#FACC15" strokeWidth={1.6} strokeDasharray="7 4" dot={false} isAnimationActive animationDuration={240} />
            <Line dataKey="current" stroke="#FFFFFF" strokeWidth={2} dot={false} isAnimationActive animationDuration={240} />
          </LineChart>
        <div className="absolute -top-1" style={{ left: `${peak.hz / 2000 * 100}%`, transform: "translate(-50%, -100%)" }}>
          <span className="rounded border border-[#353535] bg-[#0A0A0A] px-2 py-0.5 text-[10px] text-[#F5F5F5] tabular-nums">{peak.hz.toFixed(2)} Hz</span>
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-medium rounded-md border border-[#262626] bg-[#0C0C0C] p-2">
        <p className="text-[#9CA3AF]">Peak freq: <span className="tabular-nums text-[#F5F5F5]">{peak.hz.toFixed(0)} Hz</span></p>
        <p className="text-[#9CA3AF]">Baseline: <span className="tabular-nums text-[#F5F5F5]">{truck.sensors.acoustic.baseline} Hz</span></p>
        <p className="text-[#9CA3AF]">Δ: <span className={`tabular-nums ${delta < -20 ? "text-[#EF4444]" : "text-[#22C55E]"}`}>{delta} Hz</span></p>
        <p className="text-[#9CA3AF]">RMS: <span className="tabular-nums text-[#F5F5F5]">{rms}</span></p>
      </div>
    </div>
  );
}

export function AcousticAnalysisLab() {
  const transitionFast = "transition-all duration-200";
  const transitionMed = "transition-all duration-300";

  const [selectedTruckId, setSelectedTruckId] = useState(TRUCKS[0]?.id ?? "793-11");
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareTruckId, setCompareTruckId] = useState(TRUCKS[1]?.id ?? "793-02");
  const [spectrumTick, setSpectrumTick] = useState(0);
  const [materialTick, setMaterialTick] = useState(0);
  const [material, setMaterial] = useState<MaterialState>(() => initialMaterials(TRUCKS[0]));
  const [spectrogramPaused, setSpectrogramPaused] = useState(false);
  const [history, setHistory] = useState<HistoryPoint[]>(() => buildHistory(TRUCKS[0]));
  const [pointDetails, setPointDetails] = useState<HistoryPoint | null>(null);
  const [pageSize, setPageSize] = useState<"10" | "20" | "all">("10");
  const [domain, setDomain] = useState<[number, number]>(() => {
    const latest = buildHistory(TRUCKS[0]).at(-1)?.cycle ?? 40;
    return [Math.max(1, latest - 16), latest];
  });
  const [historyChartWidth, setHistoryChartWidth] = useState(760);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrogramRowsRef = useRef<number[][]>([]);
  const panRef = useRef<{ startX: number; startDomain: [number, number] } | null>(null);
  const chartWrapRef = useRef<HTMLDivElement | null>(null);

  const selectedTruck = useMemo(() => TRUCKS.find((truck) => truck.id === selectedTruckId) ?? TRUCKS[0], [selectedTruckId]);
  const compareTruck = useMemo(() => TRUCKS.find((truck) => truck.id === compareTruckId) ?? TRUCKS[1] ?? TRUCKS[0], [compareTruckId]);

  useEffect(() => {
    setMaterial(initialMaterials(selectedTruck));
    const fresh = buildHistory(selectedTruck);
    setHistory(fresh);
    const end = fresh.at(-1)?.cycle ?? 40;
    setDomain([Math.max(1, end - 16), end]);
    setPointDetails(null);
    spectrogramRowsRef.current = [];
  }, [selectedTruck]);

  useEffect(() => {
    const id = window.setInterval(() => setSpectrumTick((prev) => prev + 1), 300);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setMaterialTick((prev) => prev + 1);
      setMaterial((prev) => evolveMaterials(prev, selectedTruck, materialTick + 1));
    }, 2000);

    return () => window.clearInterval(id);
  }, [selectedTruck, materialTick]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setHistory((prev) => {
        const last = prev.at(-1);
        if (!last) {
          return prev;
        }

        const cycle = last.cycle + 1;
        const deviation = clamp(last.deviation + (Math.random() - 0.36) * 8 + selectedTruck.carryBackPct * 0.8, 4, 68);
        const result: HistoryPoint["result"] = deviation >= 43 ? "FAILED" : deviation >= 24 ? "PARTIAL" : "CLEARED";
        const point: HistoryPoint = {
          cycle,
          deviation: +deviation.toFixed(1),
          cbTon: +clamp(selectedTruck.carryBackKg / 1000 * (0.22 + Math.random() * 1.05), 0.2, 8.2).toFixed(1),
          vCycles: result === "FAILED" ? 3 : result === "PARTIAL" ? 2 : 1,
          duration: result === "FAILED" ? 11 : result === "PARTIAL" ? 7 : 4,
          result,
          timestamp: new Date().toISOString(),
        };

        const next = [...prev.slice(-59), point];
        setDomain(([start, end]) => {
          const width = end - start;
          return [Math.max(1, cycle - width), cycle];
        });
        return next;
      });
    }, 4200);

    return () => window.clearInterval(id);
  }, [selectedTruck]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement?.clientWidth ?? 500;
    const height = 220;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const bins = 96;
    const maxRows = 120;

    if (!spectrogramPaused) {
      const newRow = Array.from({ length: bins }, (_, i) => {
        const hz = i / (bins - 1) * 1200;
        const center = clamp(selectedTruck.sensors.acoustic.peakFreq + Math.sin((spectrumTick + i) * 0.08) * 80, 200, 1100);
        const band = Math.exp(-Math.pow(hz - center, 2) / (2 * 95 * 95));
        const noise = 0.06 + Math.random() * 0.18;
        const eventBoost = selectedTruck.status === "CARRY_BACK_DETECTED" && Math.abs(hz - center) < 35 ? 0.7 : 0;
        return clamp(noise + band * 0.75 + eventBoost, 0, 1);
      });
      spectrogramRowsRef.current = [newRow, ...spectrogramRowsRef.current].slice(0, maxRows);
    }

    const rows = spectrogramRowsRef.current;
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    const rowH = height / maxRows;
    const colW = width / bins;

    rows.forEach((row, rIdx) => {
      row.forEach((value, cIdx) => {
        ctx.fillStyle = energyToColor(value);
        ctx.fillRect(cIdx * colW, rIdx * rowH, colW + 0.5, rowH + 0.5);
      });
    });

    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.stroke();

    ctx.fillStyle = "#6B7280";
    ctx.font = "10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("0 Hz", 4, height - 6);
    ctx.textAlign = "right";
    ctx.fillText("1200 Hz", width - 4, height - 6);
  }, [selectedTruck, spectrumTick, spectrogramPaused]);

  useEffect(() => {
    const element = chartWrapRef.current;
    if (!element) {
      return;
    }

    const update = () => setHistoryChartWidth(Math.max(360, Math.floor(element.clientWidth)));
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  const latest = history.at(-1);
  const previous = history.at(-2);

  const patternAlert = useMemo(() => {
    if (history.length < 8) {
      return false;
    }
    const recent = history.slice(-8);
    const slope = (recent.at(-1)!.deviation - recent[0].deviation) / (recent.length - 1);
    return slope > 1.1;
  }, [history]);

  const protocolItems = useMemo(() => {
    const moisture = clamp(6 + selectedTruck.carryBackPct * 7.2 + material.wetClay * 0.12, 6, 36).toFixed(1);
    return [
      `Run adaptive vibration: ${latest?.result === "FAILED" ? 3 : 2} cycles`,
      `Adjust dump angle by +${(selectedTruck.carryBackPct * 1.9 + 2).toFixed(1)}°`,
      `Estimated moisture: ${moisture}%`,
    ];
  }, [latest?.result, material.wetClay, selectedTruck.carryBackPct]);

  const topMaterial = useMemo(() => {
    const entries = Object.entries(material) as Array<[MaterialKey, number]>;
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0];
  }, [material]);

  const markerHz = useMemo(() => clamp(selectedTruck.sensors.acoustic.baseline - 40, 180, 1800), [selectedTruck.sensors.acoustic.baseline]);

  const visibleLog = useMemo(() => {
    if (pageSize === "all") {
      return [...history].reverse();
    }
    const limit = Number(pageSize);
    return [...history].reverse().slice(0, limit);
  }, [history, pageSize]);

  const summary = useMemo(() => {
    const total = history.length;
    const cleared = history.filter((point) => point.result === "CLEARED").length;
    const avgDuration = history.reduce((acc, point) => acc + point.duration, 0) / total;
    const successRate = total > 0 ? (cleared / total) * 100 : 0;
    return { cleared, avgDuration, successRate };
  }, [history]);

  const criticalXs = useMemo(() => history.filter((point) => point.deviation >= 43).slice(-6), [history]);

  const exportCsv = useCallback(() => {
    const lines = [
      "Truck, Cycle, DeviationHz, CarryBackTon, VibrationCycles, DurationSec, Result, Timestamp",
      ...visibleLog.map((row) => [selectedTruck.id, row.cycle, row.deviation, row.cbTon, row.vCycles, row.duration, row.result, row.timestamp].join(",")),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `acoustic-report-${selectedTruck.id}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [selectedTruck.id, visibleLog]);

  const handleWheelZoom = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const direction = event.deltaY > 0 ? 1 : -1;

    setDomain(([start, end]) => {
      const minCycle = history[0]?.cycle ?? 1;
      const maxCycle = history.at(-1)?.cycle ?? 60;
      const width = end - start;
      const nextWidth = clamp(width + direction * 2, 8, maxCycle - minCycle);
      const center = (start + end) / 2;
      const nextStart = clamp(Math.round(center - nextWidth / 2), minCycle, maxCycle - nextWidth);
      return [nextStart, nextStart + nextWidth];
    });
  }, [history]);

  const onPanStart = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    panRef.current = { startX: event.clientX, startDomain: domain };
  }, [domain]);

  const onPanMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!panRef.current || !chartWrapRef.current) {
      return;
    }

    const width = chartWrapRef.current.clientWidth || 1;
    const deltaX = event.clientX - panRef.current.startX;
    const cyclesPerPx = (panRef.current.startDomain[1] - panRef.current.startDomain[0]) / width;
    const shift = Math.round(-deltaX * cyclesPerPx);

    const minCycle = history[0]?.cycle ?? 1;
    const maxCycle = history.at(-1)?.cycle ?? 60;
    const span = panRef.current.startDomain[1] - panRef.current.startDomain[0];

    let nextStart = panRef.current.startDomain[0] + shift;
    nextStart = clamp(nextStart, minCycle, Math.max(minCycle, maxCycle - span));
    setDomain([nextStart, nextStart + span]);
  }, [history]);

  const onPanEnd = useCallback(() => {
    panRef.current = null;
  }, []);

  return (
    <div className="space-y-4 relative">
      <div className="absolute inset-0 -z-10 pointer-events-none opacity-70" style={{ background: "radial-gradient(60% 45% at 78% 0%, rgba(250,204,21,0.1), transparent 60%), radial-gradient(50% 40% at 18% 10%, rgba(34,197,94,0.09), transparent 65%)" }} />

      <div className="rounded-xl border border-[#2F2F2F] bg-gradient-to-b from-[#151515] to-[#101010] p-3 md:p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#1B1B1B] border border-[#2A2A2A] flex items-center justify-center text-[#22C55E]">
              <Waves className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-semibold tracking-[0.1em]">ACOUSTIC ANALYSIS LAB</h1>
              <p className="text-xs text-[#9CA3AF]">Live signal diagnostics, material patterning, and vibration-response intelligence.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#224225] bg-[#0D190F] px-2.5 py-1 text-xs text-[#86EFAC] shadow-[0_0_0_1px_rgba(34,197,94,0.12)]">
              <Radio className="h-3.5 w-3.5 smartbed-badge-pulse" /> LIVE
            </span>

            <label className={`text-xs text-[#9CA3AF] inline-flex items-center gap-2 rounded-md border border-[#333333] bg-[#0B0B0B] px-2 py-1.5 ${transitionFast}`}>
              Truck
              <select
                value={selectedTruckId}
                onChange={(event) => setSelectedTruckId(event.target.value)}
                className="bg-transparent text-[#F5F5F5] outline-none"
              >
                {TRUCKS.map((truck) => (
                  <option key={truck.id} value={truck.id} className="bg-[#0F0F0F]">
                    CAT {truck.id}
                  </option>
                ))}
              </select>
            </label>

            <label className={`text-xs text-[#9CA3AF] inline-flex items-center gap-2 rounded-md border border-[#333333] bg-[#0B0B0B] px-2 py-1.5 ${transitionFast}`}>
              Compare trucks
              <input type="checkbox" checked={compareEnabled} onChange={(event) => setCompareEnabled(event.target.checked)} />
            </label>

            {compareEnabled ? (
              <label className={`text-xs text-[#9CA3AF] inline-flex items-center gap-2 rounded-md border border-[#333333] bg-[#0B0B0B] px-2 py-1.5 ${transitionFast}`}>
                Compare with
                <select
                  value={compareTruckId}
                  onChange={(event) => setCompareTruckId(event.target.value)}
                  className="bg-transparent text-[#F5F5F5] outline-none"
                >
                  {TRUCKS.filter((truck) => truck.id !== selectedTruckId).map((truck) => (
                    <option key={truck.id} value={truck.id} className="bg-[#0F0F0F]">
                      CAT {truck.id}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <button
              onClick={exportCsv}
              className={`inline-flex items-center gap-2 rounded-md border border-[#4A3A0E] bg-[#1B1507] px-3 py-1.5 text-xs text-[#FACC15] hover:bg-[#2A210A] ${transitionMed}`}
            >
              <Download className="h-3.5 w-3.5" /> Export Acoustic Report
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <section className="xl:col-span-2">
          <div className="rounded-lg border border-[#2B2B2B] bg-gradient-to-b from-[#121212] to-[#0F0F0F] p-3 md:p-4 h-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold tracking-[0.1em] text-[#FACC15]">LIVE SPECTRUM ANALYZER</p>
              <span className="text-[11px] text-[#9CA3AF]">0 Hz - 2000 Hz</span>
            </div>

            {compareEnabled ? (
              <div className="grid grid-cols-1 2xl:grid-cols-2 gap-3">
                <SpectrumPane title={`CAT ${selectedTruck.id}`} truck={selectedTruck} tick={spectrumTick} markerHz={markerHz} />
                <SpectrumPane title={`CAT ${compareTruck.id}`} truck={compareTruck} tick={spectrumTick + 5} markerHz={markerHz} />
              </div>
            ) : (
              <SpectrumPane title={`CAT ${selectedTruck.id}`} truck={selectedTruck} tick={spectrumTick} markerHz={markerHz} />
            )}
          </div>
        </section>

        <section className="xl:col-span-2 rounded-lg border border-[#2B2B2B] bg-gradient-to-b from-[#121212] to-[#0F0F0F] p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold tracking-[0.1em] text-[#FACC15]">SPECTROGRAM</p>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#9CA3AF]">30s WINDOW</span>
              <button
                onClick={() => setSpectrogramPaused((prev) => !prev)}
                className={`inline-flex items-center gap-1 rounded border border-[#3A3A3A] bg-[#171717] px-2 py-1 text-[11px] text-[#E5E7EB] hover:bg-[#202020] ${transitionMed}`}
              >
                {spectrogramPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                {spectrogramPaused ? "Play" : "Pause"}
              </button>
            </div>
          </div>
          <div className="rounded-md border border-[#262626] bg-black overflow-hidden shadow-[inset_0_0_20px_rgba(34,197,94,0.08)]">
            <canvas ref={canvasRef} />
          </div>
          <p className="mt-2 text-[11px] text-[#9CA3AF]">Newest signal appears at the top; bright yellow streaks indicate high-energy carry-back signatures.</p>
        </section>

        <section className="xl:col-span-1 rounded-lg border border-[#2B2B2B] bg-gradient-to-b from-[#121212] to-[#0F0F0F] p-3 md:p-4">
          <p className="text-xs font-semibold tracking-[0.1em] text-[#FACC15] mb-3">MATERIAL CLASSIFIER v2.1</p>

          <div className="space-y-2">
            {(Object.keys(material) as MaterialKey[]).map((key) => {
              const value = material[key];
              const color = key === "wetClay" || key === "fineOre" ? "#FACC15" : key === "dryRock" ? "#F97316" : "#6B7280";
              return (
                <div key={key} className="grid grid-cols-[84px_1fr_48px] items-center gap-2 text-[11px]">
                  <span className="text-[#D1D5DB]">{MATERIAL_LABEL[key]}</span>
                  <div className="h-2.5 rounded bg-[#1A1A1A] overflow-hidden border border-[#252525]">
                    <div className="h-full transition-all duration-300" style={{ width: `${value}%`, background: color, boxShadow: `0 0 12px ${color}55` }} />
                  </div>
                  <span className="tabular-nums text-right text-[#F5F5F5]">{value.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>

          <div className={`mt-4 rounded-md border p-3 ${topMaterial[1] >= 55 ? "smartbed-badge-pulse" : ""} ${topMaterial[0] === "wetClay" ? "bg-[#2A0A0A] border-[#EF4444]" : "bg-[#1B1206] border-[#B45309]"}`}>
            <p className="text-[10px] text-[#9CA3AF] tracking-wide">PRIMARY RESULT</p>
            <p className="mt-1 text-xl font-bold text-[#FACC15] uppercase">{MATERIAL_LABEL[topMaterial[0]]}</p>
            <p className="text-xs text-[#FB923C]">({topMaterial[1] >= 55 ? "HIGH" : "MODERATE"} CONFIDENCE)</p>
          </div>

          <div className="mt-3 rounded-md border border-[#3A2E14] bg-[#161007] p-3">
            <p className="text-xs font-semibold text-[#FACC15]">RECOMMENDED PROTOCOL:</p>
            <ul className="mt-2 space-y-1 text-xs text-[#F5F5F5]">
              {protocolItems.map((item) => (
                <li key={item}>• {item}</li>
              ))}
              <li className="text-[#FB923C]">• FLAG FOR INSPECTION AFTER CYCLE</li>
            </ul>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <section className="xl:col-span-3 rounded-lg border border-[#2B2B2B] bg-gradient-to-b from-[#121212] to-[#0F0F0F] p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold tracking-[0.1em] text-[#FACC15]">HISTORICAL ACOUSTIC SIGNATURES</p>
            <p className="text-[11px] text-[#9CA3AF]">Scroll to zoom • Drag to pan • Click points for details</p>
          </div>

          <div
            ref={chartWrapRef}
            className="h-[280px] rounded-md border border-[#242424] bg-[#0A0A0A]"
            onWheel={handleWheelZoom}
            onMouseDown={onPanStart}
            onMouseMove={onPanMove}
            onMouseLeave={onPanEnd}
            onMouseUp={onPanEnd}
          >
            <LineChart width={historyChartWidth} height={280} data={history} margin={{ top: 16, right: 10, left: 6, bottom: 8 }}>
                <CartesianGrid stroke="#1E1E1E" strokeDasharray="3 3" />
                <XAxis type="number" dataKey="cycle" domain={domain} tick={{ fill: "#6B7280", fontSize: 10 }} />
                <YAxis domain={[0, 70]} tick={{ fill: "#6B7280", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#0A0A0A", border: "1px solid #303030", borderRadius: 8 }}
                  formatter={((value: unknown) => [`${Number(value ?? 0).toFixed(1)} Hz`, "Deviation"]) as any}
                  labelFormatter={(cycle) => `Cycle ${cycle}`}
                />
                <ReferenceLine y={10} stroke="#22C55E" strokeDasharray="6 4" label={{ value: "Normal", position: "insideTopRight", fill: "#22C55E", fontSize: 10 }} />
                <ReferenceLine y={30} stroke="#F97316" strokeDasharray="6 4" label={{ value: "Warning", position: "insideTopLeft", fill: "#F97316", fontSize: 10 }} />

                {criticalXs.map((point) => (
                  <ReferenceLine key={`critical-${point.cycle}`} x={point.cycle} stroke="#EF4444" strokeOpacity={0.4} />
                ))}

                <Line
                  dataKey="deviation"
                  stroke="#A5B4FC"
                  strokeWidth={2}
                  dot={(props) => <MiniDot {...props} onPointSelect={setPointDetails} />}
                  isAnimationActive
                  animationDuration={500}
                />

                {latest ? <ReferenceDot x={latest.cycle} y={latest.deviation} r={6} fill="#EF4444" stroke="#090909" strokeWidth={1.5} /> : null}
              </LineChart>
          </div>

          {pointDetails ? (
            <div className="mt-2 rounded-md border border-[#3B3B3B] bg-[#0D0D0D] px-3 py-2 text-xs text-[#D1D5DB] grid grid-cols-2 md:grid-cols-4 gap-2">
              <p>Cycle: <span className="text-[#F5F5F5] tabular-nums">{pointDetails.cycle}</span></p>
              <p>Deviation: <span className="text-[#F5F5F5] tabular-nums">{pointDetails.deviation.toFixed(1)} Hz</span></p>
              <p>Carry-back: <span className="text-[#F5F5F5] tabular-nums">{pointDetails.cbTon.toFixed(1)}t</span></p>
              <p>Result: <span className={pointDetails.result === "FAILED" ? "text-[#EF4444]" : pointDetails.result === "PARTIAL" ? "text-[#F97316]" : "text-[#22C55E]"}>{pointDetails.result}</span></p>
            </div>
          ) : null}

          {patternAlert ? (
            <div className="mt-3 rounded-md border border-[#FACC15] bg-[#2D2406] px-3 py-2 text-xs text-[#FDE68A]">
              ⚠ PATTERN: Material moisture increasing. Recommend operator alert.
            </div>
          ) : null}
        </section>

        <section className="xl:col-span-2 rounded-lg border border-[#2B2B2B] bg-gradient-to-b from-[#121212] to-[#0F0F0F] p-3 md:p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold tracking-[0.1em] text-[#FACC15]">VIBRATION RESPONSE LOG</p>
            <label className="text-xs text-[#9CA3AF] inline-flex items-center gap-2">
              Show
              <select value={pageSize} onChange={(event) => setPageSize(event.target.value as "10" | "20" | "all")} className="rounded border border-[#393939] bg-[#111111] px-1 py-0.5 text-[#F5F5F5]">
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="all">All</option>
              </select>
            </label>
          </div>

          <div className="overflow-auto max-h-[314px] border border-[#222222] rounded-md">
            <table className="w-full text-xs">
              <thead className="bg-[#151515] text-[#9CA3AF] sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left">CYCLE</th>
                  <th className="px-2 py-2 text-left">CB</th>
                  <th className="px-2 py-2 text-left">V.CYC</th>
                  <th className="px-2 py-2 text-left">DUR</th>
                  <th className="px-2 py-2 text-left">RESULT</th>
                </tr>
              </thead>
              <tbody>
                {visibleLog.map((row, idx) => {
                  const cls = row.result === "FAILED" ? "text-[#EF4444]" : row.result === "PARTIAL" ? "text-[#F97316]" : "text-[#22C55E]";
                  return (
                    <tr
                      key={`${row.cycle}-${row.timestamp}`}
                      className={`${idx === 0 ? "bg-[#2C2108]/40" : "bg-[#0F0F0F]"} border-t border-[#1D1D1D] smartbed-log-entry`}
                    >
                      <td className="px-2 py-2 tabular-nums">{row.cycle}</td>
                      <td className="px-2 py-2 tabular-nums">{row.cbTon.toFixed(1)}t</td>
                      <td className="px-2 py-2 tabular-nums">{row.vCycles}</td>
                      <td className="px-2 py-2 tabular-nums">{row.duration}s</td>
                      <td className={`px-2 py-2 font-semibold ${cls}`}>{row.result}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-3 rounded-md border border-[#262626] bg-[#0D0D0D] px-3 py-2 text-xs text-[#D1D5DB]">
            Total cleared: <span className="text-[#22C55E] tabular-nums">{summary.cleared}</span>
            <span className="mx-2 text-[#4B5563]">|</span>
            Avg duration: <span className="tabular-nums text-[#F5F5F5]">{summary.avgDuration.toFixed(1)}s</span>
            <span className="mx-2 text-[#4B5563]">|</span>
            Success rate: <span className="tabular-nums text-[#F5F5F5]">{summary.successRate.toFixed(1)}%</span>
          </div>

          {latest && previous ? (
            <div className="mt-2 text-[11px] text-[#9CA3AF]">
              Latest cycle {latest.cycle} at {formatClock(latest.timestamp)} • Δ from previous: {(latest.deviation - previous.deviation).toFixed(1)} Hz
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
