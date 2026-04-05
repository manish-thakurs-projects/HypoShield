'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { HealthData } from '@/hooks/useBluetooth';
import { format } from '@/lib/utils';

interface ChartProps {
  history: HealthData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl px-3 py-2 text-xs font-mono"
        style={{
          backgroundColor: '#0d1425ee',
          border: '1px solid #1a2a45',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="text-slate-400 mb-1">{label}</div>
        {payload.map((p: any) => (
          <div key={p.dataKey} style={{ color: p.color }}>
            {p.name}: <span className="font-bold">{Math.round(p.value)}</span>
            {p.dataKey === 'heartRate' ? ' bpm' : p.dataKey === 'spo2' ? '%' : ''}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function HeartRateChart({ history }: ChartProps) {
  const chartData = history.map((d) => ({
    time: d.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    heartRate: d.heartRate,
    spo2: d.spo2,
  }));

  const recentData = chartData.slice(-30);

  return (
    <div className="card-glass rounded-2xl p-6" style={{ borderColor: '#1a2a45' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xs font-display font-semibold uppercase tracking-widest text-slate-500 mb-1">
            Live Trend
          </div>
          <div className="text-lg font-display font-bold text-slate-200">
            Heart Rate & SpO₂
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-display">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full bg-cyan-400" />
            <span className="text-slate-400">Heart Rate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 rounded-full bg-emerald-400" />
            <span className="text-slate-400">SpO₂</span>
          </div>
        </div>
      </div>

      <div style={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={recentData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="hrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#00e5ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff88" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              tick={{ fill: '#4a6080', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#4a6080', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={94} stroke="#ffb30040" strokeDasharray="4 4" />
            <Area
              type="monotone"
              dataKey="heartRate"
              name="Heart Rate"
              stroke="#00e5ff"
              strokeWidth={2}
              fill="url(#hrGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#00e5ff', strokeWidth: 0 }}
              animationDuration={300}
            />
            <Area
              type="monotone"
              dataKey="spo2"
              name="SpO₂"
              stroke="#00ff88"
              strokeWidth={2}
              fill="url(#spo2Grad)"
              dot={false}
              activeDot={{ r: 4, fill: '#00ff88', strokeWidth: 0 }}
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between items-center mt-3 text-xs text-slate-600 font-mono">
        <span>← Last {Math.min(recentData.length, 30)} readings</span>
        <span>{history.length} total</span>
      </div>
    </div>
  );
}
