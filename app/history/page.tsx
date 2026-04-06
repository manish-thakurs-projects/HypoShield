'use client';

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from "recharts";
import { calculateRisk } from "@/components/RiskIndicator"; // adjust import path as needed

/* ─── Types (match HealthData from useBluetooth) ─────────────── */
interface HealthData {
  heartRate: number;
  spo2: number;
  activity: number;
  timestamp: Date;
}

interface HistoryRecord {
  id: number;
  date: string;
  time: string;
  hr: number;
  spo2: number;
  steps: number;
  avgHR: number;
  minSpO2: number;
  duration: string;
  readings: number;
  risk: "safe" | "moderate" | "high";
  score: number;
  insight: string;
}

/* ─── Helpers ─────────────────────────────────────────────────── */
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return {
    day: d.getDate().toString().padStart(2, "0"),
    month: d.toLocaleString("default", { month: "short" }).toUpperCase(),
    full: d.toLocaleDateString("default", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    }),
  };
};

const riskColor = (score: number) =>
  score < 34 ? "#22c55e" : score < 67 ? "#f59e0b" : "#ef4444";

const badgeStyle = (risk: string) => {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    safe: { bg: "rgba(34,197,94,0.12)", color: "#22c55e", border: "#22c55e" },
    moderate: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "#f59e0b" },
    high: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", border: "#ef4444" },
  };
  return map[risk] || map.safe;
};

// Generate an AI insight based on vitals and risk level
function generateInsight(hr: number, spo2: number, steps: number, riskLevel: string): string {
  if (riskLevel === "high") {
    if (hr > 110) return "Heart rate elevated above 110 bpm. Consider rest and hydration.";
    if (spo2 < 90) return "SpO₂ critically low (<90%). Seek medical attention immediately.";
    return "High risk detected – monitor closely and consult a physician.";
  }
  if (riskLevel === "moderate") {
    if (hr > 95) return "Heart rate slightly elevated. Deep breathing may help.";
    if (spo2 < 94) return "Oxygen saturation borderline. Ensure good ventilation.";
    return "Moderate risk – some values outside optimal range.";
  }
  return "All vitals within normal range. You're doing great – keep it up!";
}

/* ─── Load vitals from localStorage and transform ────────────── */
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

function vitalsToHistoryRecords(vitals: HealthData[]): HistoryRecord[] {
  return vitals.map((v, idx) => {
    const risk = calculateRisk(v);
    const riskLevel = risk.level === "HIGH RISK" ? "high" : risk.level === "MODERATE" ? "moderate" : "safe";
    const score = risk.score;
    const dateStr = v.timestamp.toISOString().split("T")[0];
    const timeStr = v.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    return {
      id: v.timestamp.getTime(),
      date: dateStr,
      time: timeStr,
      hr: v.heartRate,
      spo2: v.spo2,
      steps: v.activity,
      avgHR: v.heartRate,      // single reading
      minSpO2: v.spo2,
      duration: "1 reading",
      readings: 1,
      risk: riskLevel as "safe" | "moderate" | "high",
      score: score,
      insight: generateInsight(v.heartRate, v.spo2, v.activity, riskLevel),
    };
  }).sort((a, b) => b.id - a.id); // newest first
}

/* ─── CSV Export ──────────────────────────────────────────────── */
const exportCSV = (records: HistoryRecord[]) => {
  const headers = [
    "Date","Time","HR (bpm)","SpO2 (%)","Steps",
    "Avg HR","Min SpO2","Duration","Readings","Risk","Score","Insight"
  ];
  const rows = records.map(r => [
    r.date, r.time, r.hr, r.spo2, r.steps,
    r.avgHR, r.minSpO2, r.duration, r.readings,
    r.risk, r.score, `"${r.insight}"`
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "hyposhield_history.csv"; a.click();
  URL.revokeObjectURL(url);
};

/* ─── Subcomponents (unchanged except props) ─────────────────── */
const VitalChip = ({ icon, value, unit }: { icon: string; value: number; unit?: string }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 6,
    background: "#0f172a", border: "1px solid #1e293b",
    borderRadius: 8, padding: "6px 12px",
  }}>
    <span style={{ fontSize: 13 }}>{icon}</span>
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "#38bdf8", fontWeight: 700 }}>
      {value.toLocaleString()}
    </span>
    {unit && <span style={{ fontSize: 10, color: "#64748b", marginLeft: 2 }}>{unit}</span>}
  </div>
);

