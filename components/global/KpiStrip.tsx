"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

type KpiStripProps = {
  activeSites: number;
  trucksMonitored: number;
  payloadRecovered: number;
  avgCarryBackRate: string;
  co2Saved: number;
  uptime: string;
};

export function KpiStrip({
  activeSites,
  trucksMonitored,
  payloadRecovered,
  avgCarryBackRate,
  co2Saved,
  uptime,
}: KpiStripProps) {
  return (
    <div className="kpi-strip">
      <Card>
        <CardHeader>
          <p className="kpi-label">Total Active Sites</p>
          <p className="kpi-value">{activeSites}</p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <p className="kpi-label">Total Trucks Monitored</p>
          <p className="kpi-value">{trucksMonitored}</p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <p className="kpi-label">Global Payload Recovered (Today)</p>
          <p className="kpi-value">{payloadRecovered.toLocaleString()}<span className="kpi-unit">t</span></p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <p className="kpi-label">Global Avg Carry-Back Rate</p>
          <p className="kpi-value">{avgCarryBackRate}<span className="kpi-unit">%</span></p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <p className="kpi-label">Total CO₂ Saved (Year)</p>
          <p className="kpi-value">{(co2Saved / 1000).toFixed(1)}<span className="kpi-unit">Kt</span></p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <p className="kpi-label">System Uptime</p>
          <p className="kpi-value">{uptime}<span className="kpi-unit">%</span></p>
        </CardHeader>
      </Card>

      <style jsx>{`
        .kpi-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .kpi-label {
          font-size: 11px;
          color: var(--text2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .kpi-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--text);
          font-family: var(--mono);
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .kpi-unit {
          font-size: 12px;
          color: var(--text2);
          font-weight: 400;
        }
      `}</style>
    </div>
  );
}
