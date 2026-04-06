'use client';

import { useState, useEffect } from "react";

// ---------- Types (match HealthData from useBluetooth) ----------
interface HealthData {
  heartRate: number;
  spo2: number;
  activity: number;
  timestamp: Date;
}

interface Alert {
  name: string;
  id: string;
  level: "CRITICAL" | "HIGH" | "MEDIUM";
  heartRate?: number;
  spo2?: number;
  detail: string;
  time: string;
}

// ---------- Thresholds for alerts ----------
const ALERT_RULES = [
  { metric: "spo2", below: 90, level: "CRITICAL", message: (v: number) => `SpO₂ ${v}% — severe hypoxemia` },
  { metric: "spo2", below: 94, level: "HIGH", message: (v: number) => `SpO₂ ${v}% — mild hypoxemia` },
  { metric: "heartRate", above: 130, level: "CRITICAL", message: (v: number) => `HR ${v} bpm — extreme tachycardia` },
  { metric: "heartRate", above: 110, level: "HIGH", message: (v: number) => `HR ${v} bpm — tachycardia` },
  { metric: "heartRate", below: 50, level: "HIGH", message: (v: number) => `HR ${v} bpm — bradycardia` },
  { metric: "activity", below: 200, level: "MEDIUM", message: () => `Very low activity — possible inactivity` },
];

// ---------- Helper: load vitals from localStorage ----------
function loadVitalsFromLocalStorage(): HealthData[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("hyposhield_vitals_history");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    }
  } catch (e) {
    console.error("Failed to parse vitals", e);
  }
  return [];
}

// ---------- Generate alerts from the most recent data point ----------
function generateAlertsFromVitals(vitals: HealthData[]): Alert[] {
  if (!vitals.length) return [];

  const latest = vitals[vitals.length - 1];
  const alerts: Alert[] = [];
  const timeStr = latest.timestamp.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }) + " IST";

  for (const rule of ALERT_RULES) {
    let triggered = false;
    let value = 0;
    if (rule.metric === "spo2" && latest.spo2 < rule.below!) {
      triggered = true;
      value = latest.spo2;
    } else if (rule.metric === "heartRate") {
      if (rule.above && latest.heartRate > rule.above) {
        triggered = true;
        value = latest.heartRate;
      } else if (rule.below && latest.heartRate < rule.below) {
        triggered = true;
        value = latest.heartRate;
      }
    } else if (rule.metric === "activity" && latest.activity < rule.below!) {
      triggered = true;
      value = latest.activity;
    }

    if (triggered) {
      alerts.push({
        name: "Sensor",               // Could be replaced with device label if stored
        id: "DEV-001",
        level: rule.level as Alert["level"],
        heartRate: latest.heartRate,
        spo2: latest.spo2,
        detail: rule.message(value),
        time: timeStr,
      });
      break; // Show only the most severe alert per reading
    }
  }

  return alerts;
}

// ---------- Style constants ----------
const levelColors = {
  CRITICAL: { bg: "rgba(239,68,68,0.15)", border: "#ef4444", text: "#ef4444", bar: "#ef4444" },
  HIGH: { bg: "rgba(245,158,11,0.12)", border: "#f59e0b", text: "#f59e0b", bar: "#f59e0b" },
  MEDIUM: { bg: "rgba(59,130,246,0.12)", border: "#3b82f6", text: "#3b82f6", bar: "#3b82f6" },
};

function Badge({ level }: { level: string }) {
  const c = levelColors[level as keyof typeof levelColors] || levelColors.MEDIUM;
  return (
    <span
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        padding: "2px 7px",
        letterSpacing: "0.08em",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {level}
    </span>
  );
}

function GaugeMeter({ score }: { score: number }) {
  const angle = -135 + (score / 100) * 270;
  return (
    <svg
      width="100%"
      height="auto"
      viewBox="0 0 120 80"
      preserveAspectRatio="xMidYMid meet"
      style={{ maxWidth: 120, flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="40%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      <path
        d="M 10 75 A 50 50 0 0 1 110 75"
        fill="none"
        stroke="#1e293b"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M 10 75 A 50 50 0 0 1 110 75"
        fill="none"
        stroke="url(#gaugeGrad)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray="157"
        strokeDashoffset="0"
        opacity="0.9"
      />
      <g transform={`rotate(${angle}, 60, 75)`}>
        <line x1="60" y1="75" x2="60" y2="35" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="60" cy="75" r="5" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
      </g>
    </svg>
  );
}

function HealthBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden", flex: 1 }}>
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: color,
          borderRadius: 3,
          transition: "width 1s ease",
        }}
      />
    </div>
  );
}

