import { trucks } from "../data";

type FleetPageProps = {
  onOpenDetail: () => void;
};

export function FleetPage({ onOpenDetail }: FleetPageProps) {
  return (
    <div className="page active">
      <div className="fleet-grid">
        {trucks.map((truck) => (
          <button
            key={truck.id}
            className={`truck-card text-left ${truck.alert ? "alert" : ""}`}
            onClick={onOpenDetail}
          >
            <div className="truck-card-header">
              <div>
                <div className="truck-id">{truck.id}</div>
                <div className="truck-model">{truck.model}</div>
              </div>
              <div className={`status-badge ${truck.alert ? "carry-back" : "operational"}`}>{truck.status}</div>
            </div>
            <div className="truck-stats">
              <div className="stat"><div className="stat-label">Operator</div><div className="stat-val">{`${truck.op.split(" ")[0][0]}. ${truck.op.split(" ").slice(-1)[0]}`}</div></div>
              <div className="stat"><div className="stat-label">Cycles Today</div><div className="stat-val">{truck.cycles}</div></div>
              <div className="stat"><div className="stat-label">Carry-Back</div><div className={`stat-val ${truck.cb > 1 ? "warn" : ""}`}>{truck.cb}%</div></div>
            </div>
            {truck.alert && (
              <div className="bed-viz-mini">
                <div className="bed-viz-mini-label">Bed Status</div>
                <div style={{ position: "relative", height: "44px" }}>
                  <svg viewBox="0 0 160 44" style={{ width: "100%", height: "100%" }}>
                    <polygon points="20,4 140,4 152,40 8,40" fill="#1a1f2a" stroke="#252a35" strokeWidth="1.5" />
                  </svg>
                  <div className="residue-dot" style={{ left: "22%", top: "18%" }}>FL</div>
                  <div className="residue-dot" style={{ left: "22%", top: "55%" }}>RL</div>
                </div>
                <div style={{ fontSize: "10px", color: "var(--text3)", fontFamily: "var(--mono)", marginTop: "4px" }}>Residue detected: FL, RL zones</div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
