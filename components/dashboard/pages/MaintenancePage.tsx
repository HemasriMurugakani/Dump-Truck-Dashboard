import { schedule } from "../data";

export function MaintenancePage() {
  return (
    <div className="page active">
      <div className="page-title" style={{ marginBottom: "20px" }}>Predictive Maintenance</div>
      <div className="maint-grid">
        <div>
          <div className="panel-title" style={{ color: "var(--text3)", fontFamily: "var(--cond)", fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>Maintenance Alerts</div>
          <div className="alert-item high"><div><span className="alert-sev high">HIGH</span><span className="alert-truck">CAT 793-11</span></div><div className="alert-desc">Bed liner wear detected (zone FL)</div><div className="alert-remain">Est. remaining: <span className="cycles">340 cycles</span></div><div className="alert-action">Action: Inspect at shift end</div></div>
          <div className="alert-item med"><div><span className="alert-sev med">MED</span><span className="alert-truck">CAT 785-04</span></div><div className="alert-desc">Camera lens fouling (90% clean)</div><div className="alert-action">Action: Manual clean next access</div></div>
          <div className="alert-item low"><div><span className="alert-sev low">LOW</span><span className="alert-truck">CAT 797-03</span></div><div className="alert-desc">Vibrator motor hours: 847h</div><div className="alert-remain">Est. remaining: <span style={{ color: "var(--yellow)", fontFamily: "var(--mono)", fontWeight: 700 }}>153h</span></div><div className="alert-action">Action: Scheduled replacement: 1000h</div></div>
          <div className="alert-item low"><div><span className="alert-sev low">LOW</span><span className="alert-truck">CAT 793-08</span></div><div className="alert-desc">Ultrasonic calibration due</div><div className="alert-action">Action: Last: 2026-03-28 / Interval: 30 days</div></div>
        </div>
        <div className="panel">
          <div className="panel-title">Bed Wear Analysis — CAT 793-11</div>
          <div style={{ position: "relative", width: "100%", maxWidth: "400px", margin: "0 auto" }}>
            <svg viewBox="0 0 400 300" style={{ width: "100%" }}>
              <defs>
                <linearGradient id="flGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: "#8b1a1a" }} /><stop offset="100%" style={{ stopColor: "#c62828" }} /></linearGradient>
                <linearGradient id="frGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: "#1a4731" }} /><stop offset="100%" style={{ stopColor: "#2e7d32" }} /></linearGradient>
                <linearGradient id="rlGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: "#7c2900" }} /><stop offset="100%" style={{ stopColor: "#bf360c" }} /></linearGradient>
                <linearGradient id="rcGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: "#7c2900" }} /><stop offset="100%" style={{ stopColor: "#bf360c" }} /></linearGradient>
                <linearGradient id="rrGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style={{ stopColor: "#1a4731" }} /><stop offset="100%" style={{ stopColor: "#2e7d32" }} /></linearGradient>
              </defs>
              <polygon points="80,30 200,30 200,150 80,150" fill="url(#flGrad)" stroke="#0a0b0d" strokeWidth="3" />
              <polygon points="200,30 320,30 320,150 200,150" fill="url(#frGrad)" stroke="#0a0b0d" strokeWidth="3" />
              <polygon points="80,150 200,150 200,270 80,270" fill="url(#rlGrad)" stroke="#0a0b0d" strokeWidth="3" />
              <polygon points="200,150 260,150 260,270 200,270" fill="url(#rcGrad)" stroke="#0a0b0d" strokeWidth="3" />
              <polygon points="260,150 320,150 320,270 260,270" fill="url(#rrGrad)" stroke="#0a0b0d" strokeWidth="3" />
            </svg>
          </div>
          <div style={{ background: "var(--red-dim)", border: "1px solid rgba(229,57,53,0.3)", borderRadius: "6px", padding: "12px", marginTop: "14px" }}>
            <div style={{ fontFamily: "var(--cond)", fontWeight: 700, fontSize: "13px", color: "var(--red)", marginBottom: "6px" }}>PROJECTED BED LINER REPLACEMENT</div>
            <div style={{ fontSize: "12px", color: "var(--text2)" }}>Rear-Left zone: 340 cycles / ~7 days at current rate</div>
          </div>
          <div style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "6px", marginTop: "8px", fontSize: "12px", color: "var(--text2)" }}>Full bed replacement: ~2,100 cycles / ~44 days</div>
        </div>
        <div>
          <div className="panel-title" style={{ color: "var(--text3)", fontFamily: "var(--cond)", fontSize: "12px", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "12px" }}>Maintenance Schedule</div>
          {schedule.map((item) => (
            <div className="sched-item" key={`${item.month}-${item.day}-${item.truck}`}>
              <div className="sched-date"><div className="sched-month">{item.month}</div><div className="sched-day">{item.day}</div></div>
              <div className="sched-info"><div className="sched-truck">{item.truck}</div><div className="sched-task">{item.task}</div></div>
              <div className="sched-check" />
            </div>
          ))}
          <div className="cost-box" style={{ marginTop: "16px" }}>
            <div className="cost-title">Cost Avoidance Summary</div>
            <div className="cost-row"><span className="cost-label">Predicted interventions</span><span className="cost-val">$48,200</span></div>
            <div className="cost-row"><span className="cost-label">Unplanned downtime avoided</span><span className="cost-val">$124,500</span></div>
            <div className="cost-row"><span className="cost-label">Liner replacement optimized</span><span className="cost-val">$32,800</span></div>
            <div style={{ borderTop: "1px solid rgba(0,200,83,0.2)", marginTop: "8px", paddingTop: "8px" }}>
              <div className="cost-row"><span className="cost-label" style={{ fontWeight: 700, color: "var(--text)" }}>Total this month</span><span className="cost-val" style={{ fontSize: "16px", fontWeight: 700 }}>$205,500</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
