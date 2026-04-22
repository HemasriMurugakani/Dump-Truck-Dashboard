"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ALERTS, CYCLES, TRUCKS } from "@/lib/mockData";

export function RoleLanding({ title, description }: { title: string; description: string }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <p className="text-xs text-[#9CA3AF]">Total Trucks</p>
          <p className="text-2xl text-[#F5F5F5] tabular-nums">{TRUCKS.length}</p>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <p className="text-xs text-[#9CA3AF]">Open Alerts</p>
          <p className="text-2xl text-[#F5F5F5] tabular-nums">{ALERTS.filter((a) => !a.resolved).length}</p>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <p className="text-xs text-[#9CA3AF]">Cycles Logged</p>
          <p className="text-2xl text-[#F5F5F5] tabular-nums">{CYCLES.length}</p>
        </CardHeader>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <p className="text-sm text-[#F5F5F5]">{title}</p>
          <p className="text-xs text-[#9CA3AF]">{description}</p>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader>
          <p className="text-sm text-[#F5F5F5]">Latest Alert</p>
        </CardHeader>
        <CardContent>
          <p className="text-xs font-mono text-[#9CA3AF]">{ALERTS[0]?.message}</p>
        </CardContent>
      </Card>
    </div>
  );
}
