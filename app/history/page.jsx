'use client';

import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from "recharts";

/* ─── Helpers ─────────────────────────────────────────────────── */
const formatDate = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  return {
    day: d.getDate().toString().padStart(2, "0"),
    month: d.toLocaleString("default", { month: "short" }).toUpperCase(),
    full: d.toLocaleDateString("default", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    }),
  };
};

const riskColor = (score) =>
  score < 34 ? "#00ff88" : score < 67 ? "#f5a623" : "#ff4d6d";

const badgeStyle = (risk) => {
  const map = {
    safe: { bg: "rgba(0,255,136,0.1)", color: "#00ff88" },
    moderate: { bg: "rgba(245,166,35,0.1)", color: "#f5a623" },
    high: { bg: "rgba(255,77,109,0.1)", color: "#ff4d6d" },
  };
  return map[risk] || map.safe;
};

const SEED_DATA = [
  {
    id: 1,
    date: "2026-04-06", time: "11:16:53",
    hr: 59, spo2: 98, steps: 496,
    avgHR: 77, minSpO2: 93,
    duration: "1m 30s", readings: 60,
    risk: "safe", score: 0,
    insight: "All vitals within normal range. You're doing great — keep it up!",
  },
];

const EMPTY_FORM = {
  date: "", time: "", hr: "", spo2: "", steps: "",
  avgHR: "", minSpO2: "", duration: "", readings: "",
  risk: "safe", score: "", insight: "",
};

/* ─── CSV Export ──────────────────────────────────────────────── */
const exportCSV = (records) => {
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

/* ─── Subcomponents ────────────────────────────────────────────── */

const VitalChip = ({ icon, value, unit }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 6,
    background: "#0d1515", border: "1px solid #1a2e2e",
    borderRadius: 8, padding: "6px 12px",
  }}>
    <span style={{ fontSize: 13 }}>{icon}</span>
    <span style={{ fontFamily: "monospace", fontSize: 13, color: "#00e5c4", fontWeight: 700 }}>
      {typeof value === "number" ? value.toLocaleString() : value}
    </span>
    {unit && <span style={{ fontSize: 10, color: "#4a7070", marginLeft: 2 }}>{unit}</span>}
  </div>
);

const StatusBadge = ({ risk }) => {
  const label = risk === "safe" ? "SAFE" : risk === "moderate" ? "MODERATE" : "HIGH RISK";
  const s = badgeStyle(risk);
  return (
    <span style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "5px 12px", borderRadius: 20,
      fontSize: 11, fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.5px",
      background: s.bg, color: s.color,
    }}>
      <span style={{ fontSize: 8 }}>●</span>{label}
    </span>
  );
};

