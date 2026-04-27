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

// Global site data with map coordinates for global dashboard
export type GlobalSiteData = SiteContext & {
  lat: number;
  lng: number;
  trucksCount: number;
  avgCarryBackPct: number;
  alertCount: number;
  alertSeverity: "OK" | "WARNING" | "CRITICAL";
  status: "OPERATIONAL" | "DEGRADED" | "OFFLINE";
};

export const GLOBAL_SITES: GlobalSiteData[] = [
  {
    id: "alpha",
    name: "Mine Site Alpha",
    location: "Eastern Operations",
    activeShift: 2,
    zoneName: "Pit A",
    lat: 40.7128,
    lng: -74.006,
    trucksCount: 3,
    avgCarryBackPct: 1.1,
    alertCount: 2,
    alertSeverity: "WARNING",
    status: "OPERATIONAL",
  },
  {
    id: "beta",
    name: "Mine Site Beta",
    location: "Northern Ridge",
    activeShift: 1,
    zoneName: "Pit C",
    lat: 41.8781,
    lng: -87.6298,
    trucksCount: 3,
    avgCarryBackPct: 0.5,
    alertCount: 0,
    alertSeverity: "OK",
    status: "OPERATIONAL",
  },
  {
    id: "gamma",
    name: "Mine Site Gamma",
    location: "West Basin",
    activeShift: 3,
    zoneName: "Pit D",
    lat: 34.0522,
    lng: -118.2437,
    trucksCount: 2,
    avgCarryBackPct: 0.7,
    alertCount: 1,
    alertSeverity: "WARNING",
    status: "OPERATIONAL",
  },
];

// Global user management data
export type GlobalUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  site: string;
  lastLogin: string;
  status: "ACTIVE" | "INACTIVE";
  lastPasswordChange: string;
};

export const GLOBAL_USERS: GlobalUser[] = [
  { id: "u1", name: "A. Morgan", email: "super.admin@smartbed.ai", role: "SUPER_ADMIN", site: "—", lastLogin: new Date(Date.now() - 0.5 * 60_000).toISOString(), status: "ACTIVE", lastPasswordChange: new Date(Date.now() - 90 * 24 * 60_000).toISOString() },
  { id: "u2", name: "R. Cooper", email: "site.manager@smartbed.ai", role: "SITE_MANAGER", site: "Alpha", lastLogin: new Date(Date.now() - 15 * 60_000).toISOString(), status: "ACTIVE", lastPasswordChange: new Date(Date.now() - 45 * 24 * 60_000).toISOString() },
  { id: "u3", name: "J. Ramesh", email: "fleet.operator@smartbed.ai", role: "FLEET_OPERATOR", site: "Alpha", lastLogin: new Date(Date.now() - 45 * 60_000).toISOString(), status: "ACTIVE", lastPasswordChange: new Date(Date.now() - 30 * 24 * 60_000).toISOString() },
  { id: "u4", name: "M. Singh", email: "truck.operator@smartbed.ai", role: "TRUCK_OPERATOR", site: "Alpha", lastLogin: new Date(Date.now() - 120 * 60_000).toISOString(), status: "ACTIVE", lastPasswordChange: new Date(Date.now() - 60 * 24 * 60_000).toISOString() },
  { id: "u5", name: "P. Sharma", email: "maintenance.tech@smartbed.ai", role: "MAINTENANCE_TECH", site: "Beta", lastLogin: new Date(Date.now() - 180 * 60_000).toISOString(), status: "ACTIVE", lastPasswordChange: new Date(Date.now() - 20 * 24 * 60_000).toISOString() },
  { id: "u6", name: "L. Nair", email: "analyst@smartbed.ai", role: "ANALYST", site: "Gamma", lastLogin: new Date(Date.now() - 240 * 60_000).toISOString(), status: "ACTIVE", lastPasswordChange: new Date(Date.now() - 75 * 24 * 60_000).toISOString() },
  { id: "u7", name: "V. Chen", email: "site.manager.beta@smartbed.ai", role: "SITE_MANAGER", site: "Beta", lastLogin: new Date(Date.now() - 30 * 60_000).toISOString(), status: "ACTIVE", lastPasswordChange: new Date(Date.now() - 40 * 24 * 60_000).toISOString() },
  { id: "u8", name: "K. Okonkwo", email: "site.manager.gamma@smartbed.ai", role: "SITE_MANAGER", site: "Gamma", lastLogin: new Date(Date.now() - 2 * 60_000).toISOString(), status: "ACTIVE", lastPasswordChange: new Date(Date.now() - 55 * 24 * 60_000).toISOString() },
];

