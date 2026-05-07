"use client";

import type { TruckRecord } from "@/lib/mockData";

type ZoneKey = keyof TruckRecord["bedZones"];

const zonePolygons: Record<ZoneKey, string> = {
  FL: "62,24 118,24 102,50 54,50",
  FC: "118,24 162,24 150,50 102,50",
  FR: "162,24 218,24 226,50 150,50",
  RL: "54,50 102,50 92,95 42,95",
  RC: "102,50 150,50 144,95 92,95",
  RR: "150,50 226,50 238,95 144,95",
};

function zoneClass(status: TruckRecord["bedZones"][ZoneKey]["status"]) {
  if (status === "critical") {
    return "fill-[#EF4444] fill-opacity-80 smartbed-critical-breathe";
  }
  if (status === "warning") {
    return "fill-[#F97316] fill-opacity-60";
  }
  return "fill-[#1A1A1A]";
}

export function MiniBeadViz({ bedZones }: { bedZones: TruckRecord["bedZones"] }) {
  const alertCount = Object.values(bedZones).filter((zone) => zone.status !== "clear").length;
  return (
    <div className="w-full max-w-[320px] h-[126px] rounded-sm border border-[#26282C] bg-[#06070A] p-2">
      <p className="mb-1 text-[10px] tracking-wide text-[#6B7280] uppercase">Bed Status</p>
      <svg viewBox="0 0 280 120" className="w-full h-full" role="img" aria-label="Truck bed zone map">
        <rect x="12" y="18" width="256" height="84" rx="4" className="fill-[#07080A] stroke-[#1E2024]" strokeWidth="1.2" />
        <line x1="20" y1="38" x2="260" y2="38" stroke="#16191F" strokeWidth="1" />
        <line x1="20" y1="58" x2="260" y2="58" stroke="#16191F" strokeWidth="1" />
        <line x1="20" y1="78" x2="260" y2="78" stroke="#16191F" strokeWidth="1" />
        <polygon points="42,22 220,22 244,96 30,96" className="fill-[#0D0E10] stroke-[#2A2E34]" strokeWidth="1.2" />
        {(Object.keys(zonePolygons) as ZoneKey[]).map((zone) => (
          <g key={zone}>
            <polygon points={zonePolygons[zone]} className={`${zoneClass(bedZones[zone].status)} stroke-[#272727]`} strokeWidth="1" />
            <text
              x={zone === "FL" ? 80 : zone === "FC" ? 132 : zone === "FR" ? 190 : zone === "RL" ? 73 : zone === "RC" ? 120 : 188}
              y={zone === "FL" || zone === "FC" || zone === "FR" ? 42 : 76}
              className="fill-[#D1D5DB] text-[10px] font-semibold"
              textAnchor="middle"
            >
              {zone}
            </text>
          </g>
        ))}
        {alertCount > 0 ? (
          <g>
            <polygon points="110,48 168,48 154,72 124,72" className="fill-[#EF4444] fill-opacity-80 smartbed-critical-breathe" />
            <polygon points="108,46 170,46 156,74 122,74" className="fill-none stroke-[#FCA5A5] stroke-opacity-70" />
          </g>
        ) : null}
      </svg>
    </div>
  );
}