const DetailItem = ({ label, value, unit, color }) => (
  <div style={{
    background: "#0d1515", border: "1px solid #1a2e2e",
    borderRadius: 10, padding: "12px 14px",
  }}>
    <div style={{ fontSize: 9, color: "#4a7070", fontFamily: "monospace", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>
      {label}
    </div>
    <div>
      <span style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: color || "#00e5c4" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
      {unit && <span style={{ fontSize: 11, color: "#4a7070", marginLeft: 4 }}>{unit}</span>}
    </div>
  </div>
);

/* ─── Chart View ──────────────────────────────────────────────── */
const ChartView = ({ records }) => {
  const data = [...records]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(r => ({
      date: r.date.slice(5),
      HR: r.hr,
      SpO2: r.spo2,
      AvgHR: r.avgHR,
      MinSpO2: r.minSpO2,
    }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "#111c1c", border: "1px solid #1a2e2e", borderRadius: 10, padding: "10px 14px" }}>
        <div style={{ fontSize: 11, fontFamily: "monospace", color: "#4a7070", marginBottom: 6 }}>{label}</div>
        {payload.map(p => (
          <div key={p.dataKey} style={{ fontSize: 13, fontFamily: "monospace", color: p.color, marginBottom: 2 }}>
            {p.dataKey}: <strong>{p.value}</strong>
          </div>
        ))}
      </div>
    );
  };

  if (data.length < 2) {
    return (
      <div style={{ textAlign: "center", padding: "40px 20px", color: "#4a7070", fontFamily: "monospace", fontSize: 13 }}>
        Add at least 2 records to see the trend chart.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, color: "#00e5c4", fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>
        // Live Trend — Heart Rate &amp; SpO₂
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid stroke="#1a2e2e" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="#4a7070" tick={{ fontFamily: "monospace", fontSize: 11 }} />
          <YAxis stroke="#4a7070" tick={{ fontFamily: "monospace", fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontFamily: "monospace", fontSize: 12 }} />
          <Line type="monotone" dataKey="HR" stroke="#00e5c4" strokeWidth={2} dot={{ r: 4, fill: "#00e5c4" }} />
          <Line type="monotone" dataKey="SpO2" stroke="#00ff88" strokeWidth={2} dot={{ r: 4, fill: "#00ff88" }} />
          <Line type="monotone" dataKey="AvgHR" stroke="#f5a623" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
          <Line type="monotone" dataKey="MinSpO2" stroke="#4a7070" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

/* ─── Record Card ─────────────────────────────────────────────── */
const RecordCard = ({ record, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const d = formatDate(record.date);

  return (
    <div style={{
      background: "#111c1c",
      border: `1px solid ${expanded ? "rgba(0,229,196,0.35)" : "#1a2e2e"}`,
      borderRadius: 14, overflow: "hidden",
      transition: "border-color 0.2s, box-shadow 0.2s",
      boxShadow: expanded ? "0 0 24px rgba(0,229,196,0.05)" : "none",
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
          background: "#0d1515", border: "1px solid #1a2e2e",
          borderRadius: 10, padding: "8px 14px", minWidth: 56,
        }}>
          <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "#00e5c4", lineHeight: 1 }}>
            {d.day}
          </span>
          <span style={{ fontSize: 10, color: "#4a7070", fontFamily: "monospace", letterSpacing: 1, marginTop: 3 }}>
            {d.month}
          </span>
        </div>

        {/* Meta */}
        <div style={{ flex: 1, minWidth: 120 }}>
          <div style={{ fontSize: 11, color: "#4a7070", fontFamily: "monospace", marginBottom: 4 }}>
            {d.full} · {record.time || "—"}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#cce8e4" }}>Daily Health Record</div>
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
          color: "#4a7070", fontSize: 14, marginLeft: 8,
          transform: expanded ? "rotate(180deg)" : "none",
          transition: "transform 0.2s", display: "inline-block",
        }}>▾</span>
      </div>

      {/* Expanded Body */}
      {expanded && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            padding: "0 20px 20px", borderTop: "1px solid #1a2e2e", paddingTop: 18,
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
          <div style={{ height: 4, background: "#0d1515", borderRadius: 2, overflow: "hidden", marginBottom: 14 }}>
            <div style={{
              height: "100%", borderRadius: 2,
              width: `${record.score}%`,
              background: riskColor(record.score),
              transition: "width 0.4s ease",
            }} />
          </div>

          {/* AI Insight */}
          <div style={{
            background: "rgba(0,229,196,0.04)", border: "1px solid rgba(0,229,196,0.15)",
            borderRadius: 10, padding: "12px 16px",
            display: "flex", alignItems: "flex-start", gap: 10,
          }}>
            <span style={{ fontSize: 10, fontFamily: "monospace", color: "#00e5c4", letterSpacing: 1, whiteSpace: "nowrap" }}>
              AI INSIGHT
            </span>
            <span style={{ fontSize: 13, color: "#cce8e4", opacity: 0.8, lineHeight: 1.5 }}>
              {record.insight}
            </span>
          </div>

          {/* Delete */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button
              onClick={() => onDelete(record.id)}
              style={{
                background: "transparent", border: "1px solid rgba(255,77,109,0.3)",
                color: "rgba(255,77,109,0.6)", borderRadius: 7, padding: "6px 14px",
                fontSize: 11, fontFamily: "monospace", cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.target.style.borderColor = "#ff4d6d"; e.target.style.color = "#ff4d6d"; }}
              onMouseLeave={e => { e.target.style.borderColor = "rgba(255,77,109,0.3)"; e.target.style.color = "rgba(255,77,109,0.6)"; }}
            >
              ✕ DELETE RECORD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ─── Add Record Form ─────────────────────────────────────────── */
const AddForm = ({ onSave, onCancel }) => {
  const [form, setForm] = useState({ ...EMPTY_FORM });

  useEffect(() => {
    const now = new Date();
    setForm(f => ({
      ...f,
      date: now.toISOString().split("T")[0],
      time: now.toTimeString().slice(0, 5),
    }));
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.date || !form.hr || !form.spo2) {
      alert("Date, Heart Rate, and SpO₂ are required.");
      return;
    }
    onSave({
      id: Date.now(),
      date: form.date, time: form.time,
      hr: +form.hr, spo2: +form.spo2,
      steps: +form.steps || 0,
      avgHR: +form.avgHR || +form.hr,
      minSpO2: +form.minSpO2 || +form.spo2,
      duration: form.duration || "—",
      readings: +form.readings || 0,
      risk: form.risk,
      score: +form.score || 0,
      insight: form.insight || "No insight recorded.",
    });
  };

  const inputStyle = {
    width: "100%", background: "#0d1515",
    border: "1px solid #1a2e2e", borderRadius: 8,
    padding: "9px 12px", color: "#cce8e4",
    fontFamily: "'DM Sans', sans-serif", fontSize: 14,
    outline: "none",
  };
  const labelStyle = {
    display: "block", fontSize: 10, color: "#4a7070",
    fontFamily: "monospace", letterSpacing: 1,
    textTransform: "uppercase", marginBottom: 6,
  };

  const fields = [
    { label: "Date", key: "date", type: "date" },
    { label: "Time", key: "time", type: "time" },
    { label: "Heart Rate (bpm)", key: "hr", type: "number", placeholder: "e.g. 72" },
    { label: "SpO₂ (%)", key: "spo2", type: "number", placeholder: "e.g. 98" },
    { label: "Steps", key: "steps", type: "number", placeholder: "e.g. 4500" },
    { label: "Avg HR (bpm)", key: "avgHR", type: "number", placeholder: "e.g. 77" },
    { label: "Min SpO₂ (%)", key: "minSpO2", type: "number", placeholder: "e.g. 93" },
    { label: "Session Duration", key: "duration", type: "text", placeholder: "e.g. 1m 30s" },
    { label: "Readings Taken", key: "readings", type: "number", placeholder: "e.g. 60" },
    { label: "Risk Score (0-100)", key: "score", type: "number", placeholder: "e.g. 0" },
  ];

  return (
    <div style={{
      background: "#111c1c", border: "1px solid #1a2e2e",
      borderRadius: 14, padding: 22, marginBottom: 24,
      animation: "slideDown 0.2s ease",
    }}>
      <style>{`@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={{ fontSize: 11, color: "#00e5c4", fontFamily: "monospace", letterSpacing: 2, textTransform: "uppercase", marginBottom: 18 }}>
        // New Daily Record
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 14 }}>
        {fields.map(f => (
          <div key={f.key}>
            <label style={labelStyle}>{f.label}</label>
            <input
              style={inputStyle} type={f.type}
              placeholder={f.placeholder}
              value={form[f.key]}
              onChange={e => set(f.key, e.target.value)}
            />
          </div>
        ))}
        <div>
          <label style={labelStyle}>Risk Level</label>
          <select style={inputStyle} value={form.risk} onChange={e => set("risk", e.target.value)}>
            <option value="safe">Safe</option>
            <option value="moderate">Moderate</option>
            <option value="high">High Risk</option>
          </select>
        </div>
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>AI Insight</label>
        <input
          style={{ ...inputStyle, width: "100%" }}
          type="text"
          placeholder="e.g. All vitals within normal range..."
          value={form.insight}
          onChange={e => set("insight", e.target.value)}
        />
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={handleSave} style={{
          background: "#00e5c4", color: "#0a0f0f",
          border: "none", borderRadius: 8, padding: "9px 20px",
          fontFamily: "monospace", fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>
          SAVE RECORD
        </button>
        <button onClick={onCancel} style={{
          background: "transparent", color: "#4a7070",
          border: "1px solid #1a2e2e", borderRadius: 8, padding: "9px 20px",
          fontFamily: "monospace", fontSize: 12, cursor: "pointer",
        }}>
          CANCEL
        </button>
      </div>
    </div>
  );
};

/* ─── Main App ────────────────────────────────────────────────── */
export default function HypoShieldHistory() {
  const [records, setRecords] = useState(() => {
    try {
      const saved = localStorage.getItem("hypoRecords");
      return saved ? JSON.parse(saved) : SEED_DATA;
    } catch { return SEED_DATA; }
  });
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("list"); // "list" | "chart"

  useEffect(() => {
    try { localStorage.setItem("hypoRecords", JSON.stringify(records)); } catch {}
  }, [records]);

  const addRecord = (rec) => {
    setRecords(r => [rec, ...r]);
    setShowForm(false);
  };

  const deleteRecord = (id) => setRecords(r => r.filter(x => x.id !== id));

  const filtered = filter === "all" ? records : records.filter(r => r.risk === filter);

  const btnBase = {
    background: "transparent", border: "1px solid #1a2e2e",
    borderRadius: 20, padding: "5px 14px",
    fontSize: 12, fontFamily: "monospace", cursor: "pointer",
    transition: "all 0.15s",
  };
  const btnActive = { ...btnBase, borderColor: "#00e5c4", color: "#00e5c4", background: "rgba(0,229,196,0.06)" };
  const btnInactive = { ...btnBase, color: "#4a7070" };

  return (
    <div style={{
      background: "#0a0f0f", color: "#cce8e4",
      fontFamily: "'DM Sans', sans-serif",
      minHeight: "100vh", padding: 24,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
        select option { background: #111c1c; }
      `}</style>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 28, paddingBottom: 18, borderBottom: "1px solid #1a2e2e",
        flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <span style={{ fontFamily: "monospace", fontSize: 20, fontWeight: 700, color: "#00e5c4" }}>
            HypoShield
          </span>
          <span style={{ color: "#cce8e4", opacity: 0.4, fontFamily: "monospace", fontSize: 13, marginLeft: 10 }}>
            | Patient History
          </span>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => exportCSV(records)}
            style={{
              background: "transparent", border: "1px solid #1a2e2e",
              color: "#4a7070", borderRadius: 8, padding: "9px 16px",
              fontFamily: "monospace", fontSize: 12, cursor: "pointer",
            }}
          >
            ↓ EXPORT CSV
          </button>
          <button
            onClick={() => setShowForm(v => !v)}
            style={{
              background: "#00e5c4", color: "#0a0f0f",
              border: "none", borderRadius: 8, padding: "9px 18px",
              fontFamily: "monospace", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            ＋ ADD RECORD
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && <AddForm onSave={addRecord} onCancel={() => setShowForm(false)} />}

      {/* Filter + View toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#4a7070", fontFamily: "monospace", letterSpacing: 1 }}>FILTER:</span>
        {["all", "safe", "moderate", "high"].map(f => (
          <button key={f} style={filter === f ? btnActive : btnInactive} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f === "high" ? "High Risk" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "#4a7070", fontFamily: "monospace" }}>
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </span>
        <div style={{ display: "flex", gap: 6, marginLeft: 16 }}>
          <button style={view === "list" ? btnActive : btnInactive} onClick={() => setView("list")}>☰ LIST</button>
          <button style={view === "chart" ? btnActive : btnInactive} onClick={() => setView("chart")}>📈 CHART</button>
        </div>
      </div>

      {/* Chart View */}
      {view === "chart" && (
        <div style={{ background: "#111c1c", border: "1px solid #1a2e2e", borderRadius: 14, padding: 24, marginBottom: 24 }}>
          <ChartView records={filtered} />
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#4a7070", fontFamily: "monospace", fontSize: 13 }}>
              <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.4 }}>📋</div>
              No records found for this filter.
            </div>
          ) : (
            filtered.map(r => <RecordCard key={r.id} record={r} onDelete={deleteRecord} />)
          )}
        </div>
      )}
    </div>
  );
}
