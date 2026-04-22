export type Truck = {
  id: string;
  model: string;
  op: string;
  cycles: number;
  cb: number;
  alert: boolean;
  status: string;
};

export const trucks: Truck[] = [
  { id: "CAT 793-11", model: "Caterpillar 793F", op: "R. Krishnamurthy", cycles: 48, cb: 5.3, alert: true, status: "CARRY-BACK DETECTED" },
  { id: "CAT 785-04", model: "Caterpillar 785D", op: "J. Ramesh", cycles: 52, cb: 0.4, alert: false, status: "OPERATIONAL" },
  { id: "CAT 797-01", model: "Caterpillar 797F", op: "M. Singh", cycles: 41, cb: 0.3, alert: false, status: "OPERATIONAL" },
  { id: "CAT 793-02", model: "Caterpillar 793F", op: "A. Kumar", cycles: 49, cb: 0.5, alert: false, status: "OPERATIONAL" },
  { id: "CAT 785-12", model: "Caterpillar 785D", op: "P. Sharma", cycles: 44, cb: 0.2, alert: false, status: "OPERATIONAL" },
  { id: "CAT 797-03", model: "Caterpillar 797F", op: "S. Nair", cycles: 38, cb: 0.8, alert: false, status: "OPERATIONAL" },
  { id: "CAT 793-08", model: "Caterpillar 793F", op: "V. Patel", cycles: 51, cb: 0.3, alert: false, status: "OPERATIONAL" },
  { id: "CAT 785-07", model: "Caterpillar 785D", op: "D. Reddy", cycles: 46, cb: 0.6, alert: false, status: "OPERATIONAL" },
];

export const logLines = [
  { time: "10:51:22", key: "DUMP_START", val: "- angle 47.3°", cls: "" },
  { time: "10:52:05", key: "LOAD_CELL", val: "- post-dump: 5.3t", cls: "important" },
  { time: "10:52:05", key: "ACOUSTIC", val: "- deviation: -56Hz", cls: "important" },
  { time: "10:52:06", key: "CAMERA", val: "- residue_zones: [FL, RL]", cls: "important" },
  { time: "10:52:06", key: "DECISION", val: "- carry_back CONFIRMED", cls: "important" },
  { time: "10:52:07", key: "ACTION", val: "- vibration_seq INITIATED", cls: "" },
  { time: "10:52:11", key: "VIBRATION", val: "- cycle_1 COMPLETE", cls: "success" },
  { time: "10:52:11", key: "RESCAN", val: "- residue PARTIAL (2.1t)", cls: "" },
  { time: "10:52:12", key: "ACTION", val: "- vibration_seq_2 INITIATED", cls: "" },
  { time: "10:52:16", key: "VIBRATION", val: "- cycle_2 COMPLETE", cls: "success" },
  { time: "10:52:16", key: "RESCAN", val: "- residue CLEARED", cls: "success" },
  { time: "10:52:17", key: "STATUS", val: "- CLEAR ✓", cls: "success" },
];

export const schedule = [
  { month: "APR", day: "08", truck: "CAT 793-11", task: "Bed liner inspect (FL zone)" },
  { month: "APR", day: "10", truck: "CAT 785-07", task: "Full SmartBed calibration" },
  { month: "APR", day: "12", truck: "CAT 797-01", task: "Vibrator motor service" },
  { month: "APR", day: "14", truck: "CAT 793-02", task: "Camera lens clean" },
  { month: "APR", day: "15", truck: "CAT 785-04", task: "Sensor array check" },
  { month: "APR", day: "21", truck: "CAT 797-03", task: "Vibrator replacement" },
];

export const hmData = {
  trucks: ["793-11", "785-04", "797-01", "793-02", "785-12", "797-03", "793-08", "785-07"],
  days: ["M", "T", "W", "T", "F", "S", "S"],
  vals: [
    [1, 2, 1, 3, 2, 3, 3],
    [2, 1, 1, 2, 1, 0, 1],
    [1, 2, 1, 1, 0, 1, 2],
    [2, 1, 2, 1, 2, 1, 1],
    [1, 1, 0, 1, 1, 2, 1],
    [1, 0, 1, 1, 0, 1, 0],
    [1, 2, 1, 2, 1, 1, 2],
    [0, 1, 1, 0, 1, 1, 1],
  ],
};
