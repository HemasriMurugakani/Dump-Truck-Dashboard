"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { TRUCKS, type TruckRecord } from "@/lib/mockData";
import { CalendarPlus2, Search, Wrench } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

type Severity = "HIGH" | "MED" | "LOW";
type ZoneKey = "FL" | "FC" | "FR" | "RL" | "RC" | "RR";
type HistoryTaskType = "Inspection" | "Liner" | "Actuator" | "Sensor" | "Hydraulics";
type SchedulePriority = "HIGH" | "MED" | "LOW";

type MaintenanceAlert = {
  id: string;
  severity: Severity;
  truckId: string;
  description: string;
  remainingCycles: number;
  action: string;
};

type WearZone = {
  zone: ZoneKey;
  wearPct: number;
};

type TrendPoint = {
  cycle: number;
  FL?: number;
  FC?: number;
  FR?: number;
  RL?: number;
  RC?: number;
  RR?: number;
  FLProjected?: number;
  FCProjected?: number;
  FRProjected?: number;
  RLProjected?: number;
  RCProjected?: number;
  RRProjected?: number;
};

type MaintenanceTask = {
  id: string;
  dateIso: string;
  truckId: string;
  description: string;
  duration: string;
  partsLink: string;
  completed: boolean;
  technician: string;
  priority: SchedulePriority;
  taskType: HistoryTaskType;
};

type InventoryItem = {
  part: string;
  qtyInStock: number;
  minStock: number;
};

type MaintenanceHistoryRow = {
  id: string;
  dateIso: string;
  truckId: string;
  taskType: HistoryTaskType;
  description: string;
  technician: string;
  duration: string;
  status: "Completed" | "Cancelled";
};

type Insight = {
  id: string;
  message: string;
  confidence: number;
  affectedTrucks: string[];
  action: string;
};

const ZONE_POLYGONS: Record<ZoneKey, string> = {
  FL: "62,24 118,24 102,50 54,50",
  FC: "118,24 162,24 150,50 102,50",
  FR: "162,24 218,24 226,50 150,50",
  RL: "54,50 102,50 92,95 42,95",
  RC: "102,50 150,50 144,95 92,95",
  RR: "150,50 226,50 238,95 144,95",
};

const ZONE_TEXT_POS: Record<ZoneKey, { x: number; y: number }> = {
  FL: { x: 80, y: 37 },
  FC: { x: 132, y: 37 },
  FR: { x: 190, y: 37 },
  RL: { x: 73, y: 69 },
  RC: { x: 120, y: 69 },
  RR: { x: 188, y: 69 },
};

const SEVERITY_RANK: Record<Severity, number> = {
  HIGH: 3,
  MED: 2,
  LOW: 1,
};

const ZONE_COLORS: Record<ZoneKey, string> = {
  FL: "#22C55E",
  FC: "#60A5FA",
  FR: "#A78BFA",
  RL: "#F97316",
  RC: "#14B8A6",
  RR: "#EF4444",
};

const INVENTORY_ROWS: InventoryItem[] = [
  { part: "Liner Plate RL", qtyInStock: 2, minStock: 4 },
  { part: "Vibration Motor VM-12", qtyInStock: 3, minStock: 3 },
  { part: "Hydraulic Seal Kit", qtyInStock: 5, minStock: 4 },
  { part: "Load Cell LC-650", qtyInStock: 1, minStock: 3 },
  { part: "Acoustic Sensor MEMS-X", qtyInStock: 9, minStock: 6 },
];

const DEFAULT_INSIGHTS: Insight[] = [
  {
    id: "i-1",
    message: "CAT 793-11 FL zone wear is accelerating - 3x normal rate due to wet clay material.",
    confidence: 92,
    affectedTrucks: ["793-11", "793-02"],
    action: "Reduce cycle payload by 5% and run post-dump scrape every 8 cycles.",
  },
  {
    id: "i-2",
    message: "Fleet average vibration motor life is reducing - recommend changing frequency to 20Hz.",
    confidence: 87,
    affectedTrucks: ["785-04", "785-07", "797-01"],
    action: "Push safe frequency profile update during next maintenance window.",
  },
  {
    id: "i-3",
    message: "Truck 785-04 consistently high carry-back in rainy conditions - consider moisture protocol adjustment.",
    confidence: 81,
    affectedTrucks: ["785-04"],
    action: "Enable moisture protocol and increase wash cycle frequency by 15%.",
  },
];

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

function severityPill(severity: Severity) {
  if (severity === "HIGH") {
    return "border-[#5B1F1F] bg-[#2A0D0D] text-[#EF4444]";
  }
  if (severity === "MED") {
    return "border-[#5B3A1F] bg-[#2A180D] text-[#F97316]";
  }
  return "border-[#1F5B30] bg-[#0F2316] text-[#22C55E]";
}

function wearBandColor(wearPct: number) {
  if (wearPct >= 75) {
    return "#EF4444";
  }
  if (wearPct >= 60) {
    return "#F97316";
  }
  if (wearPct >= 45) {
    return "#FACC15";
  }
  return "#22C55E";
}

function wearBandLabel(wearPct: number) {
  if (wearPct >= 75) {
    return "Critical";
  }
  if (wearPct >= 60) {
    return "Warning";
  }
  if (wearPct >= 45) {
    return "Good";
  }
  return "Excellent";
}

