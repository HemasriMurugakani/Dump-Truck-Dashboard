"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useUiStore } from "@/store/ui-store";
import { Activity, BarChart3, Bell, Expand, LogOut, Menu, Minimize2, Monitor, ShieldCheck, Snowflake, Truck, X } from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, site } = useAuth();
  const ui = useUiStore();
  const router = useRouter();
  const pathname = usePathname();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Keep navigation the same as the previous implementation.
  const navItems = [
    { href: "/dashboard", icon: Monitor, label: "Fleet Overview" },
    { href: "/dashboard/fleet", icon: Truck, label: "Truck Detail" },
    { href: "/dashboard/acoustic", icon: Activity, label: "Acoustic" },
    { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
    { href: "/dashboard/config", icon: Snowflake, label: "Settings" },
    { href: "/dashboard/maintenance", icon: ShieldCheck, label: "Maintenance" },
  ];

  // Previous mobile UI only showed 5 items (no Analytics).
  const mobileNavItems = navItems.filter((item) => item.href !== "/dashboard/analytics");

  const avgCarryBack = ui.totalTrucks > 0 ? (ui.alertsCount / ui.totalTrucks) * 0.9 + 0.3 : 0;

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!drawerOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  async function handleToggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }
    await document.exitFullscreen();
  }

  async function handleLogout() {
    setDrawerOpen(false);
    await signOut({ redirect: false });
    router.replace("/");
  }

  return (
    <div className="min-h-screen bg-[#050607] text-[#F5F5F5]">
      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />

          <aside className="relative h-full w-[280px] border-r border-[#1A1A1A] bg-[#08090B] p-4 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 rounded-[10px] border border-[#E2B515] bg-[#0D1016] flex items-center justify-center shadow-[inset_0_0_0_1px_rgba(242,191,20,0.24)]">
                  <div className="h-7 w-7 rounded-[7px] bg-[#F9C21A] flex items-center justify-center text-[10px] font-bold text-black">
                    AF
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#F8C51D] truncate">SmartBed</div>
                  <div className="text-xs text-[#9CA3AF] truncate">
                    {site?.name} • {site?.zoneName}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDrawerOpen(false)}
                className="h-9 w-9 rounded-md border border-[#23262C] bg-[#0F1012] text-[#9CA3AF] hover:text-[#F5F5F5]"
                aria-label="Close navigation"
              >
                <X className="h-4 w-4 mx-auto" />
              </button>
            </div>

            <div className="mt-4 px-1 flex flex-col space-y-1">
              {mobileNavItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`h-11 flex items-center gap-3 rounded-[10px] px-3 transition-colors ${
                      active
                        ? "bg-[#161209] text-[#F5C21A] shadow-[inset_3px_0_0_#F5C21A]"
                        : "bg-transparent text-[#9CA3AF] hover:bg-[#11141A] hover:text-[#D1D5DB]"
                    }`}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    <span className="text-xs font-semibold">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="mt-auto pt-4 flex flex-col items-stretch gap-2">
              <button
                title="Logout"
                onClick={handleLogout}
                className="h-10 rounded-md border border-[#23262C] bg-[#0F1012] text-[#9CA3AF] hover:text-[#F87171] hover:border-[#7F1D1D] flex items-center justify-center gap-2"
              >
                <LogOut className="h-[18px] w-[18px]" />
                <span className="text-xs font-semibold">Logout</span>
              </button>

              <div className="text-center text-[10px] text-[#4E535F] tracking-wide">v4.2.1</div>
              <div className="flex items-center justify-center gap-1 text-[10px] text-[#22C55E]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
                LIVE
              </div>
            </div>
          </aside>
        </div>
      ) : null}

      {/* Desktop left rail */}
      <div className="hidden md:block fixed left-0 top-0 h-screen z-40">
        <aside className="h-full w-[56px] border-r border-[#1A1A1A] bg-[#08090B] overflow-hidden flex flex-col items-center">
          <div className="pt-4 pb-3">
            <div className="h-9 w-9 rounded-[9px] border border-[#E2B515] bg-[#0D1016] flex items-center justify-center shadow-[inset_0_0_0_1px_rgba(242,191,20,0.24)]">
              <div className="h-6 w-6 rounded-[6px] bg-[#F9C21A] flex items-center justify-center text-[10px] font-bold text-black">
                AF
              </div>
            </div>
          </div>

          <div className="pt-2 pb-3 flex-1 flex flex-col items-center gap-2 px-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <div key={item.href} className="group relative flex items-center justify-center">
                  <Link
                    href={item.href}
                    title={item.label}
                    className={`h-12 w-12 rounded-[4px] flex items-center justify-center transition-colors ${
                      active
                        ? "bg-[#161209] text-[#F5C21A] shadow-[inset_3px_0_0_#F5C21A]"
                        : "bg-transparent text-[#434955] hover:bg-[#11141A] hover:text-[#D1D5DB]"
                    }`}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                  </Link>
                  <span className="pointer-events-none absolute left-[60px] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md border border-[#252A35] bg-[#0E1013] px-2 py-1 text-[11px] text-[#F5F5F5] opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-auto pb-3 flex flex-col items-center gap-2">
            <button
              title="Logout"
              onClick={handleLogout}
              className="h-12 w-12 rounded-[4px] border border-[#23262C] bg-[#0F1012] text-[#9CA3AF] hover:text-[#F87171] hover:border-[#7F1D1D]"
            >
              <LogOut className="h-[18px] w-[18px] mx-auto" />
            </button>
            <div className="text-[10px] text-[#4E535F] tracking-wide">v4.2.1</div>
            <div className="flex items-center gap-1 text-[10px] text-[#22C55E]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
              LIVE
            </div>
          </div>
        </aside>
      </div>

      <header className="sticky top-0 z-30 border-b border-[#1A1A1A] bg-[#07080A]/95 backdrop-blur md:ml-[56px]">
        <div className="h-14 px-3 md:px-6 flex items-center justify-between gap-3 border-b border-[#121317]">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="md:hidden h-9 w-9 rounded-md border border-[#23262C] bg-[#0F1012] text-[#9CA3AF] hover:text-[#F5F5F5]"
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4 mx-auto" />
            </button>

            <div className="h-7 w-7 rounded-md bg-[#FFC107] flex items-center justify-center text-[10px] font-bold text-black">
              SB
            </div>
            <div className="truncate">
              <div className="text-sm font-semibold text-[#F8C51D]">SmartBed</div>
              <div className="text-xs text-[#9CA3AF] truncate">
                {site?.name} • {site?.zoneName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="hidden lg:inline text-[#22C55E]">ONLINE</span>
            <button className="relative text-[#9CA3AF]">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#EF4444]" />
            </button>
            <button onClick={handleToggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Expand className="h-4 w-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="hidden lg:inline rounded-md border border-[#23262C] bg-[#0F1012] px-2 py-1 text-[11px] text-[#E5E7EB] hover:border-[#7F1D1D] hover:text-[#F87171]"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="h-10 px-3 md:px-6 flex items-center gap-0 overflow-x-auto">
          <Pill color="green" text={`Active Trucks: ${ui.activeTrucks}/${ui.totalTrucks}`} />
          <Pill color="red" text={`Alerts: ${ui.alertsCount}`} />
          <Pill color="blue" text={`Fleet Payload Today: ${ui.fleetPayloadToday.toLocaleString()} t`} />
          <Pill color="gray" text={`Avg Carry-Back`} value={`${avgCarryBack.toFixed(1)} %`} />
          <Pill color="gray" text={`Shift ${ui.shiftNumber} of 3`} />
          <Pill color="gray" text={`Operator: ${user?.name ?? "-"}`} />
          <Pill color="gray" text={`${ui.weather.wind} • ${ui.weather.tempC}°C`} />
          <Pill color={ui.dustIndex === "HIGH" ? "red" : "gray"} text={`Dust Index: ${ui.dustIndex}`} />
        </div>
      </header>

      <main className="md:ml-[56px] p-3 md:p-6 pb-6">{children}</main>
    </div>
  );
}

function Pill({ color, text, value }: { color: "green" | "red" | "blue" | "gray"; text: string; value?: string }) {
  const dot =
    color === "green"
      ? "bg-[#22C55E]"
      : color === "red"
        ? "bg-[#EF4444]"
        : color === "blue"
          ? "bg-[#3B82F6]"
          : "bg-[#4B5563]";

  return (
    <div className="h-10 border-r border-[#1A1A1A] px-4 bg-[#0E1013] text-[12px] text-[#F5F5F5] flex items-center gap-2 whitespace-nowrap flex-shrink-0">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="tabular-nums">{text}</span>
      {value ? <span className="text-[#F8C51D] tabular-nums font-semibold">{value}</span> : null}
    </div>
  );
}
