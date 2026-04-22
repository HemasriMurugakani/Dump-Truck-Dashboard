"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { TruckCard } from "@/components/fleet/TruckCard";
import { ALERTS, TRUCKS, type TruckRecord } from "@/lib/mockData";
import { useUiStore } from "@/store/ui-store";
import { Search, SlidersHorizontal, Truck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type FleetFilter = "ALL" | "CARRY_BACK_DETECTED" | "OPERATIONAL" | "MAINTENANCE" | "IDLE";
type SortBy = "TRUCK_ID" | "CARRY_BACK_DESC" | "CYCLES" | "LAST_ALERT";

function latestAlertSeed() {
  const map: Record<string, string> = {};
  for (const alert of ALERTS) {
    const existing = map[alert.truckId];
    if (!existing || new Date(alert.timestamp).getTime() > new Date(existing).getTime()) {
      map[alert.truckId] = alert.timestamp;
    }
  }
  return map;
}

function pickRandomStatus(current: TruckRecord["status"]) {
  const bag: TruckRecord["status"][] = ["OPERATIONAL", "MAINTENANCE", "IDLE", "CARRY_BACK_DETECTED", "OPERATIONAL"];
  const next = bag[Math.floor(Math.random() * bag.length)];
  if (current === "CARRY_BACK_DETECTED" && Math.random() < 0.55) {
    return "OPERATIONAL";
  }
  return next;
}

export function FleetOverview() {
  const { user } = useAuth();
  const router = useRouter();
  const setAlertsCount = useUiStore((state) => state.setAlertsCount);

  const [trucks, setTrucks] = useState<TruckRecord[]>(TRUCKS);
  const [lastAlertByTruck, setLastAlertByTruck] = useState<Record<string, string>>(latestAlertSeed);
  const [filter, setFilter] = useState<FleetFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortBy>("TRUCK_ID");
  const [search, setSearch] = useState("");
  const [compactView, setCompactView] = useState(false);
  const [summaryTick, setSummaryTick] = useState(0);
  const [flashTruckId, setFlashTruckId] = useState<string | null>(null);

  const roleVisibleTrucks = useMemo(() => {
    if (!user) {
      return [];
    }
    if (user.role === "TRUCK_OPERATOR") {
      const id = user.assignedTruckId ?? "793-11";
      return trucks.filter((truck) => truck.id === id);
    }
    return trucks;
  }, [trucks, user]);

  const filteredTrucks = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    let rows = roleVisibleTrucks.filter((truck) => {
      const matchesFilter = filter === "ALL" ? true : truck.status === filter;
      const matchesSearch =
        searchText.length === 0 ||
        truck.id.toLowerCase().includes(searchText) ||
        truck.operator.toLowerCase().includes(searchText);
      return matchesFilter && matchesSearch;
    });

    rows = [...rows].sort((a, b) => {
      if (sortBy === "TRUCK_ID") {
        return a.id.localeCompare(b.id, undefined, { numeric: true });
      }
      if (sortBy === "CARRY_BACK_DESC") {
        return b.carryBackPct - a.carryBackPct;
      }
      if (sortBy === "CYCLES") {
        return b.cyclesShift - a.cyclesShift;
      }
      const alertA = new Date(lastAlertByTruck[a.id] ?? 0).getTime();
      const alertB = new Date(lastAlertByTruck[b.id] ?? 0).getTime();
      return alertB - alertA;
    });

    return rows;
  }, [filter, lastAlertByTruck, roleVisibleTrucks, search, sortBy]);

  const summary = useMemo(() => {
    void summaryTick;
    if (roleVisibleTrucks.length === 0) {
      return null;
    }
    const active = roleVisibleTrucks.filter((truck) => truck.status !== "IDLE").length;
    const carryBack = roleVisibleTrucks.filter((truck) => truck.status === "CARRY_BACK_DETECTED").length;
    const avgCb =
      roleVisibleTrucks.reduce((acc, truck) => acc + truck.carryBackPct, 0) /
      Math.max(1, roleVisibleTrucks.length);
    const byCb = [...roleVisibleTrucks].sort((a, b) => a.carryBackPct - b.carryBackPct);
    const best = byCb[0];
    const worst = byCb[byCb.length - 1];

    return {
      active,
      carryBack,
      avgCb,
      best,
      worst,
    };
  }, [roleVisibleTrucks, summaryTick]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setSummaryTick((prev) => prev + 1);
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const alerts = trucks.filter((truck) => truck.status === "CARRY_BACK_DETECTED").length;
    setAlertsCount(alerts);
  }, [setAlertsCount, trucks]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTrucks((prev) => {
        if (prev.length === 0) {
          return prev;
        }
        const idx = Math.floor(Math.random() * prev.length);
        const target = prev[idx];
        const nextStatus = pickRandomStatus(target.status);
        const next = [...prev];

        const carryBackPct =
          nextStatus === "CARRY_BACK_DETECTED"
            ? +(1.5 + Math.random() * 3.8).toFixed(1)
            : nextStatus === "OPERATIONAL"
              ? +(0.2 + Math.random() * 0.8).toFixed(1)
              : +(0.1 + Math.random() * 0.5).toFixed(1);

        const updated: TruckRecord = {
          ...target,
          status: nextStatus,
          carryBackPct,
          carryBackKg: Math.round((carryBackPct / 100) * target.payloadClass * 1000),
          bedZones:
            nextStatus === "CARRY_BACK_DETECTED"
              ? {
                  ...target.bedZones,
                  FL: { ...target.bedZones.FL, status: "critical" },
                  RL: { ...target.bedZones.RL, status: "critical" },
                  FC: { ...target.bedZones.FC, status: "warning" },
                }
              : {
                  ...target.bedZones,
                  FL: { ...target.bedZones.FL, status: "clear" },
                  RL: { ...target.bedZones.RL, status: "clear" },
                  FC: { ...target.bedZones.FC, status: "clear" },
                  FR: { ...target.bedZones.FR, status: "clear" },
                  RC: { ...target.bedZones.RC, status: "clear" },
                  RR: { ...target.bedZones.RR, status: "clear" },
                },
          sensors: {
            ...target.sensors,
            camera: {
              ...target.sensors.camera,
              zones: nextStatus === "CARRY_BACK_DETECTED" ? ["FL", "RL"] : [],
            },
          },
        };

        next[idx] = updated;

        if (target.status !== "CARRY_BACK_DETECTED" && updated.status === "CARRY_BACK_DETECTED") {
          setFlashTruckId(updated.id);
          window.setTimeout(() => setFlashTruckId((curr) => (curr === updated.id ? null : curr)), 1000);
          setLastAlertByTruck((map) => ({ ...map, [updated.id]: new Date().toISOString() }));
          toast.warning(`⚠ Carry-back detected on CAT ${updated.id} — ${updated.carryBackPct.toFixed(1)}%`, {
            action: {
              label: "View",
              onClick: () => router.push(`/dashboard/truck/${updated.id}`),
            },
          });
        }

        if (target.status === "CARRY_BACK_DETECTED" && updated.status === "OPERATIONAL") {
          toast.success(`✓ CAT ${updated.id} cleared`);
        }

        return next;
      });
    }, 45_000);

    return () => window.clearInterval(id);
  }, [router]);

  if (!user) {
    return null;
  }

  const analystReadOnly = user.role === "ANALYST";
  const singleTruckMode = user.role === "TRUCK_OPERATOR";

  return (
    <section className="space-y-4">
      {analystReadOnly && (
        <div className="rounded-lg border border-[#1F2937] bg-[#0F172A] px-4 py-3 text-sm text-[#93C5FD]">
          Read-only mode: controls are disabled for analyst role.
        </div>
      )}

      {summary && (
        <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] px-4 py-3 text-xs md:text-sm flex flex-wrap gap-x-4 gap-y-2">
          <span>Total Active: <b className="tabular-nums">{summary.active}</b></span>
          <span>Carry-Back Alerts: <b className="text-[#EF4444] tabular-nums">{summary.carryBack}</b></span>
          <span>Avg CB Rate: <b className="tabular-nums">{summary.avgCb.toFixed(1)}%</b></span>
          <span>Best Truck: <b>{summary.best.id}</b> <b className="text-[#22C55E] tabular-nums">{summary.best.carryBackPct.toFixed(1)}%</b></span>
          <span>Worst: <b>{summary.worst.id}</b> <b className="text-[#EF4444] tabular-nums">{summary.worst.carryBackPct.toFixed(1)}%</b></span>
        </div>
      )}

      <div className="rounded-lg border border-[#1F1F1F] bg-[#111111] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-[#9CA3AF] text-sm">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Fleet Controls</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 w-full lg:w-auto">
            <select
              className="h-9 rounded-md border border-[#2A2A2A] bg-[#0F0F0F] px-3 text-sm disabled:opacity-50"
              value={filter}
              onChange={(e) => setFilter(e.target.value as FleetFilter)}
              disabled={analystReadOnly}
            >
              <option value="ALL">All Status</option>
              <option value="CARRY_BACK_DETECTED">Carry-Back Detected</option>
              <option value="OPERATIONAL">Operational</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="IDLE">Idle</option>
            </select>

            <select
              className="h-9 rounded-md border border-[#2A2A2A] bg-[#0F0F0F] px-3 text-sm disabled:opacity-50"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              disabled={analystReadOnly}
            >
              <option value="TRUCK_ID">By Truck ID</option>
              <option value="CARRY_BACK_DESC">By Carry-Back % (desc)</option>
              <option value="CYCLES">By Cycles</option>
              <option value="LAST_ALERT">By Last Alert</option>
            </select>

            <label className="h-9 rounded-md border border-[#2A2A2A] bg-[#0F0F0F] px-3 flex items-center gap-2">
              <Search className="h-4 w-4 text-[#6B7280]" />
              <input
                className="w-full bg-transparent text-sm outline-none"
                placeholder="Search truck or operator"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>

            <label className="h-9 rounded-md border border-[#2A2A2A] bg-[#0F0F0F] px-3 text-sm flex items-center justify-between disabled:opacity-50">
              <span>Compact View</span>
              <input
                type="checkbox"
                checked={compactView}
                onChange={(e) => setCompactView(e.target.checked)}
                disabled={analystReadOnly}
              />
            </label>
          </div>
        </div>
      </div>

      {filteredTrucks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#2A2A2A] bg-[#0F0F0F] min-h-[300px] flex flex-col items-center justify-center text-center">
          <Truck className="h-10 w-10 text-[#4B5563]" />
          <p className="mt-4 text-base text-[#E5E7EB]">No trucks match your filter</p>
          <p className="text-sm text-[#6B7280]">Try changing status filter, sorting, or search keywords.</p>
        </div>
      ) : (
        <div className={`${singleTruckMode ? "max-w-3xl mx-auto" : ""}`}>
          <div className={`grid gap-4 ${compactView ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
            {filteredTrucks.map((truck) => (
              <TruckCard
                key={truck.id}
                truck={truck}
                compact={compactView}
                emphasize={singleTruckMode || flashTruckId === truck.id}
                expanded={singleTruckMode && !compactView}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
