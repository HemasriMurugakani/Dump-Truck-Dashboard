"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { TRUCKS, type TruckRecord } from "@/lib/mockData";
import {
  AlertTriangle,
  CheckCircle2,
  Save,
  Settings2,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

type AccessMode = "FULL" | "LIMITED";
type SaveScope = "truck" | "model" | "fleet";
type NightMode = "AUTO" | "ON" | "OFF";
type Sensitivity = "HIGH" | "MED" | "LOW";

type ConfigState = {
  loadCell: {
    thresholdKg: number;
    samplingHz: number;
    calibrationOffset: number;
    lastCalibrated: string;
    calibrated: boolean;
  };
  acoustic: {
    baselineIntervalHr: number;
    deviationThresholdHz: number;
    sensitivity: Sensitivity;
    noiseFilter: boolean;
  };
  camera: {
    resolution: "1080p" | "720p";
    confidenceThreshold: number;
    nightMode: NightMode;
  };
  vibrator: {
    minDurationSec: number;
    maxDurationSec: number;
    maxCyclesPerDump: number;
    frequencyHz: number;
    cooldownSec: number;
  };
  alertThresholds: {
    level1: number;
    level2: number;
    level3: number;
    escalationMinutes: number;
    escalateTo: string;
    recipients: string[];
  };
  notification: {
    email: boolean;
    sms: boolean;
    inApp: true;
    webhookUrl: string;
  };
};

type NodeStatus = "OK" | "WARN" | "ERROR";

type TopologyNode = {
  id: string;
  name: string;
  model: string;
  fw: string;
  lastPing: string;
  status: NodeStatus;
  x: number;
  y: number;
  w: number;
  h: number;
};

type TopologyLink = {
  id: string;
  from: string;
  to: string;
  protocol: string;
  rate: string;
};

const VERSION_HISTORY = [
  { version: "v2.3.0", mAP: 0.94 },
  { version: "v2.2.8", mAP: 0.932 },
  { version: "v2.2.6", mAP: 0.926 },
  { version: "v2.2.4", mAP: 0.919 },
  { version: "v2.2.2", mAP: 0.908 },
  { version: "v2.2.0", mAP: 0.901 },
  { version: "v2.1.8", mAP: 0.896 },
  { version: "v2.1.6", mAP: 0.889 },
  { version: "v2.1.4", mAP: 0.881 },
  { version: "v2.1.2", mAP: 0.874 },
];

const inputClass = "w-full rounded border border-[#363636] bg-[#0F0F0F] px-2 py-1.5 text-xs text-[#F5F5F5]";

const TOPOLOGY_NODES: TopologyNode[] = [
  { id: "camera", name: "IP67 Camera", model: "1080p", fw: "1.9.4", lastPing: "2s ago", status: "OK", x: 30, y: 30, w: 150, h: 46 },
  { id: "acoustic", name: "Acoustic x2", model: "Dual MEMS", fw: "2.2.1", lastPing: "1s ago", status: "WARN", x: 30, y: 100, w: 150, h: 46 },
  { id: "load", name: "Load Cell x2", model: "LC-650", fw: "3.1.0", lastPing: "3s ago", status: "OK", x: 30, y: 170, w: 150, h: 46 },
  { id: "ultra", name: "Ultrasonic x2", model: "US-12", fw: "1.7.3", lastPing: "2s ago", status: "OK", x: 30, y: 240, w: 150, h: 46 },
  { id: "mcu", name: "MCU STM32", model: "Sensor Hub", fw: "5.3.8", lastPing: "0.5s ago", status: "OK", x: 255, y: 135, w: 145, h: 56 },
  { id: "jetson", name: "Jetson Orin NX", model: "Edge AI Compute", fw: "JetPack 6", lastPing: "0.3s ago", status: "OK", x: 465, y: 130, w: 170, h: 64 },
  { id: "mine", name: "Mine Control", model: "4G/LTE", fw: "Cloud 4.8", lastPing: "2s ago", status: "OK", x: 700, y: 70, w: 145, h: 50 },
  { id: "ecu", name: "Truck ECU / VIMS", model: "CAN J1939", fw: "v11.2", lastPing: "6s ago", status: "ERROR", x: 700, y: 210, w: 145, h: 50 },
];

const TOPOLOGY_LINKS: TopologyLink[] = [
  { id: "l1", from: "camera", to: "mcu", protocol: "USB", rate: "28 MB/s" },
  { id: "l2", from: "acoustic", to: "mcu", protocol: "I2C", rate: "1.2 MB/s" },
  { id: "l3", from: "load", to: "mcu", protocol: "I2C", rate: "0.8 MB/s" },
  { id: "l4", from: "ultra", to: "mcu", protocol: "I2C", rate: "0.6 MB/s" },
  { id: "l5", from: "mcu", to: "jetson", protocol: "SPI", rate: "1.2 MB/s" },
  { id: "l6", from: "jetson", to: "mine", protocol: "4G", rate: "2.3 MB/s" },
  { id: "l7", from: "jetson", to: "ecu", protocol: "J1939", rate: "12 msg/s" },
];

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

function defaultConfig(truck: TruckRecord): ConfigState {
  const seed = hashNumber(truck.id + truck.operator);
  const deterministicBase = new Date("2026-04-24T00:00:00.000Z").getTime();
  const calDate = new Date(deterministicBase + ((seed % 17) + 4) * 3600_000).toISOString();

  return {
    loadCell: {
      thresholdKg: 500,
      samplingHz: 10,
      calibrationOffset: +((seed % 32) / 1000 + 0.018).toFixed(3),
      lastCalibrated: calDate,
      calibrated: truck.status !== "MAINTENANCE",
    },
    acoustic: {
      baselineIntervalHr: 24,
      deviationThresholdHz: 15,
      sensitivity: "HIGH",
      noiseFilter: true,
    },
    camera: {
      resolution: "1080p",
      confidenceThreshold: 0.85,
      nightMode: "AUTO",
    },
    vibrator: {
      minDurationSec: 2,
      maxDurationSec: 8,
      maxCyclesPerDump: 3,
      frequencyHz: 25,
      cooldownSec: 30,
    },
    alertThresholds: {
      level1: 0.8,
      level2: 1.6,
      level3: 2.6,
      escalationMinutes: 12,
      escalateTo: "site.manager@smartbed.ai",
      recipients: ["site.manager@smartbed.ai", "maintenance.tech@smartbed.ai"],
    },
    notification: {
      email: true,
      sms: false,
      inApp: true,
      webhookUrl: "https://scada.example.local/hooks/smartbed",
    },
  };
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("en-AU", {
    hour12: false,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SystemConfigPage() {
  const { user } = useAuth();

  const canFullEdit = user?.role === "SUPER_ADMIN" || user?.role === "MAINTENANCE_TECH";
  const canLimitedEdit = user?.role === "SITE_MANAGER";
  const canSave = canFullEdit || canLimitedEdit;

  const [selectedTruckId, setSelectedTruckId] = useState(TRUCKS[0]?.id ?? "793-11");
  const [configs, setConfigs] = useState<Record<string, ConfigState>>(() =>
    Object.fromEntries(TRUCKS.map((truck) => [truck.id, defaultConfig(truck)])),
  );
  const [savedConfigs, setSavedConfigs] = useState<Record<string, ConfigState>>(() =>
    Object.fromEntries(TRUCKS.map((truck) => [truck.id, defaultConfig(truck)])),
  );

  const [newRecipient, setNewRecipient] = useState("");
  const [nodeDetailId, setNodeDetailId] = useState<string | null>(null);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [calibrationOpen, setCalibrationOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const selectedTruck = useMemo(() => TRUCKS.find((truck) => truck.id === selectedTruckId) ?? TRUCKS[0], [selectedTruckId]);
  const config = configs[selectedTruck.id];
  const savedConfig = savedConfigs[selectedTruck.id];

  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(savedConfig), [config, savedConfig]);

  const criticalLocked = canLimitedEdit;

  const metricsRows = useMemo(() => {
    return [
      { component: "Jetson Orin NX", temp: 61, load: 43, status: "OK" as NodeStatus },
      { component: "MCU STM32", temp: 38, load: 12, status: "OK" as NodeStatus },
      { component: "IP67 Camera", temp: 44, load: 8, status: "OK" as NodeStatus },
      { component: "Acoustic Array", temp: 67, load: 24, status: "WARN" as NodeStatus },
      { component: "Load Cell Array", temp: 31, load: 6, status: "OK" as NodeStatus },
      { component: "CAN Bus", temp: 48, load: 18, status: "OK" as NodeStatus },
      { component: "4G Uplink", temp: 76, load: 84, status: "ERROR" as NodeStatus },
    ];
  }, []);

  const modelTrend = useMemo(
    () => VERSION_HISTORY.slice().reverse().map((version, idx) => ({ idx: idx + 1, mAP: version.mAP, version: version.version })),
    [],
  );
  const [selectedModelVersion, setSelectedModelVersion] = useState(VERSION_HISTORY[0].version);
  const modelChartRef = useState(() => ({ current: null as HTMLDivElement | null }))[0];
  const [modelChartWidth, setModelChartWidth] = useState(320);

  const [flowPhase, setFlowPhase] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFlowPhase((prev) => {
        const next = prev + 0.03;
        return next > 1 ? 0 : next;
      });
    }, 70);

    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!modelChartRef.current) {
      return;
    }

    const update = () => {
      if (!modelChartRef.current) {
        return;
      }
      setModelChartWidth(Math.max(260, Math.floor(modelChartRef.current.clientWidth)));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(modelChartRef.current);

    return () => observer.disconnect();
  }, [modelChartRef]);

  const nodeById = useMemo(() => Object.fromEntries(TOPOLOGY_NODES.map((node) => [node.id, node])), []);

  const selectedNode = nodeDetailId ? nodeById[nodeDetailId] : null;

  const updateConfig = <K extends keyof ConfigState>(key: K, value: ConfigState[K]) => {
    setConfigs((prev) => ({
      ...prev,
      [selectedTruck.id]: {
        ...prev[selectedTruck.id],
        [key]: value,
      },
    }));
  };

  const setCritical = (updater: (prev: ConfigState) => ConfigState) => {
    if (criticalLocked) {
      toast.warning("Site Manager can edit only non-critical settings.");
      return;
    }
    setConfigs((prev) => ({ ...prev, [selectedTruck.id]: updater(prev[selectedTruck.id]) }));
  };

  const addRecipient = () => {
    const email = newRecipient.trim().toLowerCase();
    if (!email.includes("@")) {
      toast.error("Enter a valid recipient email.");
      return;
    }
    if (config.alertThresholds.recipients.includes(email)) {
      setNewRecipient("");
      return;
    }

    updateConfig("alertThresholds", {
      ...config.alertThresholds,
      recipients: [...config.alertThresholds.recipients, email],
    });
    setNewRecipient("");
  };

  const validate = () => {
    if (config.vibrator.minDurationSec > config.vibrator.maxDurationSec) {
      toast.error("Vibrator min duration cannot exceed max duration.");
      return false;
    }

    if (!(config.alertThresholds.level1 < config.alertThresholds.level2 && config.alertThresholds.level2 < config.alertThresholds.level3)) {
      toast.error("Alert thresholds must be increasing: L1 < L2 < L3.");
      return false;
    }

    if (config.notification.webhookUrl && !/^https?:\/\//.test(config.notification.webhookUrl)) {
      toast.error("Webhook URL must start with http:// or https://");
      return false;
    }

    return true;
  };

  const applySave = (scope: SaveScope) => {
    if (!validate()) {
      return;
    }

    if (canLimitedEdit && scope === "fleet") {
      toast.error("SITE_MANAGER cannot apply non-critical settings fleet-wide.");
      return;
    }

    if (scope === "truck") {
      setSavedConfigs((prev) => ({ ...prev, [selectedTruck.id]: config }));
    }

    if (scope === "model") {
      const ids = TRUCKS.filter((truck) => truck.model === selectedTruck.model).map((truck) => truck.id);
      setSavedConfigs((prev) => {
        const next = { ...prev };
        ids.forEach((id) => {
          next[id] = config;
        });
        return next;
      });
    }

    if (scope === "fleet") {
      setSavedConfigs(Object.fromEntries(TRUCKS.map((truck) => [truck.id, config])));
    }

    setSaveDialogOpen(false);
    toast.success(`Configuration saved for ${scope === "truck" ? "selected truck" : scope === "model" ? "selected model" : "entire fleet"}.`);
  };

  const startSave = () => {
    if (!canSave) {
      toast.error("No permission to save configuration.");
      return;
    }
    if (!dirty) {
      toast.message("No pending changes.");
      return;
    }
    if (!validate()) {
      return;
    }
    setSaveDialogOpen(true);
  };

  const runCalibration = () => {
    if (criticalLocked) {
      toast.warning("Calibration requires MAINTENANCE_TECH or SUPER_ADMIN privileges.");
      return;
    }
    setCalibrationOpen(true);
  };

  const completeCalibration = () => {
    setConfigs((prev) => ({
      ...prev,
      [selectedTruck.id]: {
        ...prev[selectedTruck.id],
        loadCell: {
          ...prev[selectedTruck.id].loadCell,
          calibrationOffset: +(Math.random() * 0.008 + 0.014).toFixed(3),
          lastCalibrated: new Date().toISOString(),
          calibrated: true,
        },
      },
    }));
    setCalibrationOpen(false);
    toast.success("Load cell calibration completed.");
  };

  const getStatusColor = (status: NodeStatus) => {
    if (status === "OK") {
      return "text-[#22C55E]";
    }
    if (status === "WARN") {
      return "text-[#F97316]";
    }
    return "text-[#EF4444]";
  };

  const getNodeStroke = (status: NodeStatus, highlight = false) => {
    if (status === "ERROR") {
      return "#EF4444";
    }
    if (highlight) {
      return "#FACC15";
    }
    if (status === "WARN") {
      return "#F97316";
    }
    return "#2A2A2A";
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#2D2D2D] bg-gradient-to-b from-[#141414] to-[#0F0F0F] p-3 md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg border border-[#353535] bg-[#161616] flex items-center justify-center text-[#FACC15]">
              <Settings2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.08em]">SYSTEM CONFIGURATION</p>
              <p className="text-xs text-[#9CA3AF]">Truck-level controls, hardware topology, and model operations.</p>
            </div>
          </div>

          <div className="text-xs">
            <span className={`inline-flex items-center rounded-full border px-2 py-1 ${canFullEdit ? "border-[#1F5B30] bg-[#0F2316] text-[#22C55E]" : "border-[#5B4A1F] bg-[#241C0C] text-[#FACC15]"}`}>
              {canFullEdit ? "FULL ACCESS" : "LIMITED ACCESS (NON-CRITICAL)"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_minmax(0,1fr)] gap-4">
        <section className="space-y-3">
          <div className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3">
            <p className="text-[11px] text-[#9CA3AF] mb-1">TRUCK SELECTOR</p>
            <select
              value={selectedTruck.id}
              onChange={(event) => setSelectedTruckId(event.target.value)}
              className="w-full rounded border border-[#363636] bg-[#0F0F0F] px-2 py-1.5 text-sm text-[#F5F5F5]"
            >
              {TRUCKS.map((truck) => (
                <option key={truck.id} value={truck.id}>
                  CAT {truck.id} - {truck.model}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-[#9CA3AF]">
              Model: <span className="text-[#F5F5F5]">{selectedTruck.model}</span>
              <span className="mx-2 text-[#4B5563]">|</span>
              Status: <span className={selectedTruck.status === "CARRY_BACK_DETECTED" ? "text-[#EF4444]" : "text-[#22C55E]"}>{selectedTruck.status.replaceAll("_", " ")}</span>
            </p>
          </div>

          <div className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3 space-y-2">
            <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15]">LOAD CELL CONFIG</p>
            <Field label="Threshold (kg)">
              <input
                type="number"
                value={config.loadCell.thresholdKg}
                onChange={(event) => setCritical((prev) => ({ ...prev, loadCell: { ...prev.loadCell, thresholdKg: Number(event.target.value) } }))}
                disabled={criticalLocked}
                className={inputClass}
              />
            </Field>
            <Field label="Sampling rate (Hz)">
              <input
                type="number"
                value={config.loadCell.samplingHz}
                onChange={(event) => setCritical((prev) => ({ ...prev, loadCell: { ...prev.loadCell, samplingHz: Number(event.target.value) } }))}
                disabled={criticalLocked}
                className={inputClass}
              />
            </Field>
            <Field label="Calibration offset">
              <input readOnly value={config.loadCell.calibrationOffset} className={`${inputClass} opacity-60`} />
            </Field>
            <Field label="Last calibrated">
              <div className="text-xs text-[#D1D5DB]">{formatTime(config.loadCell.lastCalibrated)}</div>
            </Field>
            <div className="flex items-center justify-between text-xs">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${config.loadCell.calibrated ? "border-[#1F5B30] bg-[#0F2316] text-[#22C55E]" : "border-[#5B1F1F] bg-[#260F0F] text-[#EF4444]"}`}>
                {config.loadCell.calibrated ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {config.loadCell.calibrated ? "CALIBRATED" : "NEEDS CALIBRATION"}
              </span>
              <button onClick={runCalibration} className="rounded border border-[#7A4D12] bg-[#2B1A08] text-[#FB923C] px-2 py-1">Run Calibration</button>
            </div>
          </div>

          <div className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3 space-y-2">
            <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15]">ACOUSTIC CONFIG</p>
            <Field label="Baseline capture interval (hr)">
              <input
                type="number"
                value={config.acoustic.baselineIntervalHr}
                onChange={(event) => updateConfig("acoustic", { ...config.acoustic, baselineIntervalHr: Number(event.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Deviation threshold (Hz)">
              <input
                type="number"
                value={config.acoustic.deviationThresholdHz}
                onChange={(event) => updateConfig("acoustic", { ...config.acoustic, deviationThresholdHz: Number(event.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Frequency range">
              <p className="text-xs text-[#D1D5DB]">200-1200 Hz</p>
            </Field>
            <Field label="Sensitivity">
              <div className="flex gap-1">
                {(["HIGH", "MED", "LOW"] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => updateConfig("acoustic", { ...config.acoustic, sensitivity: value })}
                    className={`px-2 py-1 rounded border text-xs ${config.acoustic.sensitivity === value ? "border-[#FACC15] bg-[#2A220A] text-[#FACC15]" : "border-[#313131] text-[#9CA3AF]"}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Noise filter">
              <button
                onClick={() => updateConfig("acoustic", { ...config.acoustic, noiseFilter: !config.acoustic.noiseFilter })}
                className={`h-6 w-12 rounded-full border ${config.acoustic.noiseFilter ? "border-[#22C55E] bg-[#16371F]" : "border-[#4B5563] bg-[#1A1A1A]"}`}
              >
                <span className={`block h-4 w-4 rounded-full bg-white transition-all ${config.acoustic.noiseFilter ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </Field>
          </div>

          <div className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3 space-y-2">
            <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15]">CAMERA CONFIG</p>
            <Field label="Resolution">
              <div className="flex gap-1">
                {(["1080p", "720p"] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => updateConfig("camera", { ...config.camera, resolution: value })}
                    className={`px-2 py-1 rounded border text-xs ${config.camera.resolution === value ? "border-[#FACC15] bg-[#2A220A] text-[#FACC15]" : "border-[#313131] text-[#9CA3AF]"}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Detection model">
              <p className="text-xs text-[#D1D5DB]">YOLOv8-mining v2.3</p>
            </Field>
            <Field label="Confidence threshold">
              <input
                type="number"
                step="0.01"
                value={config.camera.confidenceThreshold}
                onChange={(event) => updateConfig("camera", { ...config.camera, confidenceThreshold: Number(event.target.value) })}
                className={inputClass}
              />
            </Field>
            <Field label="Night mode">
              <div className="flex gap-1">
                {(["AUTO", "ON", "OFF"] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => updateConfig("camera", { ...config.camera, nightMode: value })}
                    className={`px-2 py-1 rounded border text-xs ${config.camera.nightMode === value ? "border-[#FACC15] bg-[#2A220A] text-[#FACC15]" : "border-[#313131] text-[#9CA3AF]"}`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <div className={`rounded-lg border border-[#2B2B2B] bg-[#111111] p-3 space-y-2 ${criticalLocked ? "opacity-70" : ""}`}>
            <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15]">VIBRATOR CONFIG</p>
            <GridField label="Min duration (s)">
              <input type="number" value={config.vibrator.minDurationSec} onChange={(event) => setCritical((prev) => ({ ...prev, vibrator: { ...prev.vibrator, minDurationSec: Number(event.target.value) } }))} disabled={criticalLocked} className={inputClass} />
            </GridField>
            <GridField label="Max duration (s)">
              <input type="number" value={config.vibrator.maxDurationSec} onChange={(event) => setCritical((prev) => ({ ...prev, vibrator: { ...prev.vibrator, maxDurationSec: Number(event.target.value) } }))} disabled={criticalLocked} className={inputClass} />
            </GridField>
            <GridField label="Max cycles per dump">
              <input type="number" value={config.vibrator.maxCyclesPerDump} onChange={(event) => setCritical((prev) => ({ ...prev, vibrator: { ...prev.vibrator, maxCyclesPerDump: Number(event.target.value) } }))} disabled={criticalLocked} className={inputClass} />
            </GridField>
            <GridField label="Frequency (Hz)">
              <input type="number" value={config.vibrator.frequencyHz} onChange={(event) => setCritical((prev) => ({ ...prev, vibrator: { ...prev.vibrator, frequencyHz: Number(event.target.value) } }))} disabled={criticalLocked} className={inputClass} />
            </GridField>
            <GridField label="Cool-down period (s)">
              <input type="number" value={config.vibrator.cooldownSec} onChange={(event) => setCritical((prev) => ({ ...prev, vibrator: { ...prev.vibrator, cooldownSec: Number(event.target.value) } }))} disabled={criticalLocked} className={inputClass} />
            </GridField>
          </div>

          <div className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3 space-y-2">
            <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15]">ALERT THRESHOLDS</p>
            <GridField label="Level 1 (%)">
              <input type="number" step="0.1" value={config.alertThresholds.level1} onChange={(event) => updateConfig("alertThresholds", { ...config.alertThresholds, level1: Number(event.target.value) })} className={inputClass} />
            </GridField>
            <GridField label="Level 2 (%)">
              <input type="number" step="0.1" value={config.alertThresholds.level2} onChange={(event) => updateConfig("alertThresholds", { ...config.alertThresholds, level2: Number(event.target.value) })} className={inputClass} />
            </GridField>
            <GridField label="Level 3 (%)">
              <input type="number" step="0.1" value={config.alertThresholds.level3} onChange={(event) => updateConfig("alertThresholds", { ...config.alertThresholds, level3: Number(event.target.value) })} className={inputClass} />
            </GridField>
            <Field label="Notification recipients">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {config.alertThresholds.recipients.map((recipient) => (
                    <button
                      key={recipient}
                      onClick={() => updateConfig("alertThresholds", { ...config.alertThresholds, recipients: config.alertThresholds.recipients.filter((value) => value !== recipient) })}
                      className="text-[11px] px-2 py-1 rounded-full border border-[#3B3B3B] bg-[#1A1A1A] text-[#D1D5DB]"
                    >
                      {recipient} ×
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input value={newRecipient} onChange={(event) => setNewRecipient(event.target.value)} placeholder="add email" className={inputClass} />
                  <button onClick={addRecipient} className="px-2 py-1 rounded border border-[#444] text-xs">Add</button>
                </div>
              </div>
            </Field>
            <GridField label="Escalate after (min)">
              <input type="number" value={config.alertThresholds.escalationMinutes} onChange={(event) => updateConfig("alertThresholds", { ...config.alertThresholds, escalationMinutes: Number(event.target.value) })} className={inputClass} />
            </GridField>
            <GridField label="Escalate to">
              <input value={config.alertThresholds.escalateTo} onChange={(event) => updateConfig("alertThresholds", { ...config.alertThresholds, escalateTo: event.target.value })} className={inputClass} />
            </GridField>
          </div>

          <div className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3 space-y-2">
            <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15]">NOTIFICATION CONFIG</p>
            <SwitchRow label="Email alerts" value={config.notification.email} onChange={(value) => updateConfig("notification", { ...config.notification, email: value })} />
            <SwitchRow label="SMS alerts" value={config.notification.sms} onChange={(value) => updateConfig("notification", { ...config.notification, sms: value })} />
            <SwitchRow label="In-app alerts" value={config.notification.inApp} disabled onChange={() => undefined} />
            <GridField label="Webhook URL">
              <input value={config.notification.webhookUrl} onChange={(event) => updateConfig("notification", { ...config.notification, webhookUrl: event.target.value })} className={inputClass} />
            </GridField>
          </div>

          <div className="space-y-2">
            {dirty ? (
              <div className="inline-flex items-center gap-1 rounded-full border border-[#7C4A15] bg-[#2D1D09] px-2 py-1 text-[11px] text-[#FACC15]">
                <AlertTriangle className="h-3.5 w-3.5" /> Unsaved changes
              </div>
            ) : null}
            <button
              onClick={startSave}
              className="w-full rounded-md border border-[#A97B00] bg-[#FACC15] text-black py-2 text-sm font-semibold inline-flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" /> SAVE CONFIG
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3">
            <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15] mb-2">HARDWARE TOPOLOGY</p>
            <div className="relative overflow-auto">
              <svg viewBox="0 0 900 340" className="w-full min-w-[860px] rounded border border-[#1E1E1E] bg-[#0E0E0E]">
                {TOPOLOGY_LINKS.map((link) => {
                  const from = nodeById[link.from];
                  const to = nodeById[link.to];
                  const x1 = from.x + from.w;
                  const y1 = from.y + from.h / 2;
                  const x2 = to.x;
                  const y2 = to.y + to.h / 2;
                  const isError = from.status === "ERROR" || to.status === "ERROR";

                  const dotX = x1 + (x2 - x1) * flowPhase;
                  const dotY = y1 + (y2 - y1) * flowPhase;

                  return (
                    <g key={link.id} onMouseEnter={() => setHoveredLink(link.id)} onMouseLeave={() => setHoveredLink(null)}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={isError ? "#EF4444" : "#3B3B3B"} strokeWidth={2} />
                      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} fill={isError ? "#EF4444" : "#9CA3AF"} fontSize="10" textAnchor="middle">{link.protocol}</text>
                      <circle cx={dotX} cy={dotY} r={3.5} fill={isError ? "#EF4444" : "#FACC15"} opacity="0.85" />
                    </g>
                  );
                })}

                {TOPOLOGY_NODES.map((node) => {
                  const highlight = node.id === "jetson";
                  return (
                    <g key={node.id} onClick={() => setNodeDetailId(node.id)} style={{ cursor: "pointer" }}>
                      <rect
                        x={node.x}
                        y={node.y}
                        width={node.w}
                        height={node.h}
                        rx={8}
                        fill="#141414"
                        stroke={getNodeStroke(node.status, highlight)}
                        strokeWidth={highlight ? 2.5 : 1.8}
                      />
                      <text x={node.x + 10} y={node.y + 20} fill="#F5F5F5" fontSize="12">{node.name}</text>
                      <text x={node.x + 10} y={node.y + 35} fill="#9CA3AF" fontSize="10">{node.model}</text>
                      {node.status === "ERROR" ? <text x={node.x + node.w - 14} y={node.y + 16} fill="#EF4444" fontSize="14">✗</text> : null}
                    </g>
                  );
                })}
              </svg>

              {hoveredLink ? (
                <div className="absolute top-2 right-2 rounded border border-[#343434] bg-[#0C0C0C] px-2 py-1 text-[11px] text-[#D1D5DB]">
                  {(() => {
                    const link = TOPOLOGY_LINKS.find((value) => value.id === hoveredLink)!;
                    return `${link.protocol} — ${link.rate}`;
                  })()}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3">
            <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15] mb-2">SYSTEM METRICS</p>
            <table className="w-full text-xs">
              <thead className="text-[#9CA3AF] border-b border-[#1F1F1F]">
                <tr>
                  <th className="py-2 text-left">COMPONENT</th>
                  <th className="py-2 text-left">TEMP</th>
                  <th className="py-2 text-left">CPU/LOAD</th>
                  <th className="py-2 text-left">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {metricsRows.map((row) => {
                  const tempClass = row.temp > 75 ? "text-[#EF4444]" : row.temp >= 60 ? "text-[#F97316]" : "text-[#22C55E]";
                  const statusClass = row.status === "ERROR" ? "text-[#EF4444]" : row.status === "WARN" ? "text-[#F97316]" : "text-[#22C55E]";
                  return (
                    <tr key={row.component} className="border-b border-[#1A1A1A]">
                      <td className="py-2 text-[#D1D5DB]">{row.component}</td>
                      <td className={`py-2 tabular-nums ${tempClass}`}>{row.temp}°C</td>
                      <td className="py-2">
                        <div className="h-2 rounded bg-[#1A1A1A] overflow-hidden w-[120px]">
                          <div className="h-full bg-[#60A5FA]" style={{ width: `${clamp(row.load, 0, 100)}%` }} />
                        </div>
                      </td>
                      <td className={`py-2 ${statusClass}`}>{row.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-[#2B2B2B] bg-[#111111] p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold tracking-[0.08em] text-[#FACC15]">EDGE AI MODEL PERFORMANCE</p>
              {user?.role === "SUPER_ADMIN" ? (
                <button
                  onClick={() => toast.success("Model retraining job queued.")}
                  className="rounded border border-[#7A4D12] bg-[#2A1B08] text-[#FACC15] px-2 py-1 text-xs"
                >
                  Retrain Model
                </button>
              ) : null}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
              <Metric label="Model" value={selectedModelVersion} />
              <Metric label="mAP" value="0.94" tone="good" />
              <Metric label="Inference" value="23ms" tone="warn" />
              <Metric label="Last retrained" value="2026-03-28" />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#9CA3AF]">Version history</span>
              <select value={selectedModelVersion} onChange={(event) => setSelectedModelVersion(event.target.value)} className={`${inputClass} max-w-[200px]`}>
                {VERSION_HISTORY.map((version) => (
                  <option key={version.version} value={version.version}>{version.version}</option>
                ))}
              </select>
            </div>

            <div
              className="h-[140px]"
              ref={(node) => {
                modelChartRef.current = node;
              }}
            >
              <LineChart width={modelChartWidth} height={140} data={modelTrend} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="idx" tick={{ fill: "#6B7280", fontSize: 10 }} />
                <YAxis domain={[0.86, 0.95]} tick={{ fill: "#6B7280", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ background: "#0A0A0A", border: "1px solid #303030", borderRadius: 8 }}
                  formatter={((value: unknown) => [Number(value ?? 0).toFixed(3), "mAP"]) as any}
                  labelFormatter={(idx) => modelTrend[Number(idx) - 1]?.version ?? ""}
                />
                <Line type="monotone" dataKey="mAP" stroke="#FACC15" strokeWidth={2} dot={{ r: 2 }} />
              </LineChart>
            </div>
          </div>
        </section>
      </div>

      {calibrationOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setCalibrationOpen(false)}>
          <div className="w-full max-w-md rounded-lg border border-[#333333] bg-[#111111] p-4" onClick={(event) => event.stopPropagation()}>
            <p className="text-sm font-semibold text-[#FACC15]">Calibration Wizard</p>
            <ol className="mt-3 space-y-2 text-xs text-[#D1D5DB] list-decimal list-inside">
              <li>Stabilize truck bed and isolate sensor input.</li>
              <li>Capture zero-load baseline for 10 seconds.</li>
              <li>Apply reference mass and compute offset.</li>
              <li>Validate against 3 dump cycles.</li>
            </ol>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setCalibrationOpen(false)} className="rounded border border-[#3A3A3A] px-3 py-1.5 text-xs">Cancel</button>
              <button onClick={completeCalibration} className="rounded border border-[#A97B00] bg-[#FACC15] text-black px-3 py-1.5 text-xs font-semibold">Complete</button>
            </div>
          </div>
        </div>
      ) : null}

      {saveDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSaveDialogOpen(false)}>
          <div className="w-full max-w-lg rounded-lg border border-[#333333] bg-[#111111] p-4" onClick={(event) => event.stopPropagation()}>
            <p className="text-sm font-semibold text-[#FACC15]">Apply configuration scope</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">Select how broadly this configuration should be applied.</p>

            <div className="mt-4 grid gap-2">
              <button onClick={() => applySave("truck")} className="rounded border border-[#3A3A3A] bg-[#141414] px-3 py-2 text-left text-sm hover:border-[#FACC15]">Apply to this truck only</button>
              <button onClick={() => applySave("model")} className="rounded border border-[#3A3A3A] bg-[#141414] px-3 py-2 text-left text-sm hover:border-[#FACC15]">Apply to all {selectedTruck.model} trucks</button>
              <button
                onClick={() => applySave("fleet")}
                disabled={canLimitedEdit}
                className={`rounded border px-3 py-2 text-left text-sm ${canLimitedEdit ? "border-[#2A2A2A] bg-[#111111] text-[#6B7280]" : "border-[#3A3A3A] bg-[#141414] hover:border-[#FACC15]"}`}
              >
                Apply to entire fleet
              </button>
            </div>

            {canLimitedEdit ? (
              <p className="mt-2 text-[11px] text-[#F97316]">SITE_MANAGER can save non-critical settings to truck/model scope only.</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {selectedNode ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4" onClick={() => setNodeDetailId(null)}>
          <div className="w-full max-w-sm rounded-lg border border-[#383838] bg-[#111111] p-4" onClick={(event) => event.stopPropagation()}>
            <p className="text-sm font-semibold text-[#FACC15]">{selectedNode.name}</p>
            <div className="mt-2 space-y-1 text-xs text-[#D1D5DB]">
              <p>Model: {selectedNode.model}</p>
              <p>Firmware: {selectedNode.fw}</p>
              <p>Last ping: {selectedNode.lastPing}</p>
              <p className={getStatusColor(selectedNode.status)}>Status: {selectedNode.status}</p>
            </div>
            <div className="mt-3 text-right">
              <button onClick={() => setNodeDetailId(null)} className="rounded border border-[#3A3A3A] px-3 py-1.5 text-xs">Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
      <label className="text-[11px] text-[#9CA3AF]">{label}</label>
      {children}
    </div>
  );
}

function GridField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_1fr] gap-2 items-center">
      <label className="text-[11px] text-[#9CA3AF]">{label}</label>
      {children}
    </div>
  );
}

function SwitchRow({ label, value, onChange, disabled }: { label: string; value: boolean; onChange: (next: boolean) => void; disabled?: boolean }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
      <span className="text-[11px] text-[#9CA3AF]">{label}</span>
      <button disabled={disabled} onClick={() => onChange(!value)} className={`h-6 w-12 rounded-full border ${value ? "border-[#22C55E] bg-[#16371F]" : "border-[#4B5563] bg-[#1A1A1A]"} ${disabled ? "opacity-50" : ""}`}>
        <span className={`block h-4 w-4 rounded-full bg-white transition-all ${value ? "translate-x-6" : "translate-x-1"}`} />
      </button>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  const toneClass = tone === "good" ? "text-[#22C55E]" : tone === "warn" ? "text-[#F97316]" : "text-[#F5F5F5]";
  return (
    <div className="rounded border border-[#2A2A2A] bg-[#0E0E0E] px-2 py-1.5">
      <p className="text-[10px] text-[#6B7280]">{label}</p>
      <p className={`text-sm font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