function useMeasuredWidth(minWidth: number) {
  const [ref] = useState(() => ({ current: null as HTMLDivElement | null }));
  const [width, setWidth] = useState(minWidth);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    const update = () => {
      if (!ref.current) {
        return;
      }
      setWidth(Math.max(minWidth, Math.floor(ref.current.clientWidth)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [minWidth, ref]);

  return { ref, width };
}

function buildWearZones(truck: TruckRecord): WearZone[] {
  const base = hashNumber(truck.id + truck.operator);
  const cbFactor = truck.carryBackPct * 9;
  const noise = (offset: number) => ((base >> offset) % 12) - 5;

  const map: Record<ZoneKey, number> = {
    FL: clamp(35 + cbFactor * 0.9 + noise(2), 18, 92),
    FC: clamp(28 + cbFactor * 0.55 + noise(5), 14, 88),
    FR: clamp(30 + cbFactor * 0.52 + noise(9), 15, 90),
    RL: clamp(45 + cbFactor * 1.35 + noise(4), 25, 97),
    RC: clamp(34 + cbFactor * 0.9 + noise(7), 18, 94),
    RR: clamp(40 + cbFactor * 1.02 + noise(3), 20, 96),
  };

  return (["FL", "FC", "FR", "RL", "RC", "RR"] as ZoneKey[]).map((zone) => ({ zone, wearPct: map[zone] }));
}

function buildTrend(truck: TruckRecord, zones: WearZone[]): TrendPoint[] {
  const seed = hashNumber(`${truck.id}-trend`);
  const points: TrendPoint[] = [];

  const totalPastPoints = 26;
  for (let i = 0; i < totalPastPoints; i += 1) {
    const cycle = -500 + i * 20;
    const row: TrendPoint = { cycle };

    zones.forEach((zone, zoneIndex) => {
      const volatility = 1.6 + (zoneIndex % 3) * 0.7;
      const baseline = zone.wearPct - (totalPastPoints - i) * (0.7 + zoneIndex * 0.05);
      const noise = Math.sin((seed + zoneIndex * 13 + i * 9) * 0.03) * volatility;
      const value = clamp(baseline + noise, 4, 97);
      row[zone.zone] = +value.toFixed(1);
    });

    points.push(row);
  }

  const projectionPoints = 8;
  for (let i = 0; i < projectionPoints; i += 1) {
    const cycle = 20 + i * 20;
    const row: TrendPoint = { cycle };

    zones.forEach((zone, zoneIndex) => {
      const growth = 0.9 + zoneIndex * 0.08 + truck.carryBackPct * 0.07;
      const projected = clamp(zone.wearPct + growth * (i + 1), 0, 100);
      row[`${zone.zone}Projected` as keyof TrendPoint] = +projected.toFixed(1);
    });

    points.push(row);
  }

  return points;
}

function generateAlerts(): MaintenanceAlert[] {
  const templates = [
    {
      severity: "HIGH" as Severity,
      text: "Rear-left liner wear crossing threshold.",
      action: "Schedule liner reinforcement and check vibration profile.",
    },
    {
      severity: "MED" as Severity,
      text: "Acoustic sensor drift detected during high payload cycles.",
      action: "Run sensor calibration at next shift handover.",
    },
    {
      severity: "LOW" as Severity,
      text: "Hydraulic pressure fluctuation within tolerance band.",
      action: "Monitor for 72h, no immediate intervention.",
    },
  ];

  return TRUCKS.map((truck, idx) => {
    const seed = hashNumber(truck.id);
    const tpl = templates[idx % templates.length];

    return {
      id: `ma-${truck.id}`,
      severity: tpl.severity,
      truckId: truck.id,
      description: tpl.text,
      remainingCycles: 180 + (seed % 520),
      action: tpl.action,
    };
  }).sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}

function initialTasks(): MaintenanceTask[] {
  const now = new Date();
  const day = 24 * 3600_000;

  return [
    {
      id: "tsk-1",
      dateIso: new Date(now.getTime() - day).toISOString(),
      truckId: "793-11",
      description: "Rear-left liner inspection",
      duration: "~2h",
      partsLink: "View parts",
      completed: false,
      technician: "P. Sharma",
      priority: "HIGH",
      taskType: "Inspection",
    },
    {
      id: "tsk-2",
      dateIso: new Date(now.getTime()).toISOString(),
      truckId: "785-04",
      description: "Vibration motor frequency tune",
      duration: "~1.5h",
      partsLink: "View parts",
      completed: false,
      technician: "M. Singh",
      priority: "MED",
      taskType: "Actuator",
    },
    {
      id: "tsk-3",
      dateIso: new Date(now.getTime() + day).toISOString(),
      truckId: "797-01",
      description: "Load cell calibration",
      duration: "~1h",
      partsLink: "View parts",
      completed: false,
      technician: "J. Ramesh",
      priority: "LOW",
      taskType: "Sensor",
    },
    {
      id: "tsk-4",
      dateIso: new Date(now.getTime() + day * 3).toISOString(),
      truckId: "793-02",
      description: "Liner patch replacement (FC/RC)",
      duration: "~3h",
      partsLink: "View parts",
      completed: false,
      technician: "P. Sharma",
      priority: "HIGH",
      taskType: "Liner",
    },
  ];
}

function initialHistory(): MaintenanceHistoryRow[] {
  const now = Date.now();
  const day = 24 * 3600_000;
  const rows: MaintenanceHistoryRow[] = [];
  const types: HistoryTaskType[] = ["Inspection", "Liner", "Actuator", "Sensor", "Hydraulics"];

  for (let i = 0; i < 42; i += 1) {
    const truck = TRUCKS[i % TRUCKS.length];
    const taskType = types[i % types.length];
    rows.push({
      id: `hist-${i + 1}`,
      dateIso: new Date(now - i * day * 1.6).toISOString(),
      truckId: truck.id,
      taskType,
      description:
        taskType === "Liner"
          ? "Liner patch and bolt torque validation"
          : taskType === "Actuator"
            ? "Vibration motor calibration and thermal check"
            : taskType === "Sensor"
              ? "Acoustic and load-cell baseline calibration"
              : taskType === "Hydraulics"
                ? "Hydraulic pressure test and seal check"
                : "Pre-shift wear inspection",
      technician: i % 2 === 0 ? "P. Sharma" : "M. Singh",
      duration: `${1 + (i % 4)}h`,
      status: i % 13 === 0 ? "Cancelled" : "Completed",
    });
  }

  return rows;
}

function formatDateLabel(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  });
}

