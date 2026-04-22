import type { SiteContext, UserRole } from "@/types/auth";

export type ZoneData = {
  residueKg: number;
  confidence: number;
  status: "clear" | "warning" | "critical";
};

export type CycleData = {
  cycleId: string;
  timestamp: string;
  dumpDurationSec: number;
  carryBackKg: number;
  carryBackPct: number;
  decision: "RESIDUE" | "CLEAR";
};

export type TruckRecord = {
  id: string;
  model: "Caterpillar 793F" | "785D" | "797F";
  payloadClass: number;
  operator: string;
  status: "OPERATIONAL" | "CARRY_BACK_DETECTED" | "MAINTENANCE" | "IDLE";
  cyclesTotal: number;
  cyclesShift: number;
  carryBackPct: number;
  carryBackKg: number;
  lastDumpTime: string;
  bedZones: {
    FL: ZoneData;
    FC: ZoneData;
    FR: ZoneData;
    RL: ZoneData;
    RC: ZoneData;
    RR: ZoneData;
  };
  sensors: {
    loadCell: { value: number; unit: "t"; status: "OK" | "WARN" | "ERROR" };
    acoustic: { peakFreq: number; baseline: number; deviation: number; rms: number };
    camera: { zones: string[]; clarity: number; status: string };
    ultrasonic: { avgDepth: number; readings: number[] };
  };
  currentCycle: CycleData;
  lastTenCycles: CycleData[];
};

export type AlertRecord = {
  id: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  truckId: string;
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
};

export type AuthSeedUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  siteId: string;
  assignedTruckId?: string;
};

export const MINE_SITES: SiteContext[] = [
  { id: "alpha", name: "Mine Site Alpha", location: "Eastern Operations", activeShift: 2, zoneName: "Pit A" },
  { id: "beta", name: "Mine Site Beta", location: "Northern Ridge", activeShift: 1, zoneName: "Pit C" },
  { id: "gamma", name: "Mine Site Gamma", location: "West Basin", activeShift: 3, zoneName: "Pit D" },
];

export const AUTH_USERS: AuthSeedUser[] = [
  { id: "u1", name: "A. Morgan", email: "super.admin@smartbed.ai", password: "Password123!", role: "SUPER_ADMIN", siteId: "alpha" },
  { id: "u2", name: "R. Cooper", email: "site.manager@smartbed.ai", password: "Password123!", role: "SITE_MANAGER", siteId: "alpha" },
  { id: "u3", name: "J. Ramesh", email: "fleet.operator@smartbed.ai", password: "Password123!", role: "FLEET_OPERATOR", siteId: "alpha" },
  { id: "u4", name: "M. Singh", email: "truck.operator@smartbed.ai", password: "Password123!", role: "TRUCK_OPERATOR", siteId: "alpha", assignedTruckId: "793-11" },
  { id: "u5", name: "P. Sharma", email: "maintenance.tech@smartbed.ai", password: "Password123!", role: "MAINTENANCE_TECH", siteId: "beta" },
  { id: "u6", name: "L. Nair", email: "analyst@smartbed.ai", password: "Password123!", role: "ANALYST", siteId: "gamma" },
];

function zone(residueKg: number, confidence: number): ZoneData {
  return {
    residueKg,
    confidence,
    status: residueKg > 800 ? "critical" : residueKg > 150 ? "warning" : "clear",
  };
}

function cycle(cycleId: string, minuteOffset: number, carryBackKg: number): CycleData {
  const pct = +(carryBackKg / 240000 * 100).toFixed(2);
  const now = new Date(Date.now() - minuteOffset * 60_000).toISOString();
  return {
    cycleId,
    timestamp: now,
    dumpDurationSec: 38 + (minuteOffset % 14),
    carryBackKg,
    carryBackPct: pct,
    decision: carryBackKg > 350 ? "RESIDUE" : "CLEAR",
  };
}

