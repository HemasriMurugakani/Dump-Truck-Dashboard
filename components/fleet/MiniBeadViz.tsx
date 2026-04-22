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
  return (
    <div className="w-full max-w-[280px] h-[120px] rounded-md border border-[#2A2A2A] bg-[#0E0E0E] p-2">
      <svg viewBox="0 0 280 120" className="w-full h-full" role="img" aria-label="Truck bed zone map">
        <polygon points="42,20 220,20 244,98 30,98" className="fill-[#101010] stroke-[#3A3A3A]" strokeWidth="1.2" />
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
      </svg>
    </div>
  );
}
