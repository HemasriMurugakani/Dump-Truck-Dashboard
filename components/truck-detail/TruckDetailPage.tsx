"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { TRUCKS, type TruckRecord } from "@/lib/mockData";
import { AlertTriangle, Check, RefreshCw, Siren, Waves, Wrench } from "lucide-react";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type ViewMode = "TOP" | "SIDE";

type DecisionType =
  | "DUMP_START"
  | "LOAD_CELL"
  | "ACOUSTIC"
  | "CAMERA"
  | "DECISION"
  | "ACTION"
  | "VIBRATION"
  | "RESCAN"
  | "STATUS_CLEAR"
  | "STATUS_ALERT";

type DecisionLogEntry = {
  id: string;
  ts: Date;
  type: DecisionType;
  message: string;
};

type ZoneKey = keyof TruckRecord["bedZones"];

const zonePosition: Record<ZoneKey, { x: number; y: number; w: number; h: number }> = {
  FL: { x: 72, y: 44, w: 88, h: 62 },
  FC: { x: 160, y: 44, w: 74, h: 62 },
  FR: { x: 234, y: 44, w: 88, h: 62 },
  RL: { x: 54, y: 106, w: 88, h: 74 },
  RC: { x: 142, y: 106, w: 92, h: 74 },
  RR: { x: 234, y: 106, w: 94, h: 74 },
};

function formatTime(date: Date, withSeconds = false) {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Brisbane",
    hour: "2-digit",
    minute: "2-digit",
    second: withSeconds ? "2-digit" : undefined,
    hour12: false,
  }).format(date);
}

function statusColor(status: TruckRecord["status"]) {
  if (status === "CARRY_BACK_DETECTED") {
    return "text-[#EF4444] border-[#EF4444]";
  }
  return "text-[#22C55E] border-[#22C55E]";
}

function moistureClass(moisture: number) {
  if (moisture > 20) {
    return "text-[#EF4444]";
  }
  if (moisture >= 10) {
    return "text-[#F97316]";
  }
  return "text-[#22C55E]";
}

function zoneSeverity(zone: TruckRecord["bedZones"][ZoneKey]) {
  const ton = zone.residueKg / 1000;
  if (ton <= 0.05) {
    return { label: "Clear", bg: "#161616" };
  }
  if (ton <= 0.25) {
    return { label: "Low", bg: "#F9731620" };
  }
  if (ton <= 0.6) {
    return { label: "Medium", bg: "#F9731650" };
  }
  if (ton <= 1.2) {
    return { label: "High", bg: "#EF444480" };
  }
  return { label: "Critical", bg: "#EF4444CC" };
}

function toneClass(type: DecisionType) {
  if (type === "DUMP_START" || type === "LOAD_CELL") {
    return "text-[#FACC15]";
  }
  if (type === "ACOUSTIC" || type === "CAMERA") {
    return "text-[#60A5FA]";
  }
  if (type === "DECISION") {
    return "text-white font-semibold";
  }
  if (type === "ACTION" || type === "VIBRATION") {
    return "text-[#FB923C]";
  }
  if (type === "RESCAN") {
    return "text-[#C084FC]";
  }
  if (type === "STATUS_CLEAR") {
    return "text-[#4ADE80]";
  }
  return "text-[#F87171]";
}