export default function Dashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Refresh alerts every 2 seconds from localStorage
  useEffect(() => {
    const refresh = () => {
      const vitals = loadVitalsFromLocalStorage();
      const newAlerts = generateAlertsFromVitals(vitals);
      setAlerts(newAlerts);
      setLastUpdate(new Date());
    };
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, []);

  // Count alerts by severity
  const criticalCount = alerts.filter(a => a.level === "CRITICAL").length;
  const highCount = alerts.filter(a => a.level === "HIGH").length;
  const mediumCount = alerts.filter(a => a.level === "MEDIUM").length;
  const totalPatients = 214; // Mock total
  const stableCount = totalPatients - (criticalCount + highCount + mediumCount);

  // Risk score (simple heuristic)
  const riskScore = Math.min(100, criticalCount * 30 + highCount * 15 + mediumCount * 5);

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }) + " IST";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#00000000",
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        color: "#e2e8f0",
        padding: "0 0 40px 0",
      }}
    >
      <style>
        {`
          .dashboard-container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
          .risk-banner { display: flex; align-items: center; gap: 28px; border: 1px solid #1e3a5f; border-radius: 14px; padding: 22px 28px; margin-top: 24px; flex-wrap: wrap; }
          .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-top: 16px; }
          .main-grid { display: grid; grid-template-columns: 1fr 320px; gap: 16px; margin-top: 16px; }
          .bottom-grid { display: grid; grid-template-columns: 1fr 320px; gap: 16px; margin-top: 16px; }
          .alert-row { border-top: 1px solid #131f30; padding: 14px 20px; display: flex; gap: 14px; align-items: flex-start; transition: background 0.2s; }
          .alert-row:hover { background: rgba(30, 41, 59, 0.3); }
          .review-btn { background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; color: #38bdf8; font-size: 10px; font-weight: 600; padding: 4px 12px; cursor: pointer; transition: all 0.2s; font-family: inherit; }
          .review-btn:hover { background: rgba(56, 189, 248, 0.2); border-color: #38bdf8; }
          .stat-card { transition: transform 0.2s; }
          .stat-card:hover { transform: translateY(-2px); }
          @media (max-width: 900px) { .main-grid, .bottom-grid { grid-template-columns: 1fr; gap: 16px; } .stats-grid { gap: 12px; } .risk-banner { padding: 18px 22px; gap: 20px; } }
          @media (max-width: 768px) { .dashboard-container { padding: 0 16px; } .stats-grid { grid-template-columns: repeat(2, 1fr); } .risk-banner { flex-direction: column; align-items: flex-start; } .risk-banner > div:first-child { align-self: center; } }
          @media (max-width: 480px) { .stats-grid { grid-template-columns: 1fr; } .alert-row { flex-direction: column; } .alert-row > div:first-child { width: 100%; height: 3px; } }
          .fade-in { animation: fadeIn 0.3s ease-in; }
          @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        `}
      </style>

      <div className="dashboard-container">
        {/* Risk Level Banner */}
        <div className="risk-banner">
          <GaugeMeter score={riskScore} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.18em", marginBottom: 4 }}>
              CURRENT RISK LEVEL
            </div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: "clamp(24px, 6vw, 34px)",
                fontWeight: 800,
                color: "#f59e0b",
                letterSpacing: "-0.02em",
                lineHeight: 1,
              }}
            >
              {riskScore > 70 ? "ELEVATED" : riskScore > 40 ? "MODERATE" : "LOW"}
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
              Score {riskScore} / 100 · based on latest sensor reading
            </div>
          </div>
          <div style={{ display: "flex", gap: "clamp(16px, 4vw, 32px)", flexWrap: "wrap" }}>
            {[
              [criticalCount.toString(), "CRITICAL", "#ef4444"],
              [highCount.toString(), "HIGH", "#f59e0b"],
              [mediumCount.toString(), "MEDIUM", "#3b82f6"],
              [stableCount.toString(), "STABLE", "#22c55e"],
            ].map(([n, l, c]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: "clamp(20px, 5vw, 26px)",
                    fontWeight: 700,
                    color: c,
                    fontFamily: "'Syne',sans-serif",
                  }}
                >
                  {n}
                </div>
                <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.12em", marginTop: 2 }}>
                  {l}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stats-grid">
          {[
            { label: "CRITICAL ALERTS", value: criticalCount.toString().padStart(2, "0"), color: "#ef4444", sub: "based on live data" },
            { label: "AVG RESPONSE TIME", value: "4.2", unit: "min", color: "#f59e0b", sub: "Target: < 5 min" },
            { label: "ALERTS RESOLVED", value: "18", color: "#22c55e", sub: "Last 12 hours" },
            { label: "PATIENTS MONITORED", value: "214", color: "#38bdf8", sub: "97.6% sensor active" },
          ].map(s => (
            <div key={s.label} className="stat-card fade-in">
              <div style={{ fontSize: "clamp(8px, 2vw, 9px)", color: "#475569", letterSpacing: "0.15em", marginBottom: 8 }}>
                {s.label}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                <span
                  style={{
                    fontSize: "clamp(28px, 6vw, 36px)",
                    fontWeight: 700,
                    color: s.color,
                    fontFamily: "'Syne',sans-serif",
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </span>
                {s.unit && (
                  <span style={{ fontSize: "clamp(12px, 3vw, 15px)", color: s.color, fontWeight: 600 }}>
                    {s.unit}
                  </span>
                )}
              </div>
              <div style={{ fontSize: "clamp(9px, 2vw, 11px)", color: "#475569", marginTop: 6 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="main-grid">
          {/* Active Alerts - Dynamic from localStorage */}
          <div style={{ background: "#0d1829", border: "1px solid #1e293b", borderRadius: 12, padding: "18px 0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 20px 16px",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: "clamp(13px, 3vw, 14px)",
                  fontWeight: 600,
                  color: "#e2e8f0",
                  fontFamily: "'Syne',sans-serif",
                }}
              >
                Active alerts — high priority
              </span>
              <span
                style={{
                  background: "#1e3a5f",
                  color: "#38bdf8",
                  borderRadius: 20,
                  padding: "3px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {alerts.length} active
              </span>
            </div>
            {alerts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", fontSize: 13 }}>
                No active alerts all vitals within normal ranges.
              </div>
            ) : (
              alerts.map((alert, idx) => {
                const c = levelColors[alert.level] || levelColors.MEDIUM;
                return (
                  <div key={idx} className="alert-row">
                    <div
                      style={{
                        width: 3,
                        borderRadius: 3,
                        background: c.bar,
                        alignSelf: "stretch",
                        flexShrink: 0,
                        minHeight: 60,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexWrap: "wrap",
                          marginBottom: 6,
                        }}
                      >
                        <span style={{ fontSize: "clamp(12px, 3vw, 13px)", fontWeight: 700, color: "#f1f5f9" }}>
                          {alert.name}
                        </span>
                        <span style={{ fontSize: 11, color: "#475569" }}>· {alert.id}</span>
                        <Badge level={alert.level} />
                      </div>
                      <div style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: "#64748b", lineHeight: 1.6 }}>
                        {alert.detail}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 16,
                          marginTop: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <span style={{ fontSize: 10, color: "#475569" }}>{alert.time}</span>
                        <button className="review-btn">Review</button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column - Risk Distribution & Alert Velocity */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "#0d1829", border: "1px solid #1e293b", borderRadius: 12, padding: 18 }}>
              <div
                style={{
                  fontSize: "clamp(13px, 3vw, 14px)",
                  fontWeight: 600,
                  fontFamily: "'Syne',sans-serif",
                  color: "#e2e8f0",
                  marginBottom: 14,
                }}
              >
                Risk distribution
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 14 }}>
                {[
                  ["CRITICAL", criticalCount, "#ef4444"],
                  ["HIGH", highCount, "#f59e0b"],
                  ["MEDIUM", mediumCount, "#3b82f6"],
                  ["STABLE", stableCount, "#22c55e"],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ background: "#131f30", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#475569", letterSpacing: "0.15em", marginBottom: 4 }}>{l}</div>
                    <div
                      style={{
                        fontSize: "clamp(20px, 5vw, 24px)",
                        fontWeight: 700,
                        color: c as string,
                        fontFamily: "'Syne',sans-serif",
                      }}
                    >
                      {v}
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                {[
                  ["#ef4444", (criticalCount / totalPatients) * 100],
                  ["#f59e0b", (highCount / totalPatients) * 100],
                  ["#3b82f6", (mediumCount / totalPatients) * 100],
                  ["#22c55e", (stableCount / totalPatients) * 100],
                ].map(([c, w], i) => (
                  <div key={i} style={{ width: `${w}%`, background: c as string }} />
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#475569" }}>
                {((criticalCount / totalPatients) * 100).toFixed(1)}% critical · {((highCount / totalPatients) * 100).toFixed(1)}% high ·{" "}
                {((mediumCount / totalPatients) * 100).toFixed(1)}% med · {((stableCount / totalPatients) * 100).toFixed(1)}% stable
              </div>
              <button className="review-btn" style={{ marginTop: 14, width: "100%", textAlign: "center" }}>
                Analyze risk trends ↗
              </button>
            </div>

            <div style={{ background: "#0d1829", border: "1px solid #1e293b", borderRadius: 12, padding: 18 }}>
              <div
                style={{
                  fontSize: "clamp(13px, 3vw, 14px)",
                  fontWeight: 600,
                  fontFamily: "'Syne',sans-serif",
                  color: "#e2e8f0",
                  marginBottom: 14,
                }}
              >
                Alert velocity
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                <div style={{ background: "#131f30", borderRadius: 8, padding: "14px", textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "clamp(22px, 5vw, 26px)",
                      fontWeight: 700,
                      color: "#ef4444",
                      fontFamily: "'Syne',sans-serif",
                    }}
                  >
                    +{criticalCount}
                  </div>
                  <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.12em", marginTop: 4 }}>CRITICAL NOW</div>
                </div>
                <div style={{ background: "#131f30", borderRadius: 8, padding: "14px", textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "clamp(22px, 5vw, 26px)",
                      fontWeight: 700,
                      color: "#f59e0b",
                      fontFamily: "'Syne',sans-serif",
                    }}
                  >
                    +{highCount + mediumCount}
                  </div>
                  <div style={{ fontSize: 10, color: "#475569", letterSpacing: "0.12em", marginTop: 4 }}>HIGH+MEDIUM</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid - Event Timeline & System Health */}
        <div className="bottom-grid">
          <div style={{ background: "#0d1829", border: "1px solid #1e293b", borderRadius: 12, padding: 18 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: "clamp(13px, 3vw, 14px)",
                  fontWeight: 600,
                  fontFamily: "'Syne',sans-serif",
                  color: "#e2e8f0",
                }}
              >
                Event timeline
              </span>
              <span style={{ background: "#1e293b", color: "#64748b", borderRadius: 6, padding: "2px 10px", fontSize: 10, fontWeight: 600 }}>
                last update {fmtTime(lastUpdate)}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {alerts.length > 0 ? (
                alerts.slice(0, 5).map((alert, i) => (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", paddingBottom: 14 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 3 }}>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          background: levelColors[alert.level].border,
                          flexShrink: 0,
                        }}
                      />
                      {i < alerts.length - 1 && <div style={{ width: 1, flex: 1, background: "#1e293b", minHeight: 24, marginTop: 4 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <span style={{ fontSize: "clamp(11px, 2.5vw, 12px)", fontWeight: 600, color: "#e2e8f0" }}>
                          {alert.level} alert — {alert.name}
                        </span>
                        <span style={{ fontSize: 11, color: "#475569" }}>{alert.time}</span>
                      </div>
                      <div style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: "#64748b", marginTop: 2 }}>{alert.detail}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>No recent events</div>
              )}
            </div>
          </div>

          <div style={{ background: "#0d1829", border: "1px solid #1e293b", borderRadius: 12, padding: 18 }}>
            <div
              style={{
                fontSize: "clamp(13px, 3vw, 14px)",
                fontWeight: 600,
                fontFamily: "'Syne',sans-serif",
                color: "#e2e8f0",
                marginBottom: 16,
              }}
            >
              System health
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "CGM sensor uptime", value: 97.6, color: "#22c55e" },
                { label: "Alert delivery rate", value: 99.1, color: "#22c55e" },
                { label: "API response health", value: 84.2, color: "#f59e0b" },
                { label: "Data sync coverage", value: 95.3, color: "#22c55e" },
              ].map(h => (
                <div key={h.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 4 }}>
                    <span style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: "#94a3b8" }}>{h.label}</span>
                    <span style={{ fontSize: "clamp(10px, 2.5vw, 11px)", fontWeight: 700, color: h.color }}>{h.value}%</span>
                  </div>
                  <HealthBar value={h.value} color={h.color} />
                </div>
              ))}
            </div>
            <div
              style={{
                background: "rgba(245,158,11,0.08)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 8,
                padding: "12px 14px",
                marginTop: 16,
              }}
            >
              <div style={{ fontSize: 10, color: "#f59e0b", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 5 }}>
                ⚠ API LATENCY WARNING
              </div>
              <div style={{ fontSize: "clamp(10px, 2.5vw, 11px)", color: "#94a3b8", lineHeight: 1.6 }}>
                Response times elevated — avg 1.4s vs target 0.8s. Monitoring.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}