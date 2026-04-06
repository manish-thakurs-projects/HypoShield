import { useState, useEffect } from "react";

const patients = [
  {
    name: "Meera K.",
    id: "ID-0041",
    level: "CRITICAL",
    glucose: 42,
    detail: "Glucose 42 mg/dL — below critical threshold. No response in 8 min. Emergency contact queued.",
    time: "09:12 IST",
  },
  {
    name: "Rajan A.",
    id: "ID-0088",
    level: "CRITICAL",
    glucose: 49,
    detail: "Glucose 49 mg/dL — rapid descent from 87 mg/dL in 22 min. Nocturnal episode detected.",
    time: "09:07 IST",
  },
  {
    name: "Divya S.",
    id: "ID-0117",
    level: "CRITICAL",
    glucose: 51,
    detail: "Glucose 51 mg/dL — post-exercise hypo. CGM sensor signal weak, possible reading delay.",
    time: "08:58 IST",
  },
  {
    name: "Priya V.",
    id: "ID-0055",
    level: "HIGH",
    glucose: 63,
    detail: "Glucose 63 mg/dL — 2nd low episode this morning. Diet log shows skipped breakfast.",
    time: "08:47 IST",
  },
  {
    name: "Anand N.",
    id: "ID-0203",
    level: "MEDIUM",
    glucose: 68,
    detail: "Glucose 68 mg/dL — approaching low threshold. Trending down for 35 min. Predictive alert.",
    time: "08:39 IST",
  },
];

const timeline = [
  { color: "#ef4444", label: "Critical alert — Meera K.", sub: "42 mg/dL · emergency protocol initiated", time: "09:12" },
  { color: "#ef4444", label: "Critical alert — Rajan A.", sub: "49 mg/dL · rapid descent in sleep", time: "09:07" },
  { color: "#f59e0b", label: "High alert resolved — Karthik M.", sub: "Glucose stabilized at 82 mg/dL post-snack", time: "08:51" },
  { color: "#3b82f6", label: "Predictive alert — Anand N.", sub: "Downward trend detected · pre-emptive nudge sent", time: "08:39" },
  { color: "#22c55e", label: "Batch resolve — 4 medium alerts", sub: "Auto-resolved after 60 min stable reading", time: "07:15" },
];

const levelColors = {
  CRITICAL: { bg: "rgba(239,68,68,0.15)", border: "#ef4444", text: "#ef4444", bar: "#ef4444" },
  HIGH: { bg: "rgba(245,158,11,0.12)", border: "#f59e0b", text: "#f59e0b", bar: "#f59e0b" },
  MEDIUM: { bg: "rgba(59,130,246,0.12)", border: "#3b82f6", text: "#3b82f6", bar: "#3b82f6" },
};