// System health data
export type SystemHealthData = {
  totalJetsons: number;
  onlineJetsons: number;
  totalMcus: number;
  onlineMcus: number;
  avgInferenceTime: number;
  devicesNeedingUpdate: number;
  modelVersion: string;
};

export const SYSTEM_HEALTH: SystemHealthData = {
  totalJetsons: 8,
  onlineJetsons: 8,
  totalMcus: 16,
  onlineMcus: 15,
  avgInferenceTime: 187,
  devicesNeedingUpdate: 2,
  modelVersion: "2.4.1",
};

// Multi-site comparison data
export type SiteComparisonData = {
  siteId: string;
  siteName: string;
  fleetSize: number;
  avgCarryBackPct: number;
  payloadEfficiency: number;
  fuelSaved: number;
  alertCount: number;
  status: string;
};

export const SITE_COMPARISON: SiteComparisonData[] = [
  { siteId: "alpha", siteName: "Site Alpha", fleetSize: 3, avgCarryBackPct: 1.1, payloadEfficiency: 88.9, fuelSaved: 4200, alertCount: 2, status: "OPERATIONAL" },
  { siteId: "beta", siteName: "Site Beta", fleetSize: 3, avgCarryBackPct: 0.5, payloadEfficiency: 99.5, fuelSaved: 6800, alertCount: 0, status: "OPERATIONAL" },
  { siteId: "gamma", siteName: "Site Gamma", fleetSize: 2, avgCarryBackPct: 0.7, payloadEfficiency: 99.3, fuelSaved: 4100, alertCount: 1, status: "OPERATIONAL" },
];

// Global user audit log
export type AuditLogEntry = {
  id: string;
  timestamp: string;
  action: string;
  userId: string;
  userName: string;
  targetUser?: string;
  details: string;
};

export const AUDIT_LOG: AuditLogEntry[] = [
  { id: "log-1", timestamp: new Date(Date.now() - 10 * 60_000).toISOString(), action: "ROLE_CHANGE", userId: "u1", userName: "A. Morgan", targetUser: "u5", details: "Changed P. Sharma from ANALYST to MAINTENANCE_TECH at Beta site" },
  { id: "log-2", timestamp: new Date(Date.now() - 45 * 60_000).toISOString(), action: "USER_CREATED", userId: "u1", userName: "A. Morgan", targetUser: "u9", details: "Created new FLEET_OPERATOR user V. Desai at Alpha site" },
  { id: "log-3", timestamp: new Date(Date.now() - 120 * 60_000).toISOString(), action: "USER_DEACTIVATED", userId: "u1", userName: "A. Morgan", targetUser: "u3", details: "Deactivated J. Ramesh (FLEET_OPERATOR)" },
  { id: "log-4", timestamp: new Date(Date.now() - 240 * 60_000).toISOString(), action: "PASSWORD_RESET", userId: "u1", userName: "A. Morgan", targetUser: "u2", details: "Reset password for R. Cooper" },
  { id: "log-5", timestamp: new Date(Date.now() - 480 * 60_000).toISOString(), action: "ROLE_CHANGE", userId: "u1", userName: "A. Morgan", targetUser: "u6", details: "Changed L. Nair from MAINTENANCE_TECH to ANALYST at Gamma site" },
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
