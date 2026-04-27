"use client";

import { useEffect, useRef, useState } from "react";
import type { GlobalSiteData } from "@/lib/mockData";

declare global {
  interface Window {
    L: any;
    mapSiteClick: (siteId: string) => void;
  }
}

type GlobalMapProps = {
  sites: GlobalSiteData[];
  selectedSite: string | null;
  onSelectSite: (siteId: string) => void;
};

export function GlobalMap({ sites, selectedSite, onSelectSite }: GlobalMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const popupsRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [layersVisible, setLayersVisible] = useState({
    routes: false,
    alerts: true,
  });

  useEffect(() => {
    // Load Leaflet CSS and JS from CDN
    if (!window.L) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
      document.head.appendChild(link);

      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.async = true;
      script.onload = () => {
        setMapLoaded(true);
      };
      document.body.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapContainer.current || mapRef.current) {
      return;
    }

    // Initialize map centered on US
    const L = window.L;
    const map = L.map(mapContainer.current).setView([39.8283, -98.5795], 4);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Add markers for each site
    sites.forEach((site) => {
      const statusColor =
        site.status === "OFFLINE"
          ? "#e53935"
          : site.alertSeverity === "CRITICAL"
            ? "#ff6d00"
            : site.alertSeverity === "WARNING"
              ? "#ffc107"
              : "#00c853";

      const html = `
        <div class="custom-marker" style="background-color: ${statusColor}">
          <span style="font-size: 10px; font-weight: bold; color: white;">${site.trucksCount}</span>
        </div>
      `;

      const marker = L.marker([site.lat, site.lng], {
        icon: L.divIcon({
          html,
          iconSize: [28, 28],
          popupAnchor: [0, -14],
        }),
      }).addTo(map);

      const popup = L.popup({ maxWidth: 280 }).setContent(`
        <div style="color: #e8eaf0; font-family: var(--sans); font-size: 12px;">
          <p style="font-weight: 600; margin: 0 0 8px 0; font-size: 13px;">${site.name}</p>
          <p style="margin: 4px 0; color: #8f96a8;">📍 ${site.location}</p>
          <p style="margin: 4px 0;">Trucks: <span style="color: #f5c800;">${site.trucksCount}</span></p>
          <p style="margin: 4px 0;">Avg Carry-Back: <span style="color: #f5c800;">${site.avgCarryBackPct.toFixed(2)}%</span></p>
          <p style="margin: 4px 0;">Alerts: <span style="color: ${site.alertCount > 0 ? "#ff6d00" : "#00c853"};">${site.alertCount}</span></p>
          <p style="margin: 4px 0; color: ${site.status === "OPERATIONAL" ? "#00c853" : "#e53935"};">Status: ${site.status}</p>
          <button onclick="window.mapSiteClick('${site.id}')" style="margin-top: 8px; padding: 4px 8px; background: #f5c800; color: #000; border: none; border-radius: 3px; font-size: 11px; font-weight: 600; cursor: pointer;">View Site</button>
        </div>
      `);

      marker.bindPopup(popup);
      markersRef.current.push(marker);
      popupsRef.current.push(popup);

      marker.on("click", () => {
        onSelectSite(site.id);
        // Close all other popups
        markersRef.current.forEach((m) => {
          if (m !== marker) {
            m.closePopup();
          }
        });
      });
    });

    // Make function available globally for popup button
    window.mapSiteClick = (siteId: string) => {
      onSelectSite(siteId);
    };

    return () => {
      // Cleanup handled by React
    };
  }, [mapLoaded, sites, onSelectSite]);

  return (
    <div className="global-map-container">
      <div className="map-controls">
        <label className="control-label">
          <input
            type="checkbox"
            checked={layersVisible.routes}
            onChange={(e) => setLayersVisible({ ...layersVisible, routes: e.target.checked })}
          />
          Truck Routes
        </label>
        <label className="control-label">
          <input
            type="checkbox"
            checked={layersVisible.alerts}
            onChange={(e) => setLayersVisible({ ...layersVisible, alerts: e.target.checked })}
          />
          Alert Zones
        </label>
      </div>
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-dot green"></div>
          <span>Operational</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot yellow"></div>
          <span>Warning</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot orange"></div>
          <span>Critical</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot red"></div>
          <span>Offline</span>
        </div>
      </div>
      <div ref={mapContainer} className="map-container" />

      <style jsx>{`
        .global-map-container {
          position: relative;
          height: 500px;
          border-radius: 6px;
          overflow: hidden;
          background: var(--bg2);
        }

        .map-container {
          width: 100%;
          height: 100%;
          background: var(--bg2);
        }

        .map-controls {
          position: absolute;
          top: 12px;
          left: 12px;
          background: rgba(13, 11, 13, 0.9);
          backdrop-filter: blur(8px);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 12px;
          z-index: 400;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .control-label {
          font-size: 11px;
          color: var(--text2);
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          user-select: none;
        }

        .control-label input {
          cursor: pointer;
          accent-color: var(--yellow);
        }

        .map-legend {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(13, 11, 13, 0.9);
          backdrop-filter: blur(8px);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 12px;
          z-index: 400;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          color: var(--text2);
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .legend-dot.green {
          background: #00c853;
        }

        .legend-dot.yellow {
          background: #ffc107;
        }

        .legend-dot.orange {
          background: #ff6d00;
        }

        .legend-dot.red {
          background: #e53935;
        }
      `}</style>

      <style>{`
        .custom-marker {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          cursor: pointer;
          transition: all 0.2s;
        }

        .custom-marker:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