function GaugeMeter({ score }) {
  const angle = -135 + (score / 100) * 270;
  return (
    <svg width="120" height="80" viewBox="0 0 120 80">
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <path d="M 10 75 A 50 50 0 0 1 110 75" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
      <path d="M 10 75 A 50 50 0 0 1 110 75" fill="none" stroke="url(#gaugeGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray="157" strokeDashoffset="0" opacity="0.9" />
      <g transform={`rotate(${angle}, 60, 75)`}>
        <line x1="60" y1="75" x2="60" y2="35" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="60" cy="75" r="5" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function HealthBar({ value, color }) {
  return (
    <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${value}%`, height: "100%", background: color, borderRadius: 3, transition: "width 1s ease" }} />
    </div>
  );
}

function Badge({ level }) {
  const c = levelColors[level] || levelColors.MEDIUM;
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 4, fontSize: 10, fontWeight: 700, padding: "2px 7px",
      letterSpacing: "0.08em", fontFamily: "'JetBrains Mono', monospace",
    }}>{level}</span>
  );
}

export default function Dashboard() {
  const [tick, setTick] = useState(0);
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const i1 = setInterval(() => setTick(t => t + 1), 2000);
    const i2 = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, []);

  const fmtTime = (d) => d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) + " IST";

  return (
    <div style={{
      minHeight: "100vh", background: "#060d1a",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      color: "#e2e8f0", padding: "0 0 40px 0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0f172a; } ::-webkit-scrollbar-thumb { background: #334155; border-radius: 3px; }
        .review-btn { background: transparent; border: 1px solid #334155; color: #94a3b8; padding: 7px 22px; border-radius: 6px; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; letter-spacing: 0.05em; transition: all 0.2s; }
        .review-btn:hover { background: #1e293b; border-color: #64748b; color: #e2e8f0; }
        .stat-card { background: #0d1829; border: 1px solid #1e293b; border-radius: 10px; padding: 18px 20px; }
        .pulse { animation: pulse 2s infinite; } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .blink { animation: blink 1.2s step-end infinite; } @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
        .fade-in { animation: fadeIn 0.5s ease; } @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        .alert-row:hover { background: rgba(255,255,255,0.03) !important; }
      `}</style>

      {/* Header */}
      <div style={{ background: "#0a1628", borderBottom: "1px solid #1e293b", padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#3b82f6,#0ea5e9)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.01em" }}>Alert command center</div>
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.15em" }}>HYPOGLYCEMIA MONITORING · REAL-TIME</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 12, color: "#64748b" }}>06 APR 2026 · {fmtTime(time)}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 7, background: "#0ea5e9", borderRadius: 20, padding: "5px 14px" }}>
            <span className="blink" style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff", display: "inline-block" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.1em" }}>LIVE FEED</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>
        {/* Risk Level Banner */}
        <div style={{ background: "linear-gradient(135deg,#0f1e35 0%,#0a1628 100%)", border: "1px solid #1e3a5f", borderRadius: 14, padding: "22px 28px", marginTop: 24, display: "flex", alignItems: "center", gap: 28 }}>
          <GaugeMeter score={73} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.18em", marginBottom: 4 }}>CURRENT RISK LEVEL</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 34, fontWeight: 800, color: "#f59e0b", letterSpacing: "-0.02em", lineHeight: 1 }}>ELEVATED</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>Score 73 / 100 · trending upward since 06:00</div>
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            {[["3","CRITICAL","#ef4444"],["7","HIGH","#f59e0b"],["12","MEDIUM","#3b82f6"],["194","STABLE","#22c55e"]].map(([n,l,c]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, fontWeight: 700, color: c, fontFamily: "'Syne',sans-serif" }}>{n}</div>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.12em", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginTop: 16 }}>
          {[
            { label: "CRITICAL ALERTS", value: "03", color: "#ef4444", sub: "↑ 3 since midnight" },
            { label: "AVG RESPONSE TIME", value: "4.2", unit: "min", color: "#f59e0b", sub: "Target: < 5 min" },
            { label: "ALERTS RESOLVED", value: "18", color: "#22c55e", sub: "Last 12 hours" },
            { label: "PATIENTS MONITORED", value: "214", color: "#38bdf8", sub: "97.6% sensor active" },
          ].map(s => (
            <div key={s.label} className="stat-card fade-in">
              <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.15em", marginBottom: 8 }}>{s.label}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <span style={{ fontSize: 36, fontWeight: 700, color: s.color, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{s.value}</span>
                {s.unit && <span style={{ fontSize: 15, color: s.color, fontWeight: 600 }}>{s.unit}</span>}
              </div>
              <div style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginTop: 16 }}>
          {/* Active Alerts */}
          <div style={{ background: "#0d1829", border: "1px solid #1e293b", borderRadius: 12, padding: "18px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px 16px" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", fontFamily: "'Syne',sans-serif" }}>Active alerts — high priority</span>
              <span style={{ background: "#1e3a5f", color: "#38bdf8", borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>22 active</span>
            </div>
            {patients.map((p, i) => {
              const c = levelColors[p.level] || levelColors.MEDIUM;
              return (
                <div key={p.id} className="alert-row" style={{ borderTop: "1px solid #131f30", padding: "14px 20px", display: "flex", gap: 14, alignItems: "flex-start", transition: "background 0.2s" }}>
                  <div style={{ width: 3, borderRadius: 3, background: c.bar, alignSelf: "stretch", flexShrink: 0, minHeight: 60 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: "#475569" }}>· {p.id}</span>
                      <Badge level={p.level} />
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6, maxWidth: 380 }}>{p.detail}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
                      <span style={{ fontSize: 10, color: "#475569" }}>{p.time}</span>
                      <button className="review-btn">Review</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Risk Distribution */}
            <div style={{ background: "#0d1829", border: "1px solid #1e293b", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Syne',sans-serif", color: "#e2e8f0", marginBottom: 14 }}>Risk distribution</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                {[["CRITICAL","3","#ef4444"],["HIGH","7","#f59e0b"],["MEDIUM","12","#3b82f6"],["STABLE","194","#22c55e"]].map(([l,v,c]) => (
                  <div key={l} style={{ background: "#131f30", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.15em", marginBottom: 4 }}>{l}</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: c, fontFamily: "'Syne',sans-serif" }}>{v}</div>
                  </div>
                ))}
              </div>
              {/* Distribution bar */}
              <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                {[["#ef4444",1.4],["#f59e0b",3.3],["#3b82f6",5.6],["#22c55e",89.7]].map(([c,w],i) => (
                  <div key={i} style={{ width: `${w}%`, background: c }} />
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#475569" }}>1.4% critical · 3.3% high · 5.6% med · 90.7% stable</div>
              <button className="review-btn" style={{ marginTop: 14, width: "100%", textAlign: "center" }}>Analyze risk trends ↗</button>
            </div>

            {/* Alert Velocity */}
            <div style={{ background: "#0d1829", border: "1px solid #1e293b", borderRadius: 12, padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Syne',sans-serif", color: "#e2e8f0", marginBottom: 14 }}>Alert velocity</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: "#131f30", borderRadius: 8, padding: "14px", textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#ef4444", fontFamily: "'Syne',sans-serif" }}>+3</div>
                  <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.12em", marginTop: 4 }}>LAST HOUR</div>
                </div>
                <div style={{ background: "#131f30", borderRadius: 8, padding: "14px", textAlign: "center" }}>
                  <div style={{ fontSize: 26, fontWeight: 700, color: "#f59e0b", fontFamily: "'Syne',sans-serif" }}>+11</div>
                  <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.12em", marginTop: 4 }}>LAST 6 HRS</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginTop: 16 }}>
          {/* Event Timeline */}
          <div style={{ background: "#0d1829", border: "1px solid #1e293b", borderRadius: 12, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Syne',sans-serif", color: "#e2e8f0" }}>Event timeline</span>
              <span style={{ background: "#1e293b", color: "#64748b", borderRadius: 6, padding: "2px 10px", fontSize: 10, fontWeight: 600 }}>today</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {timeline.map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", paddingBottom: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 3 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
                    {i < timeline.length - 1 && <div style={{ width: 1, flex: 1, background: "#1e293b", minHeight: 24, marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#e2e8f0" }}>{e.label}</span>
                      <span style={{ fontSize: 11, color: "#475569" }}>{e.time}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{e.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div style={{ background: "#0d1829", border: "1px solid #1e293b", borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Syne',sans-serif", color: "#e2e8f0", marginBottom: 16 }}>System health</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "CGM sensor uptime", value: 97.6, color: "#22c55e" },
                { label: "Alert delivery rate", value: 99.1, color: "#22c55e" },
                { label: "API response health", value: 84.2, color: "#f59e0b" },
                { label: "Data sync coverage", value: 95.3, color: "#22c55e" },
              ].map(h => (
                <div key={h.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>{h.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: h.color }}>{h.value}%</span>
                  </div>
                  <HealthBar value={h.value} color={h.color} />
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8, padding: "12px 14px", marginTop: 16 }}>
              <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 5 }}>⚠ API LATENCY WARNING</div>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>Response times elevated — avg 1.4s vs target 0.8s. Monitoring.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