const baseTrucks: Array<Pick<TruckRecord, "id" | "model" | "payloadClass" | "operator" | "status" | "cyclesTotal" | "cyclesShift" | "carryBackPct" | "carryBackKg">> = [
  { id: "793-11", model: "Caterpillar 793F", payloadClass: 240, operator: "R. Krishnamurthy", status: "CARRY_BACK_DETECTED", cyclesTotal: 12098, cyclesShift: 48, carryBackPct: 2.2, carryBackKg: 5300 },
  { id: "785-04", model: "785D", payloadClass: 150, operator: "J. Ramesh", status: "OPERATIONAL", cyclesTotal: 10644, cyclesShift: 52, carryBackPct: 0.4, carryBackKg: 610 },
  { id: "797-01", model: "797F", payloadClass: 360, operator: "M. Singh", status: "OPERATIONAL", cyclesTotal: 9840, cyclesShift: 41, carryBackPct: 0.7, carryBackKg: 1320 },
  { id: "793-02", model: "Caterpillar 793F", payloadClass: 240, operator: "A. Kumar", status: "OPERATIONAL", cyclesTotal: 11204, cyclesShift: 49, carryBackPct: 0.6, carryBackKg: 910 },
  { id: "785-12", model: "785D", payloadClass: 150, operator: "P. Sharma", status: "MAINTENANCE", cyclesTotal: 9280, cyclesShift: 44, carryBackPct: 0.3, carryBackKg: 420 },
  { id: "797-03", model: "797F", payloadClass: 360, operator: "S. Nair", status: "OPERATIONAL", cyclesTotal: 10092, cyclesShift: 38, carryBackPct: 0.9, carryBackKg: 1840 },
  { id: "793-08", model: "Caterpillar 793F", payloadClass: 240, operator: "V. Patel", status: "IDLE", cyclesTotal: 11092, cyclesShift: 51, carryBackPct: 0.5, carryBackKg: 780 },
  { id: "785-07", model: "785D", payloadClass: 150, operator: "D. Reddy", status: "OPERATIONAL", cyclesTotal: 9021, cyclesShift: 46, carryBackPct: 0.4, carryBackKg: 560 },
];

export const TRUCKS: TruckRecord[] = baseTrucks.map((truck, idx) => {
  const carry = truck.carryBackKg;
  const current = cycle(`${truck.id}-C${truck.cyclesShift}`, idx * 5, carry);
  const lastTenCycles = Array.from({ length: 10 }, (_, i) => cycle(`${truck.id}-C${truck.cyclesShift - i}`, i * 11 + idx, Math.max(40, Math.round(carry * (0.45 + Math.random() * 0.8)))));

  return {
    ...truck,
    lastDumpTime: current.timestamp,
    bedZones: {
      FL: zone(Math.round(carry * 0.46), 0.94),
      FC: zone(Math.round(carry * 0.07), 0.88),
      FR: zone(Math.round(carry * 0.05), 0.86),
      RL: zone(Math.round(carry * 0.29), 0.91),
      RC: zone(Math.round(carry * 0.08), 0.87),
      RR: zone(Math.round(carry * 0.05), 0.84),
    },
    sensors: {
      loadCell: { value: +(carry / 1000).toFixed(2), unit: "t", status: carry > 2000 ? "WARN" : "OK" },
      acoustic: {
        peakFreq: 790 + idx * 3,
        baseline: 847,
        deviation: -56 + idx * 5,
        rms: +(0.63 + Math.random() * 0.19).toFixed(2),
      },
      camera: {
        zones: carry > 1500 ? ["FL", "RL"] : carry > 500 ? ["FL"] : [],
        clarity: +(0.84 + Math.random() * 0.13).toFixed(2),
        status: carry > 1500 ? "Residue visible" : "Clear",
      },
      ultrasonic: {
        avgDepth: +(8 + Math.random() * 5).toFixed(2),
        readings: Array.from({ length: 6 }, () => +(7 + Math.random() * 7).toFixed(2)),
      },
    },
    currentCycle: current,
    lastTenCycles,
  };
});

export const CYCLES: CycleData[] = Array.from({ length: 500 }, (_, i) => {
  const truck = TRUCKS[i % TRUCKS.length];
  const carryBackKg = Math.max(30, Math.round((truck.carryBackKg * (0.2 + Math.random() * 1.4))));
  return cycle(`${truck.id}-H${500 - i}`, i * 8, carryBackKg);
});

const severities: AlertRecord["severity"][] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export const ALERTS: AlertRecord[] = Array.from({ length: 20 }, (_, i) => {
  const truck = TRUCKS[i % TRUCKS.length];
  const severity = severities[(i + 1) % 4];
  return {
    id: `ALRT-${String(i + 1).padStart(3, "0")}`,
    severity,
    truckId: truck.id,
    title: severity === "CRITICAL" ? "Carry-back confirmed" : "Sensor anomaly",
    message:
      severity === "CRITICAL"
        ? `${truck.id} exceeded carry-back threshold on FL/RL zones.`
        : `${truck.id} reported transient deviation requiring review.`,
    timestamp: new Date(Date.now() - i * 42 * 60_000).toISOString(),
    resolved: i % 3 !== 0,
  };
});

export async function getMineSites() {
  return MINE_SITES;
}
