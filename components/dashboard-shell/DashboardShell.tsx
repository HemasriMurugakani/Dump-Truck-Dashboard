"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useUiStore } from "@/store/ui-store";
import { BarChart3, Bell, Expand, Grid2x2, Shield, SlidersHorizontal, Star, Truck, Waves } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

const navItems = [
  { href: "/dashboard", icon: Grid2x2, label: "Dashboard" },
  { href: "/dashboard/fleet", icon: Truck, label: "Truck Detail" },
  { href: "/dashboard/acoustic", icon: Waves, label: "Acoustic" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/site", icon: Star, label: "Settings" },
  { href: "/dashboard/maintenance", icon: Shield, label: "Maintenance" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, site } = useAuth();
  const ui = useUiStore();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#F5F5F5]">
      <div className="hidden md:block fixed left-0 top-0 h-screen z-40 group">
        <aside className="h-full w-12 group-hover:w-[220px] transition-all duration-300 border-r border-[#1F1F1F] bg-[#111111] overflow-hidden">
          <div className="pt-4 space-y-2 px-1">
            {navItems.map((item, index) => (
              <Link
                key={`${item.href}-${index}`}
                href={item.href}
                className="h-10 rounded-full border border-[#1F1F1F] bg-[#0F0F0F] hover:bg-[#171717] flex items-center gap-3 px-2"
              >
                <item.icon className="h-4 w-4 text-[#F5F5F5]" />
                <span className="text-sm text-[#9CA3AF] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">{item.label}</span>
              </Link>
            ))}
          </div>
          <div className="absolute bottom-4 left-0 right-0 px-2">
            <div className="border border-[#1F1F1F] rounded-lg p-2 bg-[#0F0F0F]">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-[#FFC107] text-black font-semibold flex items-center justify-center">
                  {user?.name?.split(" ").map((w) => w[0]).join("").slice(0, 2) ?? "SB"}
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-[#F5F5F5]">{user?.name}</p>
                  <p className="text-[10px] text-[#9CA3AF]">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="mt-2 w-full rounded-md border border-[#1F1F1F] bg-[#171717] text-[#F5F5F5] text-xs py-1"
              >
                Logout
              </button>
            </div>
          </div>
        </aside>
      </div>

      <header className="sticky top-0 z-30 h-16 border-b border-[#1F1F1F] bg-[#111111]/95 backdrop-blur md:ml-12">
        <div className="h-full px-3 md:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-7 w-7 rounded-md bg-[#FFC107]" />
            <div className="truncate">
              <div className="text-sm font-semibold">SmartBed</div>
              <div className="text-xs text-[#9CA3AF] truncate">{site?.name} • {site?.zoneName}</div>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <Pill color="green" text={`Active Trucks: ${ui.activeTrucks}/${ui.totalTrucks}`} />
            <Pill color="red" text={`Alerts: ${ui.alertsCount}`} />
            <Pill color="blue" text={`Fleet Payload Today: ${ui.fleetPayloadToday.toLocaleString()} t`} />
            <Pill color="gray" text={`Shift ${ui.shiftNumber} of 3`} />
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden xl:inline text-[#9CA3AF]">{user?.name}</span>
            <span className="hidden xl:inline text-[#9CA3AF]">{ui.weather.wind} • {ui.weather.tempC}°C</span>
            <span className={`${ui.dustIndex === "HIGH" ? "text-[#EF4444]" : ui.dustIndex === "LOW" ? "text-[#22C55E]" : "text-[#F97316]"}`}>Dust {ui.dustIndex}</span>
            <button className="relative"><Bell className="h-4 w-4" /><span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#EF4444]" /></button>
            <button><Expand className="h-4 w-4" /></button>
          </div>
        </div>
      </header>

      <main className="md:ml-12 p-3 md:p-6 pb-20 md:pb-6">{children}</main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-14 border-t border-[#1F1F1F] bg-[#111111] grid grid-cols-5 z-40">
        {[
          { href: "/dashboard", icon: Grid2x2 },
          { href: "/dashboard/fleet", icon: Truck },
          { href: "/dashboard/acoustic", icon: Waves },
          { href: "/dashboard/site", icon: SlidersHorizontal },
          { href: "/dashboard/maintenance", icon: Shield },
        ].map((item, idx) => (
          <Link key={idx} href={item.href} className="flex items-center justify-center">
            <item.icon className="h-5 w-5 text-[#9CA3AF]" />
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Pill({ color, text }: { color: "green" | "red" | "blue" | "gray"; text: string }) {
  const dot =
    color === "green"
      ? "bg-[#22C55E]"
      : color === "red"
        ? "bg-[#EF4444]"
        : color === "blue"
          ? "bg-[#3B82F6]"
          : "bg-[#4B5563]";

  return (
    <div className="rounded-full border border-[#1F1F1F] px-3 py-1 bg-[#0F0F0F] text-[11px] text-[#F5F5F5] flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="tabular-nums">{text}</span>
    </div>
  );
}