const StatusBadge = ({ risk }: { risk: string }) => {
  const label = risk === "safe" ? "SAFE" : risk === "moderate" ? "MODERATE" : "HIGH RISK";
  const s = badgeStyle(risk);
  return (
    <span style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "4px 12px", borderRadius: 20,
      fontSize: 11, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.5px",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      <span style={{ fontSize: 8 }}>●</span>{label}
    </span>
  );
};

const DetailItem = ({ label, value, unit, color }: { label: string; value: number | string; unit?: string; color?: string }) => (
  <div style={{
    background: "#0f172a", border: "1px solid #1e293b",
    borderRadius: 10, padding: "12px 14px",
  }}>
    <div style={{ fontSize: 9, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>
      {label}
    </div>
    <div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: color || "#38bdf8" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
      {unit && <span style={{ fontSize: 11, color: "#64748b", marginLeft: 4 }}>{unit}</span>}
    </div>
  </div>
);

const ChartView = ({ records }: { records: HistoryRecord[] }) => {
  const data = [...records]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(r => ({
      date: r.date.slice(5),
      HR: r.hr,
      SpO2: r.spo2,
      AvgHR: r.avgHR,
      MinSpO2: r.minSpO2,
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 14px" }}>
        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: "#64748b", marginBottom: 6 }}>{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: p.color, marginBottom: 2 }}>
            {p.dataKey}: <strong>{p.value}</strong>
          </div>
        ))}
      </div>
    );
  };

  if (data.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
        Add at least 2 records to see the trend chart.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, color: "#38bdf8", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
        // Live Trend — Heart Rate & SpO₂
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#64748b" tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }} />
          <YAxis stroke="#64748b" tick={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} />
          <Line type="monotone" dataKey="HR" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4, fill: "#38bdf8" }} />
          <Line type="monotone" dataKey="SpO2" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: "#22c55e" }} />
          <Line type="monotone" dataKey="AvgHR" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
          <Line type="monotone" dataKey="MinSpO2" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const RecordCard = ({ record, onDelete }: { record: HistoryRecord; onDelete: (id: number) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const d = formatDate(record.date);

  return (
    <div style={{
      background: "#0d1829",
      border: `1px solid ${expanded ? "#1e3a5f" : "#1e293b"}`,
      borderRadius: 14, overflow: "hidden",
      transition: "border-color 0.2s, box-shadow 0.2s",
      boxShadow: expanded ? "0 0 24px rgba(56,189,248,0.05)" : "none",
    }}>
      {/* Header Row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", gap: 16,
          padding: "16px 20px", cursor: "pointer",
          flexWrap: "wrap",
        }}
      >
        {/* Date Block */}
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          background: "#0f172a", border: "1px solid #1e293b",
          borderRadius: 10, padding: "8px 14px", minWidth: 56,
        }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700, color: "#38bdf8", lineHeight: 1 }}>
            {d.day}
          </span>
          <span style={{ fontSize: 10, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginTop: 3 }}>
            {d.month}
          </span>
        </div>

        {/* Meta */}
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
            {d.full} · {record.time || "—"}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>Health Reading</div>
        </div>

        {/* Vitals */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <VitalChip icon="♥" value={record.hr} unit="bpm" />
          <VitalChip icon="O₂" value={record.spo2} unit="%" />
          <VitalChip icon="👟" value={record.steps} unit="steps" />
          <StatusBadge risk={record.risk} />
        </div>

        {/* Chevron */}
        <span style={{
          color: "#64748b", fontSize: 14, marginLeft: 8,
          transform: expanded ? "rotate(180deg)" : "none",
          transition: "transform 0.2s", display: "inline-block",
        }}>▾</span>
      </div>

      {/* Expanded Body */}
      {expanded && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            padding: "0 20px 20px", borderTop: "1px solid #1e293b", paddingTop: 18,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: 12, marginBottom: 16,
          }}>
            <DetailItem label="Heart Rate" value={record.hr} unit="bpm" />
            <DetailItem label="SpO₂" value={record.spo2} unit="%" />
            <DetailItem label="Steps" value={record.steps} />
            <DetailItem label="Avg Heart Rate" value={record.avgHR} unit="bpm" />
            <DetailItem label="Min SpO₂" value={record.minSpO2} unit="%" />
            <DetailItem label="Session" value={record.duration} />
            <DetailItem label="Readings" value={record.readings} />
            <DetailItem label="Risk Score" value={record.score} unit="/100" color={riskColor(record.score)} />
          </div>

          {/* Risk bar */}
          <div style={{ height: 4, background: "#0f172a", borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${record.score}%`,
              background: riskColor(record.score),
              transition: "width 0.4s ease",
            }} />
          </div>

          {/* AI Insight */}
          <div style={{
            background: "rgba(56,189,248,0.04)", border: "1px solid rgba(56,189,248,0.15)",
            borderRadius: 10, padding: "12px 16px",
            display: "flex", alignItems: "flex-start", gap: 10, flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "#38bdf8", letterSpacing: 1 }}>
              AI INSIGHT
            </span>
            <span style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>
              {record.insight}
            </span>
          </div>

          {/* Delete (only for local removal, does not affect original vitals) */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button
              onClick={() => onDelete(record.id)}
              style={{
                background: "transparent", border: "1px solid rgba(239,68,68,0.3)",
                color: "#ef4444", borderRadius: 7, padding: "6px 14px",
                fontSize: 11, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer",
                transition: "all 0.15s", opacity: 0.7,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.borderColor = "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "0.7"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
            >
              ✕ HIDE FROM VIEW
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────────────── */
export default function HypoShieldHistory() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"list" | "chart">("list");

  // Load vitals from localStorage and convert to records
  const refreshData = () => {
    const vitals = loadVitalsFromLocalStorage();
    const newRecords = vitalsToHistoryRecords(vitals);
    setRecords(newRecords);
  };

  useEffect(() => {
    refreshData();
    // Optional: listen for storage changes from other tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "hyposhield_vitals_history") refreshData();
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Delete record – only hides from UI (does not remove from original vitals storage)
  const deleteRecord = (id: number) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  };

  const filtered = filter === "all" ? records : records.filter(r => r.risk === filter);

  const btnBase = {
    background: "transparent", border: "1px solid #1e293b",
    borderRadius: 20, padding: "5px 14px",
    fontSize: 12, fontFamily: "'JetBrains Mono', monospace", cursor: "pointer",
    transition: "all 0.15s", color: "#64748b",
  };
  const btnActive = { ...btnBase, borderColor: "#38bdf8", color: "#38bdf8", background: "rgba(56,189,248,0.06)" };
  const btnInactive = { ...btnBase, color: "#64748b" };

  return (
    <div style={{
      background: "#00000000",
      fontFamily: "'DM Sans', sans-serif",
      minHeight: "100vh", padding: 24,
    }}>
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (max-width: 640px) {
            .history-header {
              flex-direction: column;
              align-items: flex-start;
            }
            .filter-bar {
              flex-wrap: wrap;
            }
          }
        `}
      </style>

      {/* Header */}
      <div className="history-header" style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 28, paddingBottom: 18, borderBottom: "1px solid #1e293b",
        flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: "#38bdf8" }}>
            HypoShield
          </span>
          <span style={{ color: "#64748b", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, marginLeft: 10 }}>
            | Sensor History
          </span>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => exportCSV(filtered)}
            style={{
              background: "transparent", border: "1px solid #1e293b",
              color: "#64748b", borderRadius: 8, padding: "9px 16px",
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.color = "#38bdf8"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e293b"; e.currentTarget.style.color = "#64748b"; }}
          >
            ↓ EXPORT CSV
          </button>
        </div>
      </div>

      {/* Filter + View toggle */}
      <div className="filter-bar" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1 }}>FILTER:</span>
        {["all", "safe", "moderate", "high"].map(f => (
          <button key={f} style={filter === f ? btnActive : btnInactive} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f === "high" ? "High Risk" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#64748b", fontFamily: "'JetBrains Mono', monospace" }}>
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display: "flex", gap: 6, marginLeft: 16 }}>
          <button style={view === "list" ? btnActive : btnInactive} onClick={() => setView("list")}>☰ LIST</button>
          <button style={view === "chart" ? btnActive : btnInactive} onClick={() => setView("chart")}>📈 CHART</button>
        </div>
      </div>

      {/* Chart View */}
      {view === "chart" && (
        <div style={{ background: "#0d1829", border: "1px solid #1e293b", borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <ChartView records={filtered} />
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b", fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.4 }}>📋</div>
              No sensor readings found. Please connect a device or start the demo mode.
            </div>
          ) : (
            filtered.map(r => <RecordCard key={r.id} record={r} onDelete={deleteRecord} />)
          )}
        </div>
      )}
    </div>
  );
}