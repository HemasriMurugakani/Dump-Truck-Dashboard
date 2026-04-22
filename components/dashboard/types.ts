export type PageName = "fleet" | "detail" | "acoustic" | "analytics" | "maintenance" | "config";

export type RoiState = {
  fleet: number;
  payload: number;
  cb: number;
};

export type RoiSummary = {
  payloadRecovered: string;
  fuelSaved: string;
  savings: string;
};
