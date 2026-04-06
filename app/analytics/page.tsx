'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  CartesianGrid, Cell,
} from 'recharts';
import { useBluetooth, HealthData } from '@/hooks/useBluetooth';
import { calculateRisk } from '@/components/RiskIndicator';

type TimeRange = '1m' | '5m' | '10m' | 'all';

const HR_ZONES = [
  { label: 'Rest',    min: 0,   max: 59,  color: '#00ff88' },
  { label: 'Light',   min: 60,  max: 74,  color: '#4d9fff' },
  { label: 'Aerobic', min: 75,  max: 89,  color: '#ffb300' },
  { label: 'Cardio',  min: 90,  max: 104, color: '#ff7a40' },
  { label: 'Max',     min: 105, max: 999, color: '#ff3d5a' },
];

function avg(arr: number[]) {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

const CustomTooltip = ({ active, payload, label, unit }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs font-mono"
      style={{ backgroundColor: '#0d1425ee', border: '1px solid #1a2a45', backdropFilter: 'blur(8px)' }}>
      <div className="text-slate-500 mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: <strong>{Math.round(p.value)}{unit}</strong>
        </div>
      ))}
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaColor?: string;
  accentColor: string;
}

function StatCard({ label, value, unit, delta, deltaColor, accentColor }: StatCardProps) {
  return (
    <div className="card-glass rounded-2xl p-4 stat-card relative overflow-hidden"
      style={{ borderColor: `${accentColor}22` }}>
      <div className="text-xs font-display font-semibold uppercase tracking-widest mb-2"
        style={{ color: `${accentColor}80` }}>{label}</div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="font-mono font-bold text-3xl" style={{ color: accentColor }}>{value}</span>
        {unit && <span className="font-display text-sm" style={{ color: `${accentColor}60` }}>{unit}</span>}
      </div>
      {delta && (
        <div className="text-xs font-mono" style={{ color: deltaColor || '#4a6080' }}>{delta}</div>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{ background: `linear-gradient(90deg, ${accentColor}60, transparent)` }} />
    </div>
  );
}

interface TrendChartProps {
  data: HealthData[];
  dataKey: keyof Pick<HealthData, 'heartRate' | 'spo2' | 'activity'>;
  color: string;
  label: string;
  unit: string;
  subtitle: string;
  yMin?: number;
  yMax?: number;
  refLine?: { y: number; color: string; label: string };
  annotations?: { text: string; color: string }[];
  stats: { label: string; value: string | number; color: string }[];
}

function TrendChart({ data, dataKey, color, label, unit, subtitle, yMin, yMax, refLine, annotations, stats }: TrendChartProps) {
  const chartData = data.map((d) => ({
    time: d.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    value: d[dataKey] as number,
  }));

  return (
    <div className="card-glass rounded-2xl p-5 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs font-display font-semibold uppercase tracking-widest mb-1"
            style={{ color: `${color}60` }}>{label}</div>
          <div className="text-base font-display font-bold text-slate-200">
            {label} Trend <span className="text-slate-600 font-normal text-sm">{subtitle}</span>
          </div>
        </div>
        <div className="flex gap-4">
          {stats.map((s) => (
            <div key={s.label} className="text-right">
              <div className="text-xs font-display uppercase tracking-widest text-slate-600 mb-0.5">{s.label}</div>
              <div className="font-mono text-sm font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,42,69,.4)" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#2a3a55', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis domain={[yMin ?? 'auto', yMax ?? 'auto']}
              tick={{ fill: '#2a3a55', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip unit={unit} />} />
            {refLine && (
              <ReferenceLine y={refLine.y} stroke={refLine.color}
                strokeDasharray="4 4" strokeOpacity={0.5}
                label={{ value: refLine.label, fill: refLine.color, fontSize: 9, fontFamily: 'JetBrains Mono' }} />
            )}
            <Area type="monotone" dataKey="value" name={label} stroke={color} strokeWidth={2}
              fill={`url(#grad-${dataKey})`} dot={false}
              activeDot={{ r: 4, fill: color, strokeWidth: 0 }} animationDuration={300} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Annotations */}
      {annotations && annotations.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {annotations.map((ann, i) => (
            <span key={i} className="text-xs px-3 py-1 rounded-full font-display font-semibold"
              style={{ color: ann.color, background: `${ann.color}12`, border: `1px solid ${ann.color}25` }}>
              {ann.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function HRZoneChart({ data }: { data: HealthData[] }) {
  const zoneCounts = HR_ZONES.map((z) => ({
    ...z,
    count: data.filter((d) => d.heartRate >= z.min && d.heartRate <= z.max).length,
  }));
  const total = zoneCounts.reduce((a, b) => a + b.count, 0) || 1;
  const barData = zoneCounts.map((z) => ({ ...z, pct: Math.round((z.count / total) * 100) }));

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="text-xs font-display font-semibold uppercase tracking-widest mb-1"
        style={{ color: 'rgba(77,159,255,.5)' }}>Distribution</div>
      <div className="text-base font-display font-bold text-slate-200 mb-4">HR Zone Breakdown</div>

      {/* Heat cells */}
      <div className="flex gap-1.5 mb-1">
        {barData.map((z) => (
          <div key={z.label} className="flex-1 text-center text-[9px] font-display font-bold uppercase tracking-wider"
            style={{ color: z.color }}>{z.label}</div>
        ))}
      </div>
      <div className="flex gap-1.5 mb-4">
        {barData.map((z) => {
          const alpha = 0.15 + (z.count / Math.max(...barData.map(b => b.count || 1))) * 0.7;
          return (
            <div key={z.label} className="flex-1 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold"
              style={{ backgroundColor: `${z.color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`, color: z.color }}>
              {z.pct}%
            </div>
          );
        })}
      </div>

      {/* Bar chart */}
      {barData.map((z) => (
        <div key={z.label} className="flex items-center gap-2 mb-2">
          <div className="w-14 text-right text-[9px] font-display font-bold uppercase" style={{ color: z.color }}>{z.label}</div>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(26,42,69,.5)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${z.pct}%`, backgroundColor: z.color }} />
          </div>
          <div className="w-7 text-[9px] font-mono text-slate-600">{z.count}</div>
        </div>
      ))}
    </div>
  );
}

function RiskTimeline({ data }: { data: HealthData[] }) {
  const riskColors = { SAFE: '#00ff8888', MODERATE: '#ffb30088', 'HIGH RISK': '#ff3d5aaa' };
  const slice = data.slice(-80);

  const counts = {
    safe: data.filter((d) => calculateRisk(d).level === 'SAFE').length,
    mod: data.filter((d) => calculateRisk(d).level === 'MODERATE').length,
    high: data.filter((d) => calculateRisk(d).level === 'HIGH RISK').length,
  };

  return (
    <div className="card-glass rounded-2xl p-5">
      <div className="text-xs font-display font-semibold uppercase tracking-widest mb-1"
        style={{ color: 'rgba(255,61,90,.5)' }}>Timeline</div>
      <div className="text-base font-display font-bold text-slate-200 mb-4">Risk Level History</div>

      <div className="flex gap-0.5 h-4 rounded-lg overflow-hidden mb-1">
        {slice.map((d, i) => {
          const risk = calculateRisk(d);
          const c = risk.level === 'SAFE' ? '#00ff88' : risk.level === 'MODERATE' ? '#ffb300' : '#ff3d5a';
          return <div key={i} className="flex-1 rounded-sm" style={{ backgroundColor: c + '80' }} />;
        })}
      </div>
      <div className="flex justify-between text-[9px] font-mono text-slate-700 mb-4">
        <span>Oldest</span><span>Most Recent</span>
      </div>

      <div className="flex gap-4 flex-wrap">
        {[
          { label: 'SAFE', count: counts.safe, color: '#00ff88' },
          { label: 'MODERATE', count: counts.mod, color: '#ffb300' },
          { label: 'HIGH RISK', count: counts.high, color: '#ff3d5a' },
        ].map((r) => (
          <div key={r.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: r.color }} />
            <span className="text-xs font-display font-bold" style={{ color: r.color }}>{r.label}</span>
            <span className="text-xs font-mono" style={{ color: '#2a3a45' }}>{r.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const bluetooth = useBluetooth();
  const [timeRange, setTimeRange] = useState<TimeRange>('1m');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!bluetooth.isConnected) bluetooth.simulateData();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const windowedData = useMemo(() => {
    const h = bluetooth.history;
    if (timeRange === '1m') return h.slice(-40);
    if (timeRange === '5m') return h.slice(-Math.min(h.length, 80));
    if (timeRange === '10m') return h.slice(-Math.min(h.length, 100));
    return h;
  }, [bluetooth.history, timeRange]);

  const hrVals   = windowedData.map((d) => d.heartRate);
  const spo2Vals = windowedData.map((d) => d.spo2);
  const actVals  = windowedData.map((d) => d.activity);
  const riskEvents = windowedData.filter((d) => calculateRisk(d).level === 'HIGH RISK').length;

  const hrPct = windowedData.length ? Math.round((avg(hrVals) - 75) / 75 * 100) : 0;

  return (
    <div>
      <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto">
        {/* Page title + range selector */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-2xl font-display font-extrabold text-slate-100">Health Analytics</h1>
            <p className="text-sm text-slate-600 mt-0.5 font-body">
              Real-time trends · {bluetooth.deviceName ?? 'HypoShield (Demo)'} · ESP32 BLE
            </p>
          </div>
          <div className="flex gap-1.5">
            {(['1m', '5m', '10m', 'all'] as TimeRange[]).map((r) => (
              <button key={r} onClick={() => setTimeRange(r)}
                className="text-xs px-3 py-1.5 rounded-lg font-display font-bold uppercase transition-all duration-150"
                style={{
                  background: timeRange === r ? 'rgba(0,229,255,.12)' : 'rgba(13,20,37,.8)',
                  border: timeRange === r ? '1px solid rgba(0,229,255,.3)' : '1px solid rgba(26,42,69,.8)',
                  color: timeRange === r ? '#00e5ff' : '#3a5070',
                }}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatCard label="Avg Heart Rate" value={avg(hrVals) || '—'} unit="bpm" accentColor="#00e5ff"
            delta={hrVals.length ? `${hrPct > 0 ? '+' : ''}${hrPct}% vs baseline` : '—'}
            deltaColor={hrPct > 5 ? '#ff3d5a' : hrPct < -5 ? '#00ff88' : '#4a6080'} />
          <StatCard label="Avg SpO₂" value={avg(spo2Vals) || '—'} unit="%" accentColor="#00ff88"
            delta={avg(spo2Vals) >= 96 ? 'Optimal range' : avg(spo2Vals) >= 94 ? 'Fair range' : 'Below normal'}
            deltaColor={avg(spo2Vals) >= 96 ? '#00ff88' : avg(spo2Vals) >= 94 ? '#ffb300' : '#ff3d5a'} />
          <StatCard label="Avg Activity" value={avg(actVals) || '—'} unit="steps" accentColor="#ffb300"
            delta={avg(actVals) > 1500 ? 'High intensity' : avg(actVals) > 800 ? 'Medium intensity' : 'Low intensity'}
            deltaColor={avg(actVals) > 1500 ? '#ff3d5a' : avg(actVals) > 800 ? '#ffb300' : '#00ff88'} />
          <StatCard label="Risk Events" value={riskEvents} unit="alerts" accentColor="#4d9fff"
            delta={windowedData.length ? `${Math.round(riskEvents / windowedData.length * 100)}% of session` : '—'}
            deltaColor={riskEvents > windowedData.length * 0.2 ? '#ff3d5a' : riskEvents > 0 ? '#ffb300' : '#00ff88'} />
        </div>

        {/* HR Chart */}
        <TrendChart data={windowedData} dataKey="heartRate" color="#00e5ff"
          label="Heart Rate" unit=" bpm" subtitle="— beats per minute"
          yMin={45} yMax={130}
          refLine={{ y: 95, color: '#ffb300', label: 'threshold' }}
          stats={[
            { label: 'Min', value: hrVals.length ? Math.min(...hrVals) : '—', color: '#00ff88' },
            { label: 'Max', value: hrVals.length ? Math.max(...hrVals) : '—', color: '#ff3d5a' },
            { label: 'Now', value: hrVals[hrVals.length - 1] ?? '—', color: '#00e5ff' },
          ]}
          annotations={hrVals.length ? [
            { text: `Min ${Math.min(...hrVals)} bpm`, color: '#00ff88' },
            { text: `Max ${Math.max(...hrVals)} bpm`, color: '#ff3d5a' },
            { text: Math.max(...hrVals) > 95 ? 'Elevated episodes detected' : 'Within normal range', color: Math.max(...hrVals) > 95 ? '#ffb300' : '#00ff88' },
          ] : []}
        />

        {/* SpO2 Chart */}
        <TrendChart data={windowedData} dataKey="spo2" color="#00ff88"
          label="SpO₂" unit="%" subtitle="— blood oxygen saturation"
          yMin={88} yMax={101}
          refLine={{ y: 94, color: '#ff3d5a', label: 'low threshold' }}
          stats={[
            { label: 'Min', value: spo2Vals.length ? `${Math.min(...spo2Vals)}%` : '—', color: '#ff3d5a' },
            { label: 'Max', value: spo2Vals.length ? `${Math.max(...spo2Vals)}%` : '—', color: '#00ff88' },
            { label: 'Now', value: spo2Vals.length ? `${spo2Vals[spo2Vals.length - 1]}%` : '—', color: '#00ff88' },
          ]}
          annotations={spo2Vals.length ? [
            { text: `Lowest ${Math.min(...spo2Vals)}%`, color: Math.min(...spo2Vals) < 94 ? '#ff3d5a' : '#ffb300' },
            { text: Math.min(...spo2Vals) < 94 ? 'Hypoxia risk detected' : 'Saturation healthy', color: Math.min(...spo2Vals) < 94 ? '#ff3d5a' : '#00ff88' },
          ] : []}
        />

        {/* Activity Chart */}
        <TrendChart data={windowedData} dataKey="activity" color="#ffb300"
          label="Activity" unit=" steps" subtitle="— movement intensity"
          yMin={0} yMax={2400}
          refLine={{ y: 1500, color: '#ff3d5a', label: 'high threshold' }}
          stats={[
            { label: 'Peak', value: actVals.length ? Math.max(...actVals) : '—', color: '#ffb300' },
            { label: 'Avg', value: avg(actVals) || '—', color: '#ffb300' },
            { label: 'Now', value: actVals[actVals.length - 1] ?? '—', color: '#ffb300' },
          ]}
          annotations={actVals.length ? [
            { text: `Peak ${Math.max(...actVals)} steps`, color: '#ffb300' },
            { text: avg(actVals) > 1500 ? 'High activity session' : avg(actVals) > 800 ? 'Moderate activity' : 'Low activity', color: avg(actVals) > 1500 ? '#ff3d5a' : avg(actVals) > 800 ? '#ffb300' : '#00ff88' },
          ] : []}
        />

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <HRZoneChart data={windowedData} />
          <RiskTimeline data={bluetooth.history} />
        </div>
      </main>
    </div>
  );
}