function isSameDay(dateA: Date, dateB: Date) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

export function PredictiveMaintenancePage() {
  const { user } = useAuth();

  const [alerts] = useState<MaintenanceAlert[]>(() => generateAlerts());
  const [severityFilter, setSeverityFilter] = useState<"ALL" | Severity>("ALL");
  const [selectedTruckId, setSelectedTruckId] = useState(alerts[0]?.truckId ?? TRUCKS[0].id);

  const [tasks, setTasks] = useState<MaintenanceTask[]>(() => initialTasks());
  const [historyRows] = useState<MaintenanceHistoryRow[]>(() => initialHistory());
  const [insights, setInsights] = useState<Insight[]>(DEFAULT_INSIGHTS);

  const [historyTab, setHistoryTab] = useState<"ANALYSIS" | "HISTORY">("ANALYSIS");
  const [historyTruckFilter, setHistoryTruckFilter] = useState<string>("ALL");
  const [historyTypeFilter, setHistoryTypeFilter] = useState<"ALL" | HistoryTaskType>("ALL");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");

  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [newTaskTruck, setNewTaskTruck] = useState(TRUCKS[0].id);
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTaskType, setNewTaskType] = useState<HistoryTaskType>("Inspection");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskTechnician, setNewTaskTechnician] = useState("P. Sharma");
  const [newTaskPriority, setNewTaskPriority] = useState<SchedulePriority>("MED");

  const selectedTruck = useMemo(() => TRUCKS.find((truck) => truck.id === selectedTruckId) ?? TRUCKS[0], [selectedTruckId]);

  const filteredAlerts = useMemo(() => {
    if (severityFilter === "ALL") {
      return alerts;
    }
    return alerts.filter((alert) => alert.severity === severityFilter);
  }, [alerts, severityFilter]);

  const countBySeverity = useMemo(
    () => ({
      ALL: alerts.length,
      HIGH: alerts.filter((alert) => alert.severity === "HIGH").length,
      MED: alerts.filter((alert) => alert.severity === "MED").length,
      LOW: alerts.filter((alert) => alert.severity === "LOW").length,
    }),
    [alerts],
  );

  const wearZones = useMemo(() => buildWearZones(selectedTruck), [selectedTruck]);
  const trendSeries = useMemo(() => buildTrend(selectedTruck, wearZones), [selectedTruck, wearZones]);

  const [animatedWear, setAnimatedWear] = useState<Record<ZoneKey, number>>({
    FL: 0,
    FC: 0,
    FR: 0,
    RL: 0,
    RC: 0,
    RR: 0,
  });

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 1000;

    const target = wearZones.reduce(
      (acc, zone) => {
        acc[zone.zone] = zone.wearPct;
        return acc;
      },
      { FL: 0, FC: 0, FR: 0, RL: 0, RC: 0, RR: 0 } as Record<ZoneKey, number>,
    );

    const tick = () => {
      const elapsed = performance.now() - start;
      const t = clamp(elapsed / duration, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);

      setAnimatedWear({
        FL: +(target.FL * eased).toFixed(1),
        FC: +(target.FC * eased).toFixed(1),
        FR: +(target.FR * eased).toFixed(1),
        RL: +(target.RL * eased).toFixed(1),
        RC: +(target.RC * eased).toFixed(1),
        RR: +(target.RR * eased).toFixed(1),
      });

      if (t < 1) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [wearZones]);

  const replacementProjection = useMemo(() => {
    const rearLeft = wearZones.find((zone) => zone.zone === "RL")?.wearPct ?? 0;
    const averageWear = wearZones.reduce((sum, zone) => sum + zone.wearPct, 0) / wearZones.length;

    const rearRemainingCycles = Math.max(80, Math.round((100 - rearLeft) * 13.6));
    const fullBedCycles = Math.max(240, Math.round((100 - averageWear) * 35));

    return {
      rearRemainingCycles,
      rearDays: Math.max(2, Math.round(rearRemainingCycles / 48)),
      fullBedCycles,
      fullDays: Math.max(5, Math.round(fullBedCycles / 48)),
    };
  }, [wearZones]);

  const costRows = useMemo(() => {
    const rows = [
      {
        component: "Bed liner - Rear Left",
        status: wearBandLabel(wearZones.find((zone) => zone.zone === "RL")?.wearPct ?? 0),
        life: `${replacementProjection.rearRemainingCycles} cycles`,
        replacementCost: 14500,
        urgency: "HIGH",
      },
      {
        component: "Vibration actuator",
        status: "Good",
        life: "1,480 cycles",
        replacementCost: 6800,
        urgency: "MED",
      },
      {
        component: "Load-cell pair",
        status: "Warning",
        life: "920 cycles",
        replacementCost: 5200,
        urgency: "MED",
      },
      {
        component: "Hydraulic seal set",
        status: "Excellent",
        life: "2,300 cycles",
        replacementCost: 2900,
        urgency: "LOW",
      },
    ];

    const total90Days = rows.reduce((sum, row) => sum + row.replacementCost, 0) + 6100;

    return { rows, total90Days };
  }, [replacementProjection.rearRemainingCycles, wearZones]);

  const today = new Date();
  const sortedTasks = useMemo(
    () => tasks.slice().sort((a, b) => new Date(a.dateIso).getTime() - new Date(b.dateIso).getTime()),
    [tasks],
  );

  const partsRows = useMemo(
    () =>
      INVENTORY_ROWS.map((item) => {
        const status = item.qtyInStock <= item.minStock * 0.5 ? "ORDER NOW" : item.qtyInStock < item.minStock ? "LOW" : "OK";
        return { ...item, status };
      }),
    [],
  );

  const technicianBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    sortedTasks.forEach((task) => {
      map.set(task.technician, (map.get(task.technician) ?? 0) + (task.completed ? 0 : 1));
    });
    return Array.from(map.entries()).map(([name, tasksCount], idx) => ({
      name,
      tasks: tasksCount,
      fill: ["#FACC15", "#60A5FA", "#F97316", "#22C55E"][idx % 4],
    }));
  }, [sortedTasks]);

  const historyFiltered = useMemo(() => {
    return historyRows.filter((row) => {
      if (historyTruckFilter !== "ALL" && row.truckId !== historyTruckFilter) {
        return false;
      }
      if (historyTypeFilter !== "ALL" && row.taskType !== historyTypeFilter) {
        return false;
      }
      if (historyFrom && new Date(row.dateIso).getTime() < new Date(historyFrom).getTime()) {
        return false;
      }
      if (historyTo && new Date(row.dateIso).getTime() > new Date(`${historyTo}T23:59:59`).getTime()) {
        return false;
      }
      if (historyQuery) {
        const q = historyQuery.toLowerCase();
        const blob = `${row.truckId} ${row.description} ${row.technician} ${row.taskType}`.toLowerCase();
        if (!blob.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [historyFrom, historyQuery, historyRows, historyTo, historyTruckFilter, historyTypeFilter]);

  const canScheduleEdit = user?.role === "MAINTENANCE_TECH";

  const trendMeasure = useMeasuredWidth(620);
  const workloadMeasure = useMeasuredWidth(220);

  const toggleTask = (taskId: string) => {
    if (!canScheduleEdit) {
      toast.warning("Maintenance schedule is read-only for this role.");
      return;
    }

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) {
          return task;
        }
        return { ...task, completed: !task.completed };
      }),
    );
  };

  const submitNewTask = () => {
    if (!canScheduleEdit) {
      toast.warning("Only MAINTENANCE_TECH can add schedule tasks.");
      return;
    }

    if (!newTaskDescription.trim()) {
      toast.error("Task description is required.");
      return;
    }

    const task: MaintenanceTask = {
      id: `tsk-${Date.now()}`,
      dateIso: new Date(`${newTaskDate}T08:00:00`).toISOString(),
      truckId: newTaskTruck,
      description: newTaskDescription.trim(),
      duration: newTaskType === "Liner" ? "~3h" : newTaskType === "Hydraulics" ? "~2h" : "~1.5h",
      partsLink: "View parts",
      completed: false,
      technician: newTaskTechnician,
      priority: newTaskPriority,
      taskType: newTaskType,
    };

    setTasks((prev) => [...prev, task]);
    setAddTaskOpen(false);
    setNewTaskDescription("");
    toast.success("Maintenance task added.");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#2D2D2D] bg-gradient-to-b from-[#141414] to-[#0F0F0F] p-3 md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold tracking-[0.08em] text-[#F5F5F5]">PREDICTIVE MAINTENANCE</p>
            <p className="text-xs text-[#9CA3AF]">Wear intelligence, schedule orchestration, and proactive risk control.</p>
          </div>
          <div className="text-xs text-[#9CA3AF] text-right">
            <div>
              Active truck: <span className="font-semibold text-[#FACC15]">CAT {selectedTruck.id}</span>
            </div>
            {!canScheduleEdit ? <div className="mt-1 text-[#FACC15]">Read-only schedule mode</div> : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_280px] gap-4 items-start">
        <aside className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3 space-y-3 sticky top-20">
          <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15]">MAINTENANCE ALERTS</p>

          <div className="grid grid-cols-4 gap-1">
            {([
              { key: "ALL", label: "ALL" },
              { key: "HIGH", label: "HIGH" },
              { key: "MED", label: "MED" },
              { key: "LOW", label: "LOW" },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSeverityFilter(tab.key)}
                className={`rounded border px-1 py-1 text-[11px] ${
                  severityFilter === tab.key ? "border-[#FACC15] bg-[#2A220A] text-[#FACC15]" : "border-[#2F2F2F] bg-[#151515] text-[#A3A3A3]"
                }`}
              >
                {tab.label}
                <span className="ml-1 text-[10px] text-[#D1D5DB]">{countBySeverity[tab.key]}</span>
              </button>
            ))}
          </div>

          <div className="space-y-2 max-h-[70vh] overflow-auto pr-1">
            {filteredAlerts.map((alert) => {
              const active = alert.truckId === selectedTruckId;
              return (
                <button
                  key={alert.id}
                  onClick={() => setSelectedTruckId(alert.truckId)}
                  className={`w-full rounded-lg border p-2 text-left transition-colors ${active ? "border-[#FACC15] bg-[#1B160A]" : "border-[#2D2D2D] bg-[#141414] hover:border-[#4A4A4A]"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${severityPill(alert.severity)}`}>{alert.severity}</span>
                    <span className="font-mono text-sm font-bold text-[#F5F5F5]">CAT {alert.truckId}</span>
                  </div>

                  <p className="mt-2 text-xs text-[#D1D5DB] leading-relaxed">{alert.description}</p>
                  <p className="mt-1 text-[11px] text-[#9CA3AF]">
                    Est. remaining: <span className="font-semibold text-[#F59E0B] tabular-nums">{alert.remainingCycles} cycles</span>
                  </p>
                  <p className="mt-1 text-[11px] italic text-[#9CA3AF]">Action: {alert.action}</p>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-3 min-w-0">
          <div className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15]">BED WEAR ANALYSIS - CAT {selectedTruck.id}</p>
              <div className="flex gap-1">
                <button
                  onClick={() => setHistoryTab("ANALYSIS")}
                  className={`rounded border px-2 py-1 text-[11px] ${historyTab === "ANALYSIS" ? "border-[#FACC15] bg-[#2A220A] text-[#FACC15]" : "border-[#2F2F2F] text-[#A3A3A3]"}`}
                >
                  Wear Analysis
                </button>
                <button
                  onClick={() => setHistoryTab("HISTORY")}
                  className={`rounded border px-2 py-1 text-[11px] ${historyTab === "HISTORY" ? "border-[#FACC15] bg-[#2A220A] text-[#FACC15]" : "border-[#2F2F2F] text-[#A3A3A3]"}`}
                >
                  Maintenance History
                </button>
              </div>
            </div>
          </div>

          {historyTab === "ANALYSIS" ? (
            <>
              <div className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-4">
                <div className="w-full max-w-[620px] mx-auto rounded-lg border border-[#272727] bg-[#0E0E0E] p-3">
                  <svg viewBox="0 0 280 124" className="w-full h-auto" role="img" aria-label={`Wear map for truck ${selectedTruck.id}`}>
                    <polygon points="42,20 220,20 244,98 30,98" className="fill-[#101010] stroke-[#3A3A3A]" strokeWidth="1.2" />
                    {wearZones.map((zone) => {
                      const currentWear = animatedWear[zone.zone];
                      const textPos = ZONE_TEXT_POS[zone.zone];
                      const color = wearBandColor(currentWear);

                      return (
                        <g key={zone.zone}>
                          <polygon points={ZONE_POLYGONS[zone.zone]} fill={color} fillOpacity="0.82" stroke="#222" strokeWidth="1" />
                          <text x={textPos.x} y={textPos.y - 6} fill="#F5F5F5" fontSize="9" textAnchor="middle" fontWeight="700">
                            {zone.zone}
                          </text>
                          <text x={textPos.x} y={textPos.y + 6} fill="#F5F5F5" fontSize="9" textAnchor="middle" fontWeight="700">
                            {currentWear.toFixed(0)}%
                          </text>
                          <text x={textPos.x} y={textPos.y + 16} fill="#D1D5DB" fontSize="7" textAnchor="middle">
                            Worn
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[11px] text-[#D1D5DB]">
                  <LegendDot color="#22C55E" text="Excellent (0-45%)" />
                  <LegendDot color="#FACC15" text="Good (45-60%)" />
                  <LegendDot color="#F97316" text="Warning (60-75%)" />
                  <LegendDot color="#EF4444" text="Critical (75%+)" />
                </div>
              </div>

              <div className="rounded-lg border border-[#A97B00] bg-[#1F1808] p-3">
                <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15]">PROJECTED BED LINER REPLACEMENT</p>
                <p className="mt-2 text-sm text-[#E5E7EB]">
                  Rear-Left zone: <span className="font-semibold text-[#FACC15] tabular-nums">{replacementProjection.rearRemainingCycles} cycles</span> / ~{replacementProjection.rearDays} days at current rate
                </p>
                <p className="mt-1 text-sm text-[#E5E7EB]">
                  Full bed replacement: <span className="font-semibold text-[#FACC15] tabular-nums">~{replacementProjection.fullBedCycles} cycles</span> / ~{replacementProjection.fullDays} days
                </p>
              </div>

              <div
                className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3"
                ref={(node) => {
                  trendMeasure.ref.current = node;
                }}
              >
                <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15] mb-2">WEAR TREND - LAST 500 CYCLES + PROJECTION</p>
                <LineChart width={trendMeasure.width} height={280} data={trendSeries} margin={{ top: 6, right: 12, left: 4, bottom: 8 }}>
                  <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                  <XAxis dataKey="cycle" stroke="#7C7C7C" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                  <YAxis domain={[0, 100]} stroke="#7C7C7C" tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                  <Tooltip
                    contentStyle={{ background: "#0B0B0B", border: "1px solid #303030", borderRadius: 8 }}
                    labelStyle={{ color: "#F5F5F5" }}
                    formatter={(value: unknown, name: unknown) => {
                      const numeric = typeof value === "number" ? value : Number(value ?? 0);
                      return [`${numeric.toFixed(1)}%`, String(name ?? "Zone")];
                    }}
                  />
                  <ReferenceLine y={75} stroke="#EF4444" strokeDasharray="6 4" label={{ value: "Replacement threshold", fill: "#EF4444", fontSize: 10 }} />

                  {(Object.keys(ZONE_COLORS) as ZoneKey[]).map((zone) => (
                    <Line key={zone} type="monotone" dataKey={zone} stroke={ZONE_COLORS[zone]} strokeWidth={1.8} dot={false} connectNulls />
                  ))}

                  {(Object.keys(ZONE_COLORS) as ZoneKey[]).map((zone) => (
                    <Line key={`${zone}-proj`} type="monotone" dataKey={`${zone}Projected`} stroke={ZONE_COLORS[zone]} strokeWidth={1.8} strokeDasharray="5 5" dot={false} connectNulls />
                  ))}
                </LineChart>
              </div>

              <div className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3">
                <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15]">COST AVOIDANCE SUMMARY</p>
                <table className="w-full mt-2 text-xs">
                  <thead className="border-b border-[#242424] text-[#9CA3AF]">
                    <tr>
                      <th className="py-2 text-left">Component</th>
                      <th className="py-2 text-left">Current Status</th>
                      <th className="py-2 text-left">Est. Remaining Life</th>
                      <th className="py-2 text-left">Replacement Cost</th>
                      <th className="py-2 text-left">Urgency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costRows.rows.map((row) => (
                      <tr key={row.component} className="border-b border-[#1E1E1E]">
                        <td className="py-2 text-[#E5E7EB]">{row.component}</td>
                        <td className="py-2 text-[#D1D5DB]">{row.status}</td>
                        <td className="py-2 text-[#D1D5DB] tabular-nums">{row.life}</td>
                        <td className="py-2 text-[#D1D5DB] tabular-nums">${row.replacementCost.toLocaleString()}</td>
                        <td className={`py-2 font-semibold ${row.urgency === "HIGH" ? "text-[#EF4444]" : row.urgency === "MED" ? "text-[#F97316]" : "text-[#22C55E]"}`}>{row.urgency}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="py-2 text-[#FACC15] font-semibold" colSpan={3}>
                        Predicted total maintenance cost next 90 days
                      </td>
                      <td className="py-2 text-[#FACC15] font-semibold tabular-nums">${costRows.total90Days.toLocaleString()}</td>
                      <td className="py-2 text-[#FACC15] font-semibold">Forecast</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <select
                  value={historyTruckFilter}
                  onChange={(event) => setHistoryTruckFilter(event.target.value)}
                  className="w-full rounded border border-[#363636] bg-[#0F0F0F] px-2 py-1.5 text-xs text-[#F5F5F5]"
                >
                  <option value="ALL">All trucks</option>
                  {TRUCKS.map((truck) => (
                    <option key={truck.id} value={truck.id}>
                      CAT {truck.id}
                    </option>
                  ))}
                </select>

                <select
                  value={historyTypeFilter}
                  onChange={(event) => setHistoryTypeFilter(event.target.value as "ALL" | HistoryTaskType)}
                  className="w-full rounded border border-[#363636] bg-[#0F0F0F] px-2 py-1.5 text-xs text-[#F5F5F5]"
                >
                  <option value="ALL">All task types</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Liner">Liner</option>
                  <option value="Actuator">Actuator</option>
                  <option value="Sensor">Sensor</option>
                  <option value="Hydraulics">Hydraulics</option>
                </select>

                <input
                  type="date"
                  value={historyFrom}
                  onChange={(event) => setHistoryFrom(event.target.value)}
                  className="w-full rounded border border-[#363636] bg-[#0F0F0F] px-2 py-1.5 text-xs text-[#F5F5F5]"
                />
                <input
                  type="date"
                  value={historyTo}
                  onChange={(event) => setHistoryTo(event.target.value)}
                  className="w-full rounded border border-[#363636] bg-[#0F0F0F] px-2 py-1.5 text-xs text-[#F5F5F5]"
                />

                <div className="relative">
                  <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-[#6B7280]" />
                  <input
                    value={historyQuery}
                    onChange={(event) => setHistoryQuery(event.target.value)}
                    placeholder="Search history"
                    className="w-full rounded border border-[#363636] bg-[#0F0F0F] pl-7 pr-2 py-1.5 text-xs text-[#F5F5F5]"
                  />
                </div>
              </div>

              <div className="max-h-[560px] overflow-auto rounded border border-[#262626]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-[#101010] border-b border-[#242424] text-[#9CA3AF]">
                    <tr>
                      <th className="py-2 text-left px-2">Date</th>
                      <th className="py-2 text-left px-2">Truck</th>
                      <th className="py-2 text-left px-2">Task Type</th>
                      <th className="py-2 text-left px-2">Description</th>
                      <th className="py-2 text-left px-2">Technician</th>
                      <th className="py-2 text-left px-2">Duration</th>
                      <th className="py-2 text-left px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyFiltered.map((row) => (
                      <tr key={row.id} className="border-b border-[#1E1E1E]">
                        <td className="py-2 px-2 text-[#D1D5DB]">{new Date(row.dateIso).toLocaleDateString("en-US")}</td>
                        <td className="py-2 px-2 font-mono text-[#FACC15]">CAT {row.truckId}</td>
                        <td className="py-2 px-2 text-[#D1D5DB]">{row.taskType}</td>
                        <td className="py-2 px-2 text-[#D1D5DB]">{row.description}</td>
                        <td className="py-2 px-2 text-[#D1D5DB]">{row.technician}</td>
                        <td className="py-2 px-2 text-[#D1D5DB]">{row.duration}</td>
                        <td className={`py-2 px-2 ${row.status === "Completed" ? "text-[#22C55E]" : "text-[#F97316]"}`}>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <aside className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3 space-y-4 sticky top-20">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15]">MAINTENANCE SCHEDULE</p>
            <button
              disabled={!canScheduleEdit}
              onClick={() => setAddTaskOpen(true)}
              className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] ${
                canScheduleEdit ? "border-[#A97B00] bg-[#2A1F08] text-[#FACC15]" : "border-[#3A3A3A] bg-[#151515] text-[#6B7280]"
              }`}
            >
              <CalendarPlus2 className="h-3.5 w-3.5" /> Add Task
            </button>
          </div>

          <div className="space-y-2 max-h-[330px] overflow-auto pr-1">
            {sortedTasks.map((task) => {
              const taskDate = new Date(task.dateIso);
              const isToday = isSameDay(taskDate, today);
              const isPast = taskDate.getTime() < new Date(today.toDateString()).getTime();

              return (
                <div key={task.id} className={`rounded-lg border p-2 ${task.completed ? "border-[#1F5B30] bg-[#0E1C12]" : "border-[#2E2E2E] bg-[#141414]"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className={`text-lg leading-none font-semibold ${isPast ? "text-[#6B7280]" : isToday ? "text-[#FACC15]" : "text-[#F5F5F5]"}`}>{formatDateLabel(task.dateIso)}</p>
                      <p className="mt-1 font-mono text-sm font-bold text-[#F5F5F5]">CAT {task.truckId}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTask(task.id)}
                      disabled={!canScheduleEdit}
                      className="h-4 w-4 accent-[#22C55E]"
                    />
                  </div>
                  <p className="mt-1 text-xs text-[#D1D5DB]">{task.description}</p>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-[#9CA3AF]">
                    <span>{task.duration}</span>
                    <button className="text-[#60A5FA] hover:text-[#93C5FD]">{task.partsLink}</button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-lg border border-[#2B2B2B] bg-[#101010] p-2">
            <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15] mb-2">PARTS INVENTORY STATUS</p>
            <table className="w-full text-[11px]">
              <thead className="text-[#9CA3AF] border-b border-[#242424]">
                <tr>
                  <th className="py-1 text-left">PART</th>
                  <th className="py-1 text-left">QTY</th>
                  <th className="py-1 text-left">MIN</th>
                  <th className="py-1 text-left">STATUS</th>
                  <th className="py-1 text-left">ORDER</th>
                </tr>
              </thead>
              <tbody>
                {partsRows.map((item) => (
                  <tr key={item.part} className="border-b border-[#1D1D1D]">
                    <td className="py-1 text-[#E5E7EB]">{item.part}</td>
                    <td className="py-1 text-[#D1D5DB] tabular-nums">{item.qtyInStock}</td>
                    <td className="py-1 text-[#D1D5DB] tabular-nums">{item.minStock}</td>
                    <td
                      className={`py-1 font-semibold ${
                        item.status === "ORDER NOW" ? "text-[#EF4444]" : item.status === "LOW" ? "text-[#FACC15]" : "text-[#22C55E]"
                      }`}
                    >
                      {item.status}
                    </td>
                    <td className="py-1">
                      {item.status === "OK" ? (
                        <span className="text-[#6B7280]">-</span>
                      ) : (
                        <button className="text-[#60A5FA] hover:text-[#93C5FD]">Order now</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="rounded-lg border border-[#2B2B2B] bg-[#101010] p-2"
            ref={(node) => {
              workloadMeasure.ref.current = node;
            }}
          >
            <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15] mb-2">TECHNICIAN WORKLOAD</p>
            <div className="flex items-center justify-center">
              <PieChart width={workloadMeasure.width} height={180}>
                <Pie
                  data={technicianBreakdown}
                  dataKey="tasks"
                  nameKey="name"
                  cx={Math.max(70, Math.floor(workloadMeasure.width / 2) - 12)}
                  cy={88}
                  innerRadius={36}
                  outerRadius={62}
                  paddingAngle={2}
                >
                  {technicianBreakdown.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0B0B0B", border: "1px solid #303030", borderRadius: 8 }}
                  formatter={(value: unknown) => {
                    const numeric = typeof value === "number" ? value : Number(value ?? 0);
                    return [`${numeric} tasks`, "Open"];
                  }}
                />
              </PieChart>
            </div>
            <div className="space-y-1 text-[11px]">
              {technicianBreakdown.map((tech) => (
                <div key={tech.name} className="flex items-center justify-between text-[#D1D5DB]">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full" style={{ background: tech.fill }} />
                    {tech.name}
                  </span>
                  <span className={tech.tasks >= 3 ? "text-[#F97316]" : "text-[#22C55E]"}>{tech.tasks >= 3 ? "Overloaded" : "Underutilized"}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <section className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3">
        <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15]">PREDICTIVE INSIGHTS PANEL</p>
        <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-2">
          {insights.map((insight) => (
            <div key={insight.id} className="rounded-lg border border-[#2D2D2D] bg-[#141414] p-3">
              <p className="text-xs text-[#E5E7EB] leading-relaxed">{insight.message}</p>
              <p className="mt-2 text-[11px] text-[#9CA3AF]">
                Confidence: <span className="text-[#22C55E] font-semibold">{insight.confidence}%</span>
              </p>
              <p className="mt-1 text-[11px] text-[#9CA3AF]">
                Affected trucks: <span className="text-[#D1D5DB]">{insight.affectedTrucks.join(", ")}</span>
              </p>
              <p className="mt-1 text-[11px] text-[#9CA3AF]">Recommended action: {insight.action}</p>
              <button
                onClick={() => setInsights((prev) => prev.filter((item) => item.id !== insight.id))}
                className="mt-2 rounded border border-[#3A3A3A] px-2 py-1 text-[11px] text-[#D1D5DB] hover:bg-[#1D1D1D]"
              >
                Dismiss
              </button>
            </div>
          ))}
          {insights.length === 0 ? (
            <div className="rounded-lg border border-[#2D2D2D] bg-[#141414] p-3 text-xs text-[#9CA3AF]">No active insights. Model confidence stream is stable.</div>
          ) : null}
        </div>
      </section>

      {addTaskOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setAddTaskOpen(false)}>
          <div className="w-full max-w-lg rounded-lg border border-[#333333] bg-[#111111] p-4" onClick={(event) => event.stopPropagation()}>
            <p className="text-sm font-semibold text-[#FACC15]">Add Maintenance Task</p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              <Field label="Truck">
                <select value={newTaskTruck} onChange={(event) => setNewTaskTruck(event.target.value)} className="input">
                  {TRUCKS.map((truck) => (
                    <option key={truck.id} value={truck.id}>
                      CAT {truck.id}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Date">
                <input type="date" value={newTaskDate} onChange={(event) => setNewTaskDate(event.target.value)} className="input" />
              </Field>
              <Field label="Task Type">
                <select value={newTaskType} onChange={(event) => setNewTaskType(event.target.value as HistoryTaskType)} className="input">
                  <option value="Inspection">Inspection</option>
                  <option value="Liner">Liner</option>
                  <option value="Actuator">Actuator</option>
                  <option value="Sensor">Sensor</option>
                  <option value="Hydraulics">Hydraulics</option>
                </select>
              </Field>
              <Field label="Technician">
                <input value={newTaskTechnician} onChange={(event) => setNewTaskTechnician(event.target.value)} className="input" />
              </Field>
              <Field label="Priority">
                <select value={newTaskPriority} onChange={(event) => setNewTaskPriority(event.target.value as SchedulePriority)} className="input">
                  <option value="HIGH">HIGH</option>
                  <option value="MED">MED</option>
                  <option value="LOW">LOW</option>
                </select>
              </Field>
              <Field label="Description">
                <textarea value={newTaskDescription} onChange={(event) => setNewTaskDescription(event.target.value)} className="input min-h-[82px]" />
              </Field>
            </div>

            <div className="mt-3 flex items-center justify-end gap-2">
              <button onClick={() => setAddTaskOpen(false)} className="rounded border border-[#383838] px-3 py-1.5 text-xs text-[#D1D5DB]">Cancel</button>
              <button onClick={submitNewTask} className="rounded border border-[#A97B00] bg-[#FACC15] px-3 py-1.5 text-xs font-semibold text-black inline-flex items-center gap-1">
                <Wrench className="h-3.5 w-3.5" /> Add Task
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid #363636;
          background: #0f0f0f;
          color: #f5f5f5;
          padding: 0.375rem 0.5rem;
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}

function LegendDot({ color, text }: { color: string; text: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {text}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-xs text-[#9CA3AF]">
      <span>{label}</span>
      {children}
    </label>
  );
}
