import { create } from "zustand";

type UiState = {
  activeTrucks: number;
  totalTrucks: number;
  alertsCount: number;
  fleetPayloadToday: number;
  shiftNumber: number;
  dustIndex: "LOW" | "MODERATE" | "HIGH";
  weather: { wind: string; tempC: number };
  setAlertsCount: (count: number) => void;
};

export const useUiStore = create<UiState>((set) => ({
  activeTrucks: 8,
  totalTrucks: 8,
  alertsCount: 3,
  fleetPayloadToday: 1847,
  shiftNumber: 2,
  dustIndex: "MODERATE",
  weather: { wind: "12 km/h NE", tempC: 31 },
  setAlertsCount: (count) => set({ alertsCount: count }),
}));
