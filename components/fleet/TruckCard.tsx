"use client";

import { MiniBeadViz } from "@/components/fleet/MiniBeadViz";
import type { TruckRecord } from "@/lib/mockData";
import { Wrench } from "lucide-react";
import Link from "next/link";

function cbClass(value: number) {
  if (value >= 2) {
    return "text-[#EF4444]";
  }
  if (value >= 0.8) {
    return "text-[#F97316]";
  }
  return "text-[#22C55E]";
}

function statusStyles(status: TruckRecord["status"]) {
  if (status === "CARRY_BACK_DETECTED") {
    return {
      card: "border-[#7E1E25] bg-[#17090D] hover:border-[#B73745]",
      badge: "bg-[#5B1D24] border border-[#8D2D38] text-[#FCA5A5] smartbed-badge-pulse",
      text: "CARRY-BACK DETECTED",
    };
  }
  if (status === "MAINTENANCE") {
    return {
      card: "border-[#F97316] bg-[#16110A] hover:border-[#FB923C]",
      badge: "bg-[#F97316] text-black",
      text: "MAINTENANCE",
    };
  }
  if (status === "IDLE") {
    return {
      card: "border-[#6B7280] bg-[#101214] hover:border-[#9CA3AF]",
      badge: "bg-[#6B7280] text-white",
      text: "IDLE",
    };
  }
  return {
    card: "border-[#0E3A2A] bg-[#061510] hover:border-[#1B6B4D]",
    badge: "bg-[#083A2B] border border-[#1B6B4D] text-[#86EFAC]",
    text: "OPERATIONAL",
  };
}

function idleTime(timeIso: string) {
  const date = new Date(timeIso);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function TruckCard({
  truck,
  compact,
  emphasize,
  expanded,
}: {
  truck: TruckRecord;
  compact: boolean;
  emphasize?: boolean;
  expanded?: boolean;
}) {
  const style = statusStyles(truck.status);
  const residueZones = truck.sensors.camera.zones.length > 0 ? truck.sensors.camera.zones.join(", ") : "FL, RL";
  const modelLabel = truck.model.startsWith("Caterpillar") ? truck.model : `Caterpillar ${truck.model}`;

  if (compact) {
    return (
      <Link
        href={`/dashboard/truck/${truck.id}`}
        className={`block rounded-lg border p-3 transition-all duration-200 hover:translate-y-[-2px] ${style.card} ${emphasize ? "ring-2 ring-[#FFC107]" : ""}`}
      >
        <div className="flex items-center gap-3">
          <p className="font-mono font-semibold text-[#FFC107] min-w-[120px]">CAT {truck.id}</p>
          <p className="text-xs text-[#9CA3AF] truncate">{truck.operator}</p>
          <p className="text-xs text-[#9CA3AF] ml-auto tabular-nums">{truck.cyclesShift} cycles</p>
          <p className={`text-sm font-semibold tabular-nums ${cbClass(truck.carryBackPct)}`}>{truck.carryBackPct.toFixed(1)}%</p>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${style.badge}`}>{style.text}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/dashboard/truck/${truck.id}`}
      className={`block rounded-md border p-4 transition-all duration-200 hover:translate-y-[-2px] ${style.card} ${emphasize ? "smartbed-card-flash" : ""} ${expanded ? "md:p-5" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[34px] leading-none font-bold font-cond text-[#F6C32D] tracking-wide">CAT {truck.id}</p>
          <p className="text-sm text-[#9CA3AF] mt-1">{modelLabel}</p>
        </div>
        <span className={`rounded-sm px-2.5 py-1 text-[10px] font-semibold tracking-wide ${style.badge}`}>{style.text}</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
        <div>
          <p className="text-[#6B7280] uppercase tracking-wide text-[10px]">Operator</p>
          <p className="text-[#E5E7EB] mt-1 truncate text-[24px] leading-none font-cond">{truck.operator}</p>
        </div>
        <div>
          <p className="text-[#6B7280] uppercase tracking-wide text-[10px]">Cycles Today</p>
          <p className="text-[#E5E7EB] mt-1 font-semibold tabular-nums text-[26px] leading-none font-cond">{truck.cyclesShift}</p>
        </div>
        <div>
          <p className="text-[#6B7280] uppercase tracking-wide text-[10px]">Carry-Back</p>
          <p className={`mt-1 font-semibold tabular-nums text-[26px] leading-none font-cond ${cbClass(truck.carryBackPct)}`}>{truck.carryBackPct.toFixed(1)}%</p>
        </div>
      </div>

      {truck.status === "CARRY_BACK_DETECTED" && (
        <div className="mt-4">
          <MiniBeadViz bedZones={truck.bedZones} />
          <p className="mt-2 text-xs text-[#FCA5A5]">Residue detected: {residueZones} zones</p>
        </div>
      )}

      {truck.status === "MAINTENANCE" && (
        <div className="mt-4 flex items-center gap-2 text-xs text-[#FDBA74]">
          <Wrench className="h-4 w-4" />
          <span>In maintenance</span>
        </div>
      )}

      {truck.status === "IDLE" && <p className="mt-4 text-xs text-[#9CA3AF]">Idle since {idleTime(truck.lastDumpTime)}</p>}
    </Link>
  );
}
