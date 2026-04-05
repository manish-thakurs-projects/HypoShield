'use client';

import { useMemo, useState, useEffect } from 'react';
import { HealthData } from '@/hooks/useBluetooth';
import Card from './Card';
import RiskIndicator, { calculateRisk } from './RiskIndicator';
import HeartRateChart from './HeartRateChart';

interface DashboardProps {
  data: HealthData;
  history: HealthData[];
  deviceName: string | null;
  onDisconnect: () => void;
}

function getActivityLabel(activity: number): { label: string; color: string } {
  if (activity > 1500) return { label: 'HIGH', color: '#ff3d5a' };
  if (activity > 800) return { label: 'MEDIUM', color: '#ffb300' };
  return { label: 'LOW', color: '#00ff88' };
}

function getTrend(history: HealthData[], key: keyof HealthData): 'up' | 'down' | 'stable' {
  if (history.length < 5) return 'stable';
  const recent = history.slice(-5).map((d) => d[key] as number);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const last = recent[recent.length - 1];
  if (last > avg * 1.03) return 'up';
  if (last < avg * 0.97) return 'down';
  return 'stable';
}

// EKG path animation component
function EkgLine({ color }: { color: string }) {
  return (
    <svg width="80" height="24" viewBox="0 0 80 24" className="opacity-60">
      <polyline
        className="ekg-line"
        points="0,12 10,12 15,12 20,4 25,20 30,12 35,12 40,8 45,16 50,12 60,12 70,12 80,12"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Dashboard({ data, history, deviceName, onDisconnect }: DashboardProps) {
  const [now, setNow] = useState(new Date());
  const risk = useMemo(() => calculateRisk(data), [data]);
  const activityInfo = getActivityLabel(data.activity);
  const hrTrend = getTrend(history, 'heartRate');
  const spo2Trend = getTrend(history, 'spo2');

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const lastUpdated = data.timestamp
    ? `${data.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
    : '—';

  const isHighRisk = risk.level === 'HIGH RISK';

  return (
    <div className="min-h-screen flex flex-col">
      {/* High risk alert banner */}
      {isHighRisk && (
        <div
          className="alert-banner w-full px-6 py-3 flex items-center justify-center gap-3 text-sm font-display font-semibold"
          style={{
            backgroundColor: '#ff3d5a18',
            borderBottom: '1px solid #ff3d5a40',
            color: '#ff3d5a',
          }}
        >
          <span className="animate-pulse">⚠</span>
          HIGH RISK DETECTED — Consider resting or eating soon. Monitor closely.
          <span className="animate-pulse">⚠</span>
        </div>
      )}

      {/* Header */}
      <header
        className="sticky top-0 z-50 px-6 py-4 flex items-center justify-between"
        style={{
          backgroundColor: 'rgba(5, 8, 16, 0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(26, 42, 69, 0.6)',
        }}
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className="text-xl font-display font-extrabold tracking-tight"
                style={{ color: '#00e5ff' }}
              >
                HypoShield
              </span>
              <span className="text-slate-600 text-lg font-thin">|</span>
              <span className="text-slate-400 text-sm font-body">{deviceName}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <EkgLine color="#00e5ff" />
              <span className="text-xs text-slate-600 font-mono">{now.toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>LAST UPDATE</span>
            <span style={{ color: '#00e5ff' }}>{lastUpdated}</span>
          </div>

          {/* Status badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-display font-bold"
            style={{
              backgroundColor: '#00ff8815',
              border: '1px solid #00ff8840',
              color: '#00ff88',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 heartbeat-dot" />
            CONNECTED
          </div>

          <button
            onClick={onDisconnect}
            className="px-3 py-1.5 rounded-xl text-xs font-display font-semibold transition-all duration-200 hover:opacity-80"
            style={{
              backgroundColor: '#ff3d5a18',
              border: '1px solid #ff3d5a40',
              color: '#ff3d5a',
            }}
          >
            Disconnect
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full">
        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {/* Heart Rate */}
          <div className="slide-up slide-up-1">
            <Card
              title="Heart Rate"
              value={data.heartRate}
              unit="bpm"
              icon={
                <span style={{ display: 'inline-block' }} className="heartbeat-dot">
                  ♥
                </span>
              }
              accentColor="#00e5ff"
              glowClass={data.heartRate > 95 ? 'glow-moderate' : ''}
              subtitle="Beats per minute"
              trend={hrTrend}
              badge={data.heartRate > 95 ? 'ELEVATED' : data.heartRate < 55 ? 'LOW' : 'NORMAL'}
              badgeColor={
                data.heartRate > 95
                  ? '#ffb300'
                  : data.heartRate < 55
                  ? '#ff3d5a'
                  : '#00ff88'
              }
            />
          </div>

          {/* SpO2 */}
          <div className="slide-up slide-up-2">
            <Card
              title="Blood Oxygen"
              value={data.spo2}
              unit="%"
              icon="O₂"
              accentColor="#00ff88"
              glowClass={data.spo2 < 94 ? 'glow-danger' : 'glow-safe'}
              subtitle="SpO₂ saturation"
              trend={spo2Trend}
              badge={data.spo2 >= 96 ? 'OPTIMAL' : data.spo2 >= 94 ? 'FAIR' : 'LOW'}
              badgeColor={
                data.spo2 >= 96 ? '#00ff88' : data.spo2 >= 94 ? '#ffb300' : '#ff3d5a'
              }
            />
          </div>

          {/* Activity */}
          <div className="slide-up slide-up-3">
            <Card
              title="Activity"
              value={data.activity}
              unit="steps"
              icon="⚡"
              accentColor={activityInfo.color}
              subtitle="Movement intensity"
              badge={activityInfo.label}
              badgeColor={activityInfo.color}
            />
          </div>
        </div>

        {/* Bottom section: Risk + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Risk indicator - wider */}
          <div className="lg:col-span-2 slide-up slide-up-4">
            <RiskIndicator data={data} />
          </div>

          {/* Chart */}
          <div className="lg:col-span-3 slide-up slide-up-5">
            <HeartRateChart history={history} />
          </div>
        </div>

        {/* Bottom stats strip */}
        <div
          className="mt-4 rounded-2xl px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 slide-up"
          style={{
            backgroundColor: '#0d142590',
            border: '1px solid #1a2a4580',
          }}
        >
          {[
            { label: 'Session Duration', value: `${Math.floor(history.length * 1.5 / 60)}m ${(history.length * 1.5) % 60 | 0}s` },
            { label: 'Readings Taken', value: history.length.toString() },
            { label: 'Avg Heart Rate', value: history.length > 0 ? `${Math.round(history.reduce((a, b) => a + b.heartRate, 0) / history.length)} bpm` : '—' },
            { label: 'Min SpO₂', value: history.length > 0 ? `${Math.min(...history.map(d => d.spo2))}%` : '—' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1">
              <span className="text-xs font-display uppercase tracking-widest text-slate-600">
                {stat.label}
              </span>
              <span className="font-mono text-lg font-semibold text-slate-300">{stat.value}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-xs text-slate-700 font-display">
          HypoShield v1.0 · ESP32 BLE Monitor · Chrome only
        </p>
      </footer>
    </div>
  );
}