function hashNumber(input: string) {
  return input.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

export function TruckDetailPage({ truckId }: { truckId: string }) {
  const { user } = useAuth();
  const logRef = useRef<HTMLDivElement | null>(null);

  const truck = useMemo(() => {
    return TRUCKS.find((entry) => entry.id === truckId) ?? TRUCKS[0];
  }, [truckId]);

  const [status, setStatus] = useState<TruckRecord["status"]>(truck.status);
  const [viewMode, setViewMode] = useState<ViewMode>("TOP");
  const [selectedZone, setSelectedZone] = useState<ZoneKey | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [logs, setLogs] = useState<DecisionLogEntry[]>([]);
  const [vibrationRunning, setVibrationRunning] = useState(false);

  const isPrivileged = user?.role === "SUPER_ADMIN" || user?.role === "SITE_MANAGER" || user?.role === "FLEET_OPERATOR";

  const seed = hashNumber(truck.id + truck.operator);
  const material = ["Wet overburden", "Shale blend", "Iron ore fines", "Basalt aggregate"][seed % 4];
  const moisture = +(7 + (seed % 18) + truck.carryBackPct * 2.2).toFixed(1);
  const optimalAngle = +(49 + moisture * 0.17).toFixed(1);
  const currentAngle = +(Math.max(38, Math.min(60, optimalAngle - 2.4 + Math.sin(elapsedSec / 8) * 2.7))).toFixed(1);
  const haulDistance = +(2.8 + (seed % 27) / 10).toFixed(1);

  const cycleStart = useMemo(() => new Date(truck.currentCycle.timestamp), [truck.currentCycle.timestamp]);
  const shiftStart = new Date(cycleStart.getTime() - (4 * 60 + (seed % 30)) * 60_000);
  const loadTime = new Date(cycleStart.getTime() - (26 + (seed % 9)) * 60_000);

  const timelineEvents = useMemo(() => {
    return [
      { t: 0, label: "Dump start", type: "DUMP_START" as DecisionType },
      { t: 11, label: "Load cell reading", type: "LOAD_CELL" as DecisionType },
      { t: 19, label: "Detection complete", type: "DECISION" as DecisionType },
      { t: status === "CARRY_BACK_DETECTED" ? 41 : 36, label: status === "CARRY_BACK_DETECTED" ? "Vibration initiated" : "No action required", type: status === "CARRY_BACK_DETECTED" ? ("VIBRATION" as DecisionType) : ("ACTION" as DecisionType) },
      { t: 58, label: "Rescan", type: "RESCAN" as DecisionType },
      { t: 73, label: status === "CARRY_BACK_DETECTED" ? "Alert" : "Cleared", type: status === "CARRY_BACK_DETECTED" ? ("STATUS_ALERT" as DecisionType) : ("STATUS_CLEAR" as DecisionType) },
    ];
  }, [status]);

  useEffect(() => {
    const initial: DecisionLogEntry[] = [
      { id: "1", ts: new Date(cycleStart.getTime()), type: "DUMP_START", message: "Bed raised. Dump sequence started." },
      { id: "2", ts: new Date(cycleStart.getTime() + 11_000), type: "LOAD_CELL", message: `Load cell reports ${truck.sensors.loadCell.value.toFixed(1)}t residual.` },
      { id: "3", ts: new Date(cycleStart.getTime() + 14_000), type: "ACOUSTIC", message: `Acoustic deviation ${truck.sensors.acoustic.deviation}Hz from baseline.` },
      { id: "4", ts: new Date(cycleStart.getTime() + 16_000), type: "CAMERA", message: `Camera flagged zones: ${truck.sensors.camera.zones.join(", ") || "none"}.` },
      {
        id: "5",
        ts: new Date(cycleStart.getTime() + 19_000),
        type: "DECISION",
        message: status === "CARRY_BACK_DETECTED" ? "Carry-back probability above threshold." : "Bed clear confidence high.",
      },
    ];
    setLogs(initial);
  }, [cycleStart, status, truck.id, truck.sensors.acoustic.deviation, truck.sensors.camera.zones, truck.sensors.loadCell.value]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setElapsedSec((prev) => (prev >= 90 ? 0 : prev + 1));
    }, 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const updater = window.setInterval(() => {
      setLogs((prev) => {
        const types: DecisionType[] = ["LOAD_CELL", "ACOUSTIC", "CAMERA", "DECISION", "RESCAN"];
        const t = types[Math.floor(Math.random() * types.length)];
        const msgMap: Record<DecisionType, string> = {
          DUMP_START: "Dump event started.",
          LOAD_CELL: `Residual mass updated to ${(truck.sensors.loadCell.value + Math.random() * 0.4).toFixed(1)}t.`,
          ACOUSTIC: `Spectrum anomaly at ${(truck.sensors.acoustic.peakFreq + Math.round(Math.random() * 5)).toFixed(0)}Hz.`,
          CAMERA: `Vision confidence ${(84 + Math.round(Math.random() * 14)).toFixed(0)}%`,
          DECISION: status === "CARRY_BACK_DETECTED" ? "Threshold still exceeded." : "No anomaly escalation.",
          ACTION: "Action queue updated.",
          VIBRATION: "Vibration cycle in progress.",
          RESCAN: "Post-action scan complete.",
          STATUS_CLEAR: "Truck status marked clear.",
          STATUS_ALERT: "Truck status remains alert.",
        };
        const next: DecisionLogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          ts: new Date(),
          type: t,
          message: msgMap[t],
        };
        return [...prev.slice(-80), next];
      });
    }, 10_000);

    return () => window.clearInterval(updater);
  }, [status, truck.sensors.acoustic.peakFreq, truck.sensors.loadCell.value]);

  useEffect(() => {
    if (!logRef.current) {
      return;
    }
    logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const cycleBars = useMemo(() => {
    return truck.lastTenCycles
      .slice()
      .reverse()
      .map((cycle) => {
        const cycleN = cycle.cycleId.match(/C(\d+)$/)?.[1] ?? cycle.cycleId;
        const action = cycle.carryBackPct > 2 ? "Vibration + rescan" : cycle.carryBackPct > 0.5 ? "Flagged" : "Clear";
        return {
          cycle: cycleN,
          value: +cycle.carryBackPct.toFixed(2),
          action,
        };
      });
  }, [truck.lastTenCycles]);

  const loadCellSeries = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const v = +(truck.sensors.loadCell.value * (0.7 + (i / 22)) + Math.random() * 0.15).toFixed(2);
      return { idx: i, value: v };
    });
  }, [truck.sensors.loadCell.value]);

  const loadTrendUp = loadCellSeries[loadCellSeries.length - 1].value >= loadCellSeries[0].value;

  const ultraSeries = useMemo(() => {
    return Array.from({ length: 16 }, (_, i) => {
      const v = +(truck.sensors.ultrasonic.avgDepth + Math.sin(i / 2) * 2 + Math.random() * 1.1).toFixed(1);
      return { idx: i, value: Math.max(1.2, v) };
    });
  }, [truck.sensors.ultrasonic.avgDepth]);

  const timelineCurrentLabel = useMemo(() => {
    const active = timelineEvents.filter((event) => event.t <= elapsedSec).pop();
    return active ? `T+${elapsedSec}s — ${active.label}` : `T+${elapsedSec}s — Awaiting event`;
  }, [elapsedSec, timelineEvents]);

  const zoneHistory = useMemo(() => {
    if (!selectedZone) {
      return [];
    }
    const base = truck.bedZones[selectedZone].residueKg;
    return Array.from({ length: 5 }, (_, i) => {
      const ts = new Date(Date.now() - i * 15000);
      const val = Math.max(0, Math.round(base * (0.7 + Math.random() * 0.6)));
      const conf = Math.min(99, Math.round(truck.bedZones[selectedZone].confidence * 100 + (Math.random() * 8 - 4)));
      return {
        ts: formatTime(ts, true),
        residueKg: val,
        conf,
      };
    });
  }, [selectedZone, truck.bedZones]);

  function addLog(type: DecisionType, message: string) {
    setLogs((prev) => [...prev.slice(-120), { id: `${Date.now()}-${Math.random()}`, ts: new Date(), type, message }]);
  }

  function executeAction() {
    setVibrationRunning(true);
    addLog("ACTION", "Recommended action execution requested.");
    addLog("VIBRATION", "Vibration sequence initiated by operator.");
    toast.info("Vibration sequence started.");

    window.setTimeout(() => {
      addLog("RESCAN", "Rescan completed after vibration pulse.");
      addLog("STATUS_CLEAR", `Truck ${truck.id} marked OPERATIONAL.`);
      setStatus("OPERATIONAL");
      setVibrationRunning(false);
      toast.success(`CAT ${truck.id} cleared after action.`);
    }, 2200);
  }

  function guardedAction(label: string, type: DecisionType, onApply?: () => void) {
    const ok = window.confirm(`${label}? Confirm to continue.`);
    if (!ok) {
      return;
    }
    addLog(type, `${label} executed by ${user?.role ?? "UNKNOWN"}.`);
    if (onApply) {
      onApply();
    }
    toast.success(`${label} executed.`);
  }

  if (!truck) {
    return (
      <div className="rounded-lg border border-[#2A2A2A] bg-[#111111] p-6 text-[#F5F5F5]">
        Truck not found.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-4 space-y-4">
          <div>
            <h1 className="text-[28px] leading-none font-mono font-bold text-[#FFC107]">CAT {truck.id}</h1>
            <p className="mt-2 text-xs text-[#9CA3AF]">{truck.model.startsWith("Caterpillar") ? truck.model : `Caterpillar ${truck.model}`} | {truck.payloadClass}t payload class</p>
            <p className="text-xs text-[#9CA3AF]">CAT C175-16 | 2,610 HP</p>
            <div className="h-px bg-[#262626] my-3" />
            <p className="text-xs text-[#9CA3AF]">Operator: <span className="text-[#E5E7EB]">{truck.operator}</span></p>
            <p className="text-xs text-[#9CA3AF] mt-1">Shift start: <span className="text-[#E5E7EB]">{formatTime(shiftStart)} AEST</span></p>
            <p className="text-xs text-[#9CA3AF] mt-1">Total cycles: <span className="text-[#E5E7EB] tabular-nums">{truck.cyclesTotal}</span></p>
            <button
              className={`mt-3 w-full rounded-md border px-2 py-2 text-xs font-semibold tracking-wide ${statusColor(status)} ${status === "CARRY_BACK_DETECTED" ? "smartbed-status-pulse-border" : ""}`}
            >
              {status === "CARRY_BACK_DETECTED" ? "CARRY-BACK DETECTED" : "OPERATIONAL"}
            </button>
          </div>

          <div className="rounded-lg border border-[#242424] bg-[#0F0F0F] p-3">
            <p className="text-xs font-semibold tracking-wide text-[#FACC15]">CURRENT CYCLE #{truck.cyclesShift}</p>
            <div className="mt-2 space-y-1 text-xs">
              <p className="text-[#9CA3AF]">Load time: <span className="text-[#E5E7EB]">{formatTime(loadTime)}</span></p>
              <p className="text-[#9CA3AF]">Haul distance: <span className="text-[#E5E7EB] tabular-nums">{haulDistance} km</span></p>
              <p className="text-[#9CA3AF]">Dump start: <span className="text-[#E5E7EB]">{formatTime(cycleStart, true)}</span></p>
              <p className="text-[#9CA3AF]">Dump duration: <span className="text-[#E5E7EB] tabular-nums">{truck.currentCycle.dumpDurationSec}s</span></p>
              <p className="text-[#9CA3AF]">
                Bed angle: <span className={`tabular-nums ${currentAngle >= optimalAngle ? "text-[#22C55E]" : "text-[#EF4444]"}`}>{currentAngle}°</span>
              </p>
              <p className="text-[#9CA3AF]">Optimal angle: <span className="text-[#6B7280] tabular-nums">{optimalAngle}°</span></p>
              <p className="text-[#9CA3AF]">Material type: <span className="text-[#E5E7EB]">{material}</span></p>
              <p className="text-[#9CA3AF]">Moisture: <span className={`tabular-nums ${moistureClass(moisture)}`}>{moisture}%</span></p>
            </div>
          </div>

          <div className="rounded-lg border border-[#242424] bg-[#0F0F0F] p-3 h-[190px]">
            <p className="text-xs font-semibold tracking-wide text-[#FACC15] mb-2">LAST 10 CYCLES</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cycleBars}>
                <XAxis dataKey="cycle" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{ background: "#0B0B0B", border: "1px solid #303030", borderRadius: 8 }}
                  formatter={((value: ValueType | undefined, _name: NameType, payload?: { payload?: { action?: string } }) => {
                    const numeric = typeof value === "number" ? value : Number(value ?? 0);
                    return [`${numeric}%`, payload?.payload?.action ?? ""];
                  }) as any}
                />
                <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                  {cycleBars.map((entry, idx) => (
                    <Cell
                      key={`${entry.cycle}-${idx}`}
                      fill={entry.value > 2 ? "#EF4444" : entry.value >= 0.5 ? "#F97316" : "#22C55E"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </aside>

        <main className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-4 space-y-4">
          <div className="rounded-lg border border-[#232323] bg-[#0F0F0F] p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h2 className="text-sm font-semibold tracking-wide text-[#FACC15]">BED VISUALIZATION</h2>
              <div className="rounded-md border border-[#2A2A2A] p-1 inline-flex text-xs">
                <button
                  className={`px-2 py-1 rounded ${viewMode === "TOP" ? "bg-[#1F2937] text-[#F5F5F5]" : "text-[#9CA3AF]"}`}
                  onClick={() => setViewMode("TOP")}
                >
                  TOP VIEW
                </button>
                <button
                  className={`px-2 py-1 rounded ${viewMode === "SIDE" ? "bg-[#1F2937] text-[#F5F5F5]" : "text-[#9CA3AF]"}`}
                  onClick={() => setViewMode("SIDE")}
                >
                  3D SIDE VIEW
                </button>
              </div>
            </div>

            {viewMode === "TOP" ? (
              <>
                <div className="overflow-auto">
                  <svg viewBox="0 0 380 230" className="w-full min-h-[260px]">
                    <polygon points="40,40 334,40 362,192 24,192" fill="#0D0D0D" stroke="#3A3A3A" strokeWidth="1.5" />
                    <line x1="160" y1="44" x2="142" y2="192" stroke="#2D2D2D" strokeWidth="1" />
                    <line x1="234" y1="44" x2="234" y2="192" stroke="#2D2D2D" strokeWidth="1" />
                    <line x1="58" y1="106" x2="344" y2="106" stroke="#2D2D2D" strokeWidth="1" />

                    {(Object.keys(zonePosition) as ZoneKey[]).map((zone) => {
                      const def = zonePosition[zone];
                      const z = truck.bedZones[zone];
                      const severity = zoneSeverity(z);
                      const residueTon = z.residueKg / 1000;
                      return (
                        <g key={zone} onClick={() => setSelectedZone(zone)} className="cursor-pointer">
                          <rect
                            x={def.x}
                            y={def.y}
                            width={def.w}
                            height={def.h}
                            rx={4}
                            fill={severity.bg}
                            stroke="#333333"
                            className={severity.label === "Critical" ? "smartbed-zone-breathe" : ""}
                          />
                          <text x={def.x + 8} y={def.y + 16} fill="#F5F5F5" fontSize="11" fontWeight="700">{zone}</text>
                          {residueTon > 0.01 && (
                            <text x={def.x + 8} y={def.y + 34} fill="#E5E7EB" fontSize="10" className="font-mono">{residueTon.toFixed(2)}t</text>
                          )}
                          <text x={def.x + 8} y={def.y + 50} fill="#9CA3AF" fontSize="10">Conf: {(z.confidence * 100).toFixed(0)}%</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#9CA3AF]">
                  <Legend swatch="#161616" label="Clear" />
                  <Legend swatch="#F9731620" label="Low" />
                  <Legend swatch="#F9731650" label="Medium" />
                  <Legend swatch="#EF444480" label="High" />
                  <Legend swatch="#EF4444CC" label="Critical" />
                </div>
              </>
            ) : (
              <div className="h-[280px] rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] p-4 flex items-center justify-center">
                <div className="w-full max-w-[540px]">
                  <div className="relative h-[170px] [perspective:800px]">
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 top-6 w-[300px] h-[95px] border border-[#4B5563] bg-[#151515] rounded-md transition-transform duration-500 ${vibrationRunning ? "animate-[smartbedShake_0.35s_linear_infinite]" : ""}`}
                      style={{ transform: `translateX(-50%) rotateX(${Math.max(18, 65 - currentAngle)}deg)` }}
                    >
                      <div className="absolute left-4 top-3 text-[10px] text-[#9CA3AF]">Rear</div>
                      <div className="absolute right-4 bottom-2 text-[10px] text-[#9CA3AF]">Front</div>
                      {status === "CARRY_BACK_DETECTED" && (
                        <div className="absolute right-2 bottom-2 w-[120px] h-[32px] rounded-sm bg-[#1F1A1A] border border-[#EF4444]" />
                      )}
                    </div>
                    <div className="absolute right-2 top-0 text-xs text-[#9CA3AF] text-right">
                      <p>Current: <span className={`${currentAngle >= optimalAngle ? "text-[#22C55E]" : "text-[#EF4444]"}`}>{currentAngle}°</span></p>
                      <p>Optimal: <span className="text-[#D1D5DB]">{optimalAngle}°</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-[#232323] bg-[#0F0F0F] p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide text-[#FACC15]">DUMP CYCLE TIMELINE</h3>
              <span className="text-xs text-[#9CA3AF]">RAISED → LOWERED</span>
            </div>
            <div className="mt-3 relative h-4 rounded-full bg-[#151515] border border-[#2A2A2A] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#FACC15] via-[#F59E0B] to-[#B45309]" style={{ width: `${(elapsedSec / 90) * 100}%` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white smartbed-timeline-dot" style={{ left: `calc(${(elapsedSec / 90) * 100}% - 6px)` }} />
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
              {timelineEvents.map((event) => (
                <p key={event.label} className={`font-mono ${elapsedSec >= event.t ? "text-[#F5F5F5]" : "text-[#6B7280]"}`}>
                  T+{event.t}s: {event.label}
                </p>
              ))}
            </div>
            <p className="mt-3 text-xs font-mono text-[#FACC15]">{timelineCurrentLabel}</p>
          </div>
        </main>

        <aside className="rounded-xl border border-[#1F1F1F] bg-[#111111] p-4 space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold tracking-wide text-[#FACC15]">SENSOR TELEMETRY</h3>

            <TelemetryCard title="Load Cell">
              <p className="text-[#FACC15] font-semibold tabular-nums">{truck.sensors.loadCell.value.toFixed(2)}t detected</p>
              <div className="mt-2 flex items-end gap-1 h-12">
                {loadCellSeries.map((d) => (
                  <span
                    key={`l-${d.idx}`}
                    className="w-1.5 rounded-t"
                    style={{
                      height: `${Math.max(10, d.value * 18)}px`,
                      background: d.value > 2.6 ? "#EF4444" : d.value > 1.2 ? "#F97316" : "#22C55E",
                    }}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-[#9CA3AF]">Trend: <span className={loadTrendUp ? "text-[#22C55E]" : "text-[#EF4444]"}>{loadTrendUp ? "↑" : "↓"}</span></p>
            </TelemetryCard>

            <TelemetryCard title="Acoustic Array">
              <p className={`font-semibold ${Math.abs(truck.sensors.acoustic.deviation) > 35 ? "text-[#EF4444]" : "text-[#22C55E]"}`}>
                {truck.sensors.acoustic.deviation > 0 ? "+" : ""}{truck.sensors.acoustic.deviation}Hz deviation
              </p>
              <div className="mt-2 h-8 rounded bg-[#0A0A0A] overflow-hidden relative border border-[#242424]">
                <div className="absolute inset-0 smartbed-wave" />
              </div>
              <p className="mt-1 text-xs text-[#9CA3AF]">Deviation from 847Hz baseline</p>
            </TelemetryCard>

            <TelemetryCard title="Camera (IP67)">
              <p className="text-sm text-[#E5E7EB]">{truck.sensors.camera.zones.join(", ") || "No active zones"}</p>
              <div className="mt-2 space-y-1">
                {(truck.sensors.camera.zones.length > 0 ? truck.sensors.camera.zones : ["FL"]).map((zone, i) => {
                  const conf = Math.max(62, Math.min(98, Math.round(truck.sensors.camera.clarity * 100 - i * 8)));
                  return (
                    <div key={zone} className="flex items-center gap-2 text-xs">
                      <span className="w-6 text-[#9CA3AF]">{zone}</span>
                      <div className="h-2 flex-1 rounded bg-[#1A1A1A] overflow-hidden">
                        <div className="h-full bg-[#22C55E]" style={{ width: `${conf}%` }} />
                      </div>
                      <span className="text-[#9CA3AF] tabular-nums">{conf}%</span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-[#9CA3AF]">Clarity: {(truck.sensors.camera.clarity * 100).toFixed(0)}%</p>
            </TelemetryCard>

            <TelemetryCard title="Ultrasonic">
              <p className="text-[#93C5FD] font-semibold tabular-nums">{truck.sensors.ultrasonic.avgDepth.toFixed(1)}cm avg</p>
              <div className="mt-2 h-12 flex items-end gap-1">
                {ultraSeries.map((d) => (
                  <span
                    key={`u-${d.idx}`}
                    className="w-1.5 rounded-t bg-[#3B82F6]"
                    style={{ height: `${Math.max(6, d.value * 3)}px` }}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-[#9CA3AF]">Range: {Math.min(...ultraSeries.map((s) => s.value)).toFixed(1)} - {Math.max(...ultraSeries.map((s) => s.value)).toFixed(1)}cm</p>
            </TelemetryCard>
          </div>

          <div className="rounded-lg border border-[#232323] bg-[#0F0F0F] p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold tracking-wide text-[#FACC15]">AI DECISION LOG</h3>
              <button className="text-xs text-[#9CA3AF] hover:text-[#F5F5F5]" onClick={() => setLogs([])}>Clear log</button>
            </div>
            <div ref={logRef} className="mt-2 h-[200px] overflow-y-auto space-y-1 pr-1">
              {logs.map((log) => (
                <div key={log.id} className="text-[11px] font-mono smartbed-log-entry">
                  <span className="text-[#6B7280]">[{formatTime(log.ts, true)}]</span>{" "}
                  <span className={toneClass(log.type)}>{log.type}</span>
                  <span className="text-[#9CA3AF]"> — {log.message}</span>
                </div>
              ))}
            </div>
          </div>

          {status === "CARRY_BACK_DETECTED" && (
            <div className="rounded-lg border border-[#2A2A2A] bg-[#121212] p-3 border-l-4 border-l-[#FACC15]">
              <h4 className="text-xs font-semibold tracking-wide text-[#FACC15]">RECOMMENDED ACTION</h4>
              <p className="mt-2 text-xs"><span className="text-[#FB923C]">IMMEDIATE:</span> Run 2-pass vibration at 7.2Hz.</p>
              <p className="mt-1 text-xs"><span className="text-[#FACC15]">SCHEDULED:</span> Inspect rear lip after shift change.</p>
              <p className="mt-1 text-xs text-[#9CA3AF]"><span className="text-[#6B7280]">NOTE:</span> Moisture profile suggests front-zone adhesion.</p>
              <button className="mt-3 w-full rounded-md bg-[#B91C1C] hover:bg-[#DC2626] text-white text-sm py-2" onClick={executeAction}>Execute Action</button>
              <button className="mt-1 w-full text-xs text-[#9CA3AF] hover:text-[#F5F5F5]" onClick={() => setStatus("OPERATIONAL")}>Dismiss</button>
            </div>
          )}

          {isPrivileged && (
            <div className="space-y-2 pt-1">
              <button
                className="w-full rounded-md border border-[#3B82F6] text-[#93C5FD] py-2 text-sm hover:bg-[#172554]"
                onClick={() => guardedAction("Trigger Manual Scan", "ACTION", () => addLog("RESCAN", "Manual scan complete."))}
              >
                Trigger Manual Scan
              </button>
              <button
                className="w-full rounded-md border border-[#F97316] text-[#FDBA74] py-2 text-sm hover:bg-[#3A1B06]"
                onClick={() => guardedAction("Force Vibration Cycle", "VIBRATION", () => setVibrationRunning(true))}
              >
                Force Vibration Cycle
              </button>
              <button
                className="w-full rounded-md bg-[#B91C1C] text-white py-2 text-sm hover:bg-[#DC2626]"
                onClick={() =>
                  guardedAction("Emergency Bed Clear", "ACTION", () => {
                    setStatus("OPERATIONAL");
                    addLog("STATUS_CLEAR", "Emergency bed clear completed.");
                  })
                }
              >
                Emergency Bed Clear
              </button>
            </div>
          )}
        </aside>
      </div>

      {selectedZone && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedZone(null)}>
          <div className="w-full max-w-[520px] rounded-xl border border-[#333333] bg-[#111111] p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#F5F5F5]">Zone {selectedZone} — CAT {truck.id}</h3>
              <button className="text-[#9CA3AF] hover:text-[#F5F5F5]" onClick={() => setSelectedZone(null)}>Close</button>
            </div>

            <div className="mt-3 grid sm:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md border border-[#252525] bg-[#0E0E0E] p-3">
                <p className="text-[#9CA3AF]">Residue</p>
                <p className="text-[#E5E7EB] font-semibold tabular-nums">{truck.bedZones[selectedZone].residueKg.toFixed(0)} kg</p>
                <p className="text-[#9CA3AF] mt-2">Confidence</p>
                <div className="mt-1 h-2 rounded bg-[#1A1A1A] overflow-hidden">
                  <div className="h-full bg-[#22C55E]" style={{ width: `${(truck.bedZones[selectedZone].confidence * 100).toFixed(0)}%` }} />
                </div>
                <p className="mt-1 text-xs text-[#9CA3AF]">{(truck.bedZones[selectedZone].confidence * 100).toFixed(0)}%</p>
              </div>

              <div className="rounded-md border border-[#252525] bg-[#0E0E0E] p-3">
                <p className="text-[#9CA3AF] mb-1">Sensors contributing</p>
                <SensorTick label="Camera" />
                <SensorTick label="Acoustic" />
                <SensorTick label="Ultrasonic" />
                <SensorTick label="Load Cell" />
              </div>
            </div>

            <div className="mt-3 rounded-md border border-[#252525] bg-[#0E0E0E] p-3 text-sm">
              <p className="text-[#9CA3AF]">Recommended action</p>
              <p className="text-[#E5E7EB] mt-1">Increase dump angle + perform targeted vibration on {selectedZone} region.</p>
            </div>

            <div className="mt-3 rounded-md border border-[#252525] bg-[#0E0E0E] p-3">
              <p className="text-sm text-[#9CA3AF] mb-2">History (last 5 readings)</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#6B7280] text-left">
                    <th className="py-1">Time</th>
                    <th className="py-1">Residue (kg)</th>
                    <th className="py-1">Conf</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneHistory.map((row) => (
                    <tr key={`${row.ts}-${row.residueKg}`} className="border-t border-[#1F1F1F] text-[#E5E7EB]">
                      <td className="py-1">{row.ts}</td>
                      <td className="py-1 tabular-nums">{row.residueKg}</td>
                      <td className="py-1 tabular-nums">{row.conf}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-3 w-3 rounded-sm border border-[#383838]" style={{ background: swatch }} />
      <span>{label}</span>
    </span>
  );
}

function SensorTick({ label }: { label: string }) {
  return (
    <p className="text-[#E5E7EB] inline-flex items-center gap-1 mt-1">
      <Check className="h-3.5 w-3.5 text-[#22C55E]" /> {label}
    </p>
  );
}

function TelemetryCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-[#252525] bg-[#0E0E0E] p-3">
      <p className="text-xs text-[#9CA3AF] mb-1">{title}</p>
      {children}
    </div>
  );
}
