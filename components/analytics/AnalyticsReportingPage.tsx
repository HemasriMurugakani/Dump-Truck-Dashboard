"use client";

import { ALERTS, TRUCKS } from "@/lib/mockData";
import { ArrowDownRight, ArrowUpRight, CheckCircle2, Download, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Period = "TODAY" | "THIS WEEK" | "THIS MONTH" | "CUSTOM";
type Material = "ALL" | "Wet clay" | "Fine ore" | "Mixed" | "Dry rock";

type RoiInputs = {
  fleetSize: number;
  avgPayload: number;
  carryBack: number;
  oreValue: number;
  fuelCost: number;
};

type KpiDef = {
  id: string;
  label: string;
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  valueColor?: string;
  trend?: string;
  trendPositive?: boolean;
  trendGoodWhenNegative?: boolean;
  sub?: string;
};

type PerformerRow = {
  rank: number;
  truck: string;
  operator: string;
  cycles: number;
  avgCb: number;
  fuelSaved: number;
  rating: string;
};

type HeatCell = {
  truckId: string;
  day: string;
  cbPct: number;
};

const PERIODS: Period[] = ["TODAY", "THIS WEEK", "THIS MONTH", "CUSTOM"];
const MATERIALS: Array<{ name: Exclude<Material, "ALL">; pct: number }> = [
  { name: "Wet clay", pct: 4.2 },
  { name: "Fine ore", pct: 2.8 },
  { name: "Mixed", pct: 1.9 },
  { name: "Dry rock", pct: 0.6 },
];
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAYS_SHORT = ["M", "T", "W", "T", "F", "S", "S"];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function hashNumber(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0);
}

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = clamp((now - start) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

function formatMetric(value: number, decimals = 0, prefix = "", suffix = "") {
  return `${prefix}${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${suffix}`;
}

function periodFactor(period: Period) {
  if (period === "TODAY") {
    return 1;
  }
  if (period === "THIS WEEK") {
    return 5.1;
  }
  if (period === "THIS MONTH") {
    return 22.8;
  }
  return 9.7;
}

function materialFactor(material: Material) {
  if (material === "ALL") {
    return 1;
  }
  if (material === "Wet clay") {
    return 1.18;
  }
  if (material === "Fine ore") {
    return 1.04;
  }
  if (material === "Mixed") {
    return 0.9;
  }
  return 0.72;
}

function makeSparkline(seedInput: string, trend = 0.05) {
  const seed = hashNumber(seedInput);
  return Array.from({ length: 12 }, (_, i) => {
    const base = 28 + i * trend * 9;
    const noise = Math.sin(seed * 0.0008 + i * 0.72) * 2.5 + Math.cos(seed * 0.0004 + i * 0.38) * 1.4;
    return { idx: i, v: clamp(base + noise, 18, 48) };
  });
}

function severityColor(cb: number) {
  if (cb < 0.5) {
    return "#22C55E";
  }
  if (cb <= 2) {
    return "#F97316";
  }
  return "#EF4444";
}

function calculateRoi(input: RoiInputs) {
  const cyclesPerDay = 35;
  const annualCycles = input.fleetSize * cyclesPerDay * 365;
  const cbTonPerCycle = input.avgPayload * (input.carryBack / 100);
  const payloadRecovered = annualCycles * cbTonPerCycle;
  const fuelSaved = annualCycles * (0.65 * input.carryBack);
  const annualSavings = payloadRecovered * input.oreValue + fuelSaved * input.fuelCost;
  const systemCost = input.fleetSize * 35000;
  const paybackMonths = systemCost / Math.max(1, annualSavings / 12);

  return {
    payloadRecovered,
    fuelSaved,
    annualSavings,
    paybackMonths,
  };
}

function KpiCard({ card, sparkSeed }: { card: KpiDef; sparkSeed: string }) {
  const current = useCountUp(card.value, 1500);
  const spark = useMemo(() => makeSparkline(`${sparkSeed}-${card.id}`, card.trendPositive ? 0.11 : -0.06), [sparkSeed, card.id, card.trendPositive]);
  const decimals = card.decimals ?? 0;
  const display = formatMetric(current, decimals, card.prefix, card.suffix);

  const trendIsGood = card.trendGoodWhenNegative ? !card.trendPositive : !!card.trendPositive;
  const trendColor = trendIsGood ? "text-[#22C55E]" : "text-[#EF4444]";

  return (
    <div className="rounded-lg border border-[#262626] bg-[#111111] p-3 min-h-[126px] transition-all duration-300 hover:border-[#393939]">
      <p className="text-[12px] text-[#9CA3AF]">{card.label}</p>
      <div className="mt-1 flex items-end justify-between gap-2">
        <p className={`text-[28px] leading-none font-semibold tabular-nums ${card.valueColor ?? "text-[#F5F5F5]"}`}>{display}</p>
        <div className="h-[34px] w-[78px] overflow-hidden">
          <LineChart width={78} height={34} data={spark}>
            <Line dataKey="v" stroke="#FACC15" dot={false} strokeWidth={2} isAnimationActive animationDuration={300} />
          </LineChart>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between">
        {card.trend ? (
          <span className={`inline-flex items-center gap-1 text-[11px] ${trendColor}`}>
            {card.trendPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {card.trend}
          </span>
        ) : <span />}
        {card.sub ? <span className="text-[11px] text-[#60A5FA]">{card.sub}</span> : null}
      </div>
    </div>
  );
}

function RoiBlock({
  title,
  input,
  onChange,
}: {
  title: string;
  input: RoiInputs;
  onChange: (next: RoiInputs) => void;
}) {
  const roi = useMemo(() => calculateRoi(input), [input]);

  const field = (
    key: keyof RoiInputs,
    label: string,
    min: number,
    max: number,
    step: number,
    decimals = 0,
  ) => (
    <div className="space-y-1">
      <label className="text-[11px] text-[#9CA3AF]">{label}</label>
      <input
        type="number"
        value={input[key]}
        onChange={(event) => onChange({ ...input, [key]: Number(event.target.value) })}
        className="w-full rounded border border-[#2D2D2D] bg-[#0F0F0F] px-2 py-1 text-sm text-[#F5F5F5]"
        step={step}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={input[key]}
        onChange={(event) => onChange({ ...input, [key]: Number(event.target.value) })}
        className="w-full accent-[#FACC15]"
      />
      <p className="text-[10px] text-[#6B7280] tabular-nums">{Number(input[key]).toFixed(decimals)}</p>
    </div>
  );

  return (
    <div className="rounded-lg border border-[#2C2C2C] bg-[#101010] p-3 space-y-3">
      <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15]">{title}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {field("fleetSize", "Fleet size (trucks)", 10, 600, 1)}
        {field("avgPayload", "Avg payload (t)", 80, 400, 1)}
        {field("carryBack", "Carry-back %", 0.2, 8, 0.1, 1)}
        {field("oreValue", "Ore value ($/t)", 30, 220, 1)}
        {field("fuelCost", "Fuel cost ($/L)", 0.6, 3.0, 0.05, 2)}
      </div>

      <div className="rounded-md border border-[#FACC15] bg-[#221C07] p-3">
        <p className="text-xs text-[#9CA3AF]">Annual payload recovered</p>
        <p className="text-xl font-semibold text-[#FACC15] tabular-nums">{formatMetric(roi.payloadRecovered, 0)} t</p>
        <p className="mt-1 text-xs text-[#9CA3AF]">Annual fuel saved</p>
        <p className="text-xl font-semibold text-[#FACC15] tabular-nums">{formatMetric(roi.fuelSaved, 0)} L</p>
        <p className="mt-1 text-xs text-[#9CA3AF]">Annual savings</p>
        <p className="text-3xl font-bold text-[#FACC15] tabular-nums">${(roi.annualSavings / 1_000_000).toFixed(1)}M</p>
        <p className="mt-1 text-sm">
          Payback period: <span className={`${roi.paybackMonths < 3 ? "text-[#22C55E]" : "text-[#F97316]"} font-semibold tabular-nums`}>{roi.paybackMonths.toFixed(1)} months</span>
        </p>
      </div>
    </div>
  );
}

export function AnalyticsReportingPage() {
  const router = useRouter();

  const [period, setPeriod] = useState<Period>("TODAY");
  const [selectedMaterial, setSelectedMaterial] = useState<Material>("ALL");
  const [selectedCell, setSelectedCell] = useState<HeatCell | null>(null);
  const [compareScenario, setCompareScenario] = useState(false);

  const [roiA, setRoiA] = useState<RoiInputs>({ fleetSize: 100, avgPayload: 240, carryBack: 3.2, oreValue: 85, fuelCost: 1.2 });
  const [roiB, setRoiB] = useState<RoiInputs>({ fleetSize: 120, avgPayload: 260, carryBack: 2.6, oreValue: 90, fuelCost: 1.4 });

  const payloadChartRef = useState(() => ({ current: null as HTMLDivElement | null }))[0];
  const trendChartRef = useState(() => ({ current: null as HTMLDivElement | null }))[0];
  const shiftChartRef = useState(() => ({ current: null as HTMLDivElement | null }))[0];
  const [payloadChartWidth, setPayloadChartWidth] = useState(640);
  const [trendChartWidth, setTrendChartWidth] = useState(520);
  const [shiftChartWidth, setShiftChartWidth] = useState(520);

  useEffect(() => {
    const watchers: Array<{ node: HTMLDivElement | null; set: (n: number) => void; min: number }> = [
      { node: payloadChartRef.current, set: setPayloadChartWidth, min: 320 },
      { node: trendChartRef.current, set: setTrendChartWidth, min: 320 },
      { node: shiftChartRef.current, set: setShiftChartWidth, min: 320 },
    ];

    const observers = watchers
      .filter((w) => !!w.node)
      .map((watch) => {
        const update = () => watch.set(Math.max(watch.min, Math.floor(watch.node!.clientWidth)));
        update();
        const observer = new ResizeObserver(update);
        observer.observe(watch.node!);
        return observer;
      });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, [payloadChartRef, shiftChartRef, trendChartRef]);

  const factor = periodFactor(period) * materialFactor(selectedMaterial);

  const kpis = useMemo<KpiDef[]>(() => {
    const cbRate = clamp(1.24 * (selectedMaterial === "Wet clay" ? 1.2 : selectedMaterial === "Dry rock" ? 0.8 : 1), 0.4, 4.9);
    return [
      {
        id: "payload",
        label: "Total Payload Recovered",
        value: 847.3 * factor,
        decimals: 1,
        suffix: " t",
        valueColor: "text-[#FACC15]",
        trend: "+12.4%",
        trendPositive: true,
      },
      {
        id: "fuel",
        label: "Total Fuel Saved",
        value: 5832 * factor,
        decimals: 0,
        suffix: " L",
        trend: "+8.1%",
        trendPositive: true,
      },
      {
        id: "cb",
        label: "Avg Carry-Back Rate",
        value: cbRate,
        decimals: 2,
        suffix: "%",
        trend: "-0.3%",
        trendPositive: false,
        trendGoodWhenNegative: true,
      },
      {
        id: "vibration",
        label: "Vibration Cycles Today",
        value: 143 * factor,
        decimals: 0,
      },
      {
        id: "detections",
        label: "System Detections",
        value: 89 * factor,
        decimals: 0,
        sub: "98.9% acc",
      },
    ];
  }, [factor, selectedMaterial]);

  const payloadTimeline = useMemo(() => {
    const withScbes = [800, 650, 700, 1100, 1550, 1700, 1847].map((v) => v * factor);
    const withoutScbes = [820, 810, 805, 795, 790, 780, 770].map((v) => v * factor);
    const target = 1700 * factor;

    return DAYS.map((day, idx) => ({
      day,
      withScbes: +withScbes[idx].toFixed(1),
      withoutScbes: +withoutScbes[idx].toFixed(1),
      target: +target.toFixed(1),
    }));
  }, [factor]);

  const materialBars = useMemo(() => {
    return MATERIALS.map((row) => ({
      ...row,
      value: +(row.pct * materialFactor(selectedMaterial)).toFixed(1),
    }));
  }, [selectedMaterial]);

  const heatmapData = useMemo(() => {
    return TRUCKS.map((truck, tIdx) => {
      return {
        truckId: truck.id,
        values: DAYS_SHORT.map((_, dIdx) => {
          const cb = clamp(truck.carryBackPct + Math.sin((tIdx + 1) * 0.7 + dIdx * 0.4) * 0.9 + (selectedMaterial === "Wet clay" ? 0.6 : 0), 0.1, 4.8);
          return +cb.toFixed(2);
        }),
      };
    });
  }, [selectedMaterial]);

  const alerts24h = useMemo(() => {
    return ALERTS.filter((alert) => Date.now() - new Date(alert.timestamp).getTime() <= 24 * 3600 * 1000)
      .sort((a, b) => +new Date(b.timestamp) - +new Date(a.timestamp))
      .map((alert) => {
        const resMin = alert.resolved ? (alert.severity === "CRITICAL" ? 21 : alert.severity === "HIGH" ? 16 : 9) : null;
        return {
          ...alert,
          cb: `${(TRUCKS.find((t) => t.id === alert.truckId)?.carryBackKg ?? 300) / 1000}t`,
          res: resMin,
        };
      });
  }, []);

  const resolutionRate = useMemo(() => {
    if (alerts24h.length === 0) {
      return 100;
    }
    const resolved = alerts24h.filter((alert) => alert.resolved).length;
    return +(resolved / alerts24h.length * 100).toFixed(1);
  }, [alerts24h]);

  const performerRows = useMemo<PerformerRow[]>(() => {
    const rows = TRUCKS.map((truck) => ({
      rank: 0,
      truck: truck.id,
      operator: truck.operator,
      cycles: truck.cyclesShift,
      avgCb: +(truck.carryBackPct * materialFactor(selectedMaterial)).toFixed(2),
      fuelSaved: Math.round((truck.payloadClass * truck.cyclesShift * (0.4 + (1 - truck.carryBackPct / 5) * 0.5))),
      rating: truck.carryBackPct < 0.6 ? "A+" : truck.carryBackPct < 1 ? "A" : truck.carryBackPct < 2 ? "B" : "C",
    })).sort((a, b) => a.avgCb - b.avgCb);

    return rows.map((row, idx) => ({ ...row, rank: idx + 1 }));
  }, [selectedMaterial]);

  const [sortBy, setSortBy] = useState<keyof PerformerRow>("rank");
  const [sortAsc, setSortAsc] = useState(true);

  const sortedPerformers = useMemo(() => {
    const rows = [...performerRows];
    rows.sort((a, b) => {
      const left = a[sortBy];
      const right = b[sortBy];
      if (typeof left === "string" && typeof right === "string") {
        return sortAsc ? left.localeCompare(right) : right.localeCompare(left);
      }
      return sortAsc ? Number(left) - Number(right) : Number(right) - Number(left);
    });
    return rows;
  }, [performerRows, sortBy, sortAsc]);

  const rollingTrend = useMemo(() => {
    const data = Array.from({ length: 30 }, (_, idx) => {
      const day = idx + 1;
      const base = 2.2 - idx * 0.045;
      const wave = Math.sin(idx * 0.45) * 0.15;
      const value = clamp(base + wave + (selectedMaterial === "Wet clay" ? 0.22 : 0), 0.3, 2.8);
      return { day, rolling: +value.toFixed(2) };
    });

    const n = data.length;
    const sumX = data.reduce((acc, d) => acc + d.day, 0);
    const sumY = data.reduce((acc, d) => acc + d.rolling, 0);
    const sumXY = data.reduce((acc, d) => acc + d.day * d.rolling, 0);
    const sumXX = data.reduce((acc, d) => acc + d.day * d.day, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const withRegression = data.map((d) => ({ ...d, trend: +(intercept + slope * d.day).toFixed(2) }));

    let targetDay = 30;
    if (slope < 0) {
      targetDay = Math.ceil((0.5 - intercept) / slope);
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + Math.max(0, targetDay - 30));

    return {
      data: withRegression,
      targetDate,
    };
  }, [selectedMaterial]);

  const shiftComparison = useMemo(() => {
    return DAYS.map((day, idx) => {
      const base = 1.7 - idx * 0.08;
      return {
        day,
        shift1: +clamp(base + Math.sin(idx * 0.6) * 0.3, 0.4, 3.5).toFixed(2),
        shift2: +clamp(base + 0.28 + Math.cos(idx * 0.45) * 0.28, 0.5, 3.7).toFixed(2),
        shift3: +clamp(base + 0.5 + Math.sin(idx * 0.4 + 1.1) * 0.35, 0.7, 4.1).toFixed(2),
      };
    });
  }, []);

  const onSort = (key: keyof PerformerRow) => {
    if (sortBy === key) {
      setSortAsc((prev) => !prev);
      return;
    }
    setSortBy(key);
    setSortAsc(true);
  };

  const exportPdf = useCallback(async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 595, 842, "F");

    doc.setTextColor(250, 204, 21);
    doc.setFontSize(18);
    doc.text("SCBES Analytics Report", 40, 46);

    doc.setTextColor(200, 200, 200);
    doc.setFontSize(10);
    doc.text(`Period: ${period} | Material: ${selectedMaterial} | Generated: ${new Date().toLocaleString()}`, 40, 64);

    let y = 98;
    doc.setFontSize(12);
    doc.setTextColor(245, 245, 245);
    doc.text("KPI Summary", 40, y);
    y += 18;

    kpis.forEach((kpi) => {
      doc.setFontSize(10);
      doc.setTextColor(170, 170, 170);
      doc.text(`${kpi.label}`, 48, y);
      doc.setTextColor(250, 204, 21);
      doc.text(`${formatMetric(kpi.value, kpi.decimals ?? 0, kpi.prefix, kpi.suffix)}`, 320, y);
      y += 16;
    });

    const roi = calculateRoi(roiA);
    y += 12;
    doc.setTextColor(245, 245, 245);
    doc.setFontSize(12);
    doc.text("ROI Scenario A", 40, y);
    y += 18;
    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Annual payload recovered: ${formatMetric(roi.payloadRecovered, 0)} t`, 48, y);
    y += 14;
    doc.text(`Annual fuel saved: ${formatMetric(roi.fuelSaved, 0)} L`, 48, y);
    y += 14;
    doc.text(`Annual savings: $${(roi.annualSavings / 1_000_000).toFixed(1)}M`, 48, y);
    y += 14;
    doc.text(`Payback period: ${roi.paybackMonths.toFixed(1)} months`, 48, y);

    y += 24;
    doc.setTextColor(245, 245, 245);
    doc.setFontSize(12);
    doc.text("Top Performers", 40, y);
    y += 16;
    doc.setFontSize(10);

    sortedPerformers.slice(0, 8).forEach((row) => {
      doc.setTextColor(200, 200, 200);
      doc.text(`#${row.rank}`, 48, y);
      doc.text(row.truck, 78, y);
      doc.text(row.operator, 138, y);
      doc.text(`${row.avgCb.toFixed(2)}%`, 320, y);
      doc.text(`${row.fuelSaved}L`, 390, y);
      doc.text(row.rating, 460, y);
      y += 14;
    });

    doc.save(`analytics-report-${Date.now()}.pdf`);
  }, [kpis, period, roiA, selectedMaterial, sortedPerformers]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#2B2B2B] bg-gradient-to-b from-[#131313] to-[#0E0E0E] p-3 md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-md border border-[#2D2D2D] bg-[#0D0D0D] p-1">
            {PERIODS.map((tab) => (
              <button
                key={tab}
                onClick={() => setPeriod(tab)}
                className={`px-3 py-1.5 text-xs font-semibold tracking-[0.08em] rounded transition-all duration-300 ${
                  period === tab ? "bg-[#FACC15] text-black" : "text-[#9CA3AF] hover:text-[#F5F5F5]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <p className="text-xs text-[#9CA3AF]">Material filter</p>
            <span className="rounded-full border border-[#383838] bg-[#121212] px-2 py-0.5 text-xs text-[#FACC15]">{selectedMaterial}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} card={kpi} sparkSeed={`${period}-${selectedMaterial}`} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <section className="xl:col-span-3 rounded-lg border border-[#2B2B2B] bg-[#111111] p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold tracking-[0.1em] text-[#FACC15]">PAYLOAD EFFICIENCY TIMELINE</p>
            <p className="text-[11px] text-[#9CA3AF]">With SCBES vs Without SCBES</p>
          </div>
          <div
            className="h-[290px] overflow-hidden"
            ref={(node) => {
              payloadChartRef.current = node;
            }}
          >
              <AreaChart width={payloadChartWidth} height={290} data={payloadTimeline}>
                <defs>
                  <linearGradient id="payloadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FACC15" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#FACC15" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1E1E1E" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 11 }} />
                <YAxis domain={[0, 2000 * factor]} tick={{ fill: "#6B7280", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#0A0A0A", border: "1px solid #303030", borderRadius: 8 }}
                  formatter={((value: unknown, key: unknown) => [`${Number(value ?? 0).toFixed(1)} t`, String(key)]) as any}
                />
                <ReferenceLine y={payloadTimeline[0]?.target ?? 0} stroke="#D1D5DB" strokeDasharray="6 4" label={{ value: "optimal target", fill: "#9CA3AF", fontSize: 10 }} />
                <Area type="monotone" dataKey="withScbes" stroke="#FACC15" fill="url(#payloadGrad)" strokeWidth={2.5} isAnimationActive animationDuration={300} />
                <Line type="monotone" dataKey="withoutScbes" stroke="#6B7280" strokeWidth={1.5} dot={false} isAnimationActive animationDuration={300} />
              </AreaChart>
          </div>
          <p className="text-[11px] text-[#FACC15]">↗ SmartBed activated Day 3 → gap closes around Thu.</p>
        </section>

        <section className="xl:col-span-2 rounded-lg border border-[#2B2B2B] bg-[#111111] p-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-[#FACC15] mb-3">CARRY-BACK BY MATERIAL TYPE</p>
          <div className="space-y-2">
            {materialBars.map((row) => (
              <button
                key={row.name}
                onClick={() => setSelectedMaterial((prev) => (prev === row.name ? "ALL" : row.name))}
                className={`w-full grid grid-cols-[90px_1fr_58px] items-center gap-2 text-xs rounded px-1 py-1.5 border transition-all duration-300 ${
                  selectedMaterial === row.name ? "border-[#FACC15] bg-[#241E09]" : "border-transparent hover:border-[#2F2F2F]"
                }`}
              >
                <span className="text-left text-[#D1D5DB]">{row.name}</span>
                <div className="h-2.5 rounded bg-[#1A1A1A] overflow-hidden">
                  <div className="h-full bg-[#FACC15]" style={{ width: `${clamp(row.value / 4.5 * 100, 8, 100)}%` }} />
                </div>
                <span className="text-right tabular-nums text-[#F5F5F5]">{row.value.toFixed(1)}%</span>
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[#9CA3AF]">Click any material bar to filter the entire page.</p>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <section className="xl:col-span-3 rounded-lg border border-[#2B2B2B] bg-[#111111] p-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-[#FACC15] mb-3">CARRY-BACK SEVERITY — FLEET × DAY</p>
          <div className="overflow-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-[#9CA3AF] pb-2">TRUCK</th>
                  {DAYS_SHORT.map((day, idx) => (
                    <th key={`${day}-${idx}`} className="text-[#9CA3AF] pb-2">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row) => (
                  <tr key={row.truckId}>
                    <td className="py-1.5 text-[#D1D5DB]">{row.truckId}</td>
                    {row.values.map((cb, idx) => (
                      <td key={`${row.truckId}-${idx}`} className="text-center py-1.5">
                        <button
                          title={`${row.truckId} ${DAYS[idx]}: ${cb.toFixed(2)}%`}
                          onClick={() => setSelectedCell({ truckId: row.truckId, day: DAYS[idx], cbPct: cb })}
                          className="h-6 w-6 rounded border border-[#1F1F1F]"
                          style={{ background: severityColor(cb) }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-4 text-[11px] text-[#9CA3AF]">
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#22C55E]" /> Excellent</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#F97316]" /> Warning</span>
            <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-[#EF4444]" /> Poor</span>
          </div>
        </section>

        <section className="xl:col-span-2 rounded-lg border border-[#2B2B2B] bg-[#111111] p-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold tracking-[0.1em] text-[#FACC15]">ROI CALCULATOR</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCompareScenario((prev) => !prev)}
                className="rounded border border-[#343434] bg-[#141414] px-2 py-1 text-[11px] text-[#E5E7EB]"
              >
                Compare Scenarios
              </button>
              <button
                onClick={exportPdf}
                className="inline-flex items-center gap-1 rounded border border-[#4A3A0E] bg-[#1B1507] px-2 py-1 text-[11px] text-[#FACC15]"
              >
                <Download className="h-3 w-3" /> EXPORT REPORT
              </button>
            </div>
          </div>

          <div className={`grid gap-3 ${compareScenario ? "grid-cols-1 2xl:grid-cols-2" : "grid-cols-1"}`}>
            <RoiBlock title="SCENARIO A" input={roiA} onChange={setRoiA} />
            {compareScenario ? <RoiBlock title="SCENARIO B" input={roiB} onChange={setRoiB} /> : null}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3">
        <p className="text-xs font-semibold tracking-[0.1em] text-[#FACC15] mb-3">ALERTS SUMMARY (24H)</p>
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead className="text-[#9CA3AF] border-b border-[#1E1E1E]">
              <tr>
                <th className="text-left py-2">TIME</th>
                <th className="text-left py-2">TRUCK</th>
                <th className="text-left py-2">SEV</th>
                <th className="text-left py-2">CB</th>
                <th className="text-left py-2">RES</th>
              </tr>
            </thead>
            <tbody>
              {alerts24h.map((row) => {
                const sevClass = row.severity === "CRITICAL" || row.severity === "HIGH"
                  ? "bg-[#3A1010] text-[#FCA5A5]"
                  : row.severity === "MEDIUM"
                    ? "bg-[#3A250A] text-[#FCD34D]"
                    : "bg-[#102E1A] text-[#86EFAC]";

                return (
                  <tr
                    key={row.id}
                    className="border-b border-[#1A1A1A] hover:bg-[#151515] cursor-pointer"
                    onClick={() => router.push(`/dashboard/truck/${row.truckId}`)}
                  >
                    <td className="py-2 text-[#D1D5DB] tabular-nums">{new Date(row.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2 text-[#F5F5F5]">{row.truckId}</td>
                    <td className="py-2"><span className={`px-2 py-0.5 rounded text-[10px] ${sevClass}`}>{row.severity}</span></td>
                    <td className="py-2 text-[#F5F5F5]">{row.cb}</td>
                    <td className="py-2 text-[#9CA3AF]">
                      {row.resolved && row.res ? <span className="inline-flex items-center gap-1 text-[#22C55E]"><CheckCircle2 className="h-3 w-3" /> {row.res}m</span> : "Pending"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-3">
          <span className="inline-flex items-center rounded-full border border-[#1F5A31] bg-[#0F2316] px-3 py-1 text-xs text-[#22C55E] font-semibold">
            {resolutionRate.toFixed(1)}% RESOLUTION RATE
          </span>
        </div>
      </section>

      <section className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3">
        <p className="text-xs font-semibold tracking-[0.1em] text-[#FACC15] mb-3">TOP PERFORMERS TABLE</p>
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead className="text-[#9CA3AF] border-b border-[#1E1E1E]">
              <tr>
                {[
                  ["rank", "RANK"],
                  ["truck", "TRUCK"],
                  ["operator", "OPERATOR"],
                  ["cycles", "CYCLES"],
                  ["avgCb", "AVG CB%"],
                  ["fuelSaved", "FUEL SAVED"],
                  ["rating", "RATING"],
                ].map(([key, label]) => (
                  <th key={key} className="text-left py-2">
                    <button className="hover:text-[#F5F5F5]" onClick={() => onSort(key as keyof PerformerRow)}>{label}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPerformers.map((row) => (
                <tr key={row.truck} className="border-b border-[#1A1A1A]">
                  <td className="py-2 text-[#F5F5F5]">
                    <span className="inline-flex items-center gap-1">
                      {row.rank === 1 ? <Trophy className="h-3.5 w-3.5 text-[#22C55E]" /> : null}
                      #{row.rank}
                    </span>
                  </td>
                  <td className="py-2 text-[#F5F5F5]">{row.truck}</td>
                  <td className="py-2 text-[#D1D5DB]">{row.operator}</td>
                  <td className="py-2 tabular-nums text-[#D1D5DB]">{row.cycles}</td>
                  <td className="py-2 tabular-nums text-[#D1D5DB]">{row.avgCb.toFixed(2)}%</td>
                  <td className="py-2 tabular-nums text-[#D1D5DB]">{row.fuelSaved.toLocaleString()} L</td>
                  <td className={`py-2 font-semibold ${row.rating.startsWith("A") ? "text-[#22C55E]" : row.rating === "B" ? "text-[#FACC15]" : "text-[#F97316]"}`}>{row.rating}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-[#FACC15] mb-3">TREND ANALYSIS PANEL</p>
          <div
            className="h-[250px] overflow-hidden"
            ref={(node) => {
              trendChartRef.current = node;
            }}
          >
              <LineChart width={trendChartWidth} height={250} data={rollingTrend.data}>
                <CartesianGrid stroke="#1E1E1E" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 10 }} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} domain={[0, 3]} />
                <Tooltip
                  contentStyle={{ background: "#0A0A0A", border: "1px solid #303030", borderRadius: 8 }}
                  formatter={((value: unknown, key: unknown) => [`${Number(value ?? 0).toFixed(2)}%`, String(key)]) as any}
                />
                <Line dataKey="rolling" stroke="#FACC15" strokeWidth={2.2} dot={false} isAnimationActive animationDuration={300} />
                <Line dataKey="trend" stroke="#60A5FA" strokeWidth={1.6} dot={false} strokeDasharray="6 4" isAnimationActive animationDuration={300} />
              </LineChart>
          </div>
          <p className="text-xs text-[#93C5FD]">At this rate, fleet will reach &lt;0.5% CB by {rollingTrend.targetDate.toLocaleDateString()}.</p>
        </section>

        <section className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-[#FACC15] mb-3">SHIFT COMPARISON</p>
          <div
            className="h-[250px] overflow-hidden"
            ref={(node) => {
              shiftChartRef.current = node;
            }}
          >
              <ComposedChart width={shiftChartWidth} height={250} data={shiftComparison}>
                <CartesianGrid stroke="#1E1E1E" strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 10 }} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} domain={[0, 4.5]} />
                <Tooltip
                  contentStyle={{ background: "#0A0A0A", border: "1px solid #303030", borderRadius: 8 }}
                  formatter={((value: unknown, key: unknown) => [`${Number(value ?? 0).toFixed(2)}%`, String(key)]) as any}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="shift1" fill="#22C55E" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={300} />
                <Bar dataKey="shift2" fill="#FACC15" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={300} />
                <Bar dataKey="shift3" fill="#F97316" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={300} />
              </ComposedChart>
          </div>
        </section>
      </div>

      {selectedCell ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4" onClick={() => setSelectedCell(null)}>
          <div className="w-full max-w-md rounded-lg border border-[#393939] bg-[#111111] p-4" onClick={(event) => event.stopPropagation()}>
            <p className="text-sm font-semibold text-[#FACC15]">Day Detail — {selectedCell.truckId}</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">{selectedCell.day}</p>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-[#F5F5F5]">{selectedCell.cbPct.toFixed(2)}%</p>
            <p className="mt-2 text-xs text-[#9CA3AF]">Severity: <span style={{ color: severityColor(selectedCell.cbPct) }}>{selectedCell.cbPct < 0.5 ? "Excellent" : selectedCell.cbPct <= 2 ? "Warning" : "Poor"}</span></p>
            <div className="mt-4 text-right">
              <button onClick={() => setSelectedCell(null)} className="rounded border border-[#3A3A3A] bg-[#171717] px-3 py-1.5 text-xs text-[#E5E7EB]">Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
