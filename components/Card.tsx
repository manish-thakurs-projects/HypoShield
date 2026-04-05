'use client';

import { useEffect, useRef, useState } from 'react';

interface CardProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: React.ReactNode;
  accentColor: string;
  glowClass?: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  trend?: 'up' | 'down' | 'stable';
}

export default function Card({
  title,
  value,
  unit,
  icon,
  accentColor,
  glowClass = '',
  subtitle,
  badge,
  badgeColor,
  trend,
}: CardProps) {
  const [animKey, setAnimKey] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      setAnimKey((k) => k + 1);
      prevValue.current = value;
    }
  }, [value]);

  const trendIcon =
    trend === 'up' ? '↑' : trend === 'down' ? '↓' : trend === 'stable' ? '→' : null;
  const trendColor =
    trend === 'up'
      ? 'text-red-400'
      : trend === 'down'
      ? 'text-green-400'
      : 'text-slate-400';

  return (
    <div
      className={`card-glass stat-card rounded-2xl p-6 flex flex-col gap-4 ${glowClass}`}
      style={{ borderColor: `${accentColor}22` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span
            className="text-xs font-display font-semibold uppercase tracking-widest"
            style={{ color: `${accentColor}99` }}
          >
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-slate-500 font-body">{subtitle}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span
              className="text-xs font-display font-semibold px-2 py-0.5 rounded-full"
              style={{
                color: badgeColor || accentColor,
                backgroundColor: `${badgeColor || accentColor}18`,
                border: `1px solid ${badgeColor || accentColor}33`,
              }}
            >
              {badge}
            </span>
          )}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{
              backgroundColor: `${accentColor}15`,
              border: `1px solid ${accentColor}30`,
              color: accentColor,
            }}
          >
            {icon}
          </div>
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-2">
        <span
          key={animKey}
          className="font-mono font-bold leading-none number-animate"
          style={{ color: accentColor, fontSize: 'clamp(2.5rem, 5vw, 3.5rem)' }}
        >
          {value}
        </span>
        {unit && (
          <span
            className="font-display text-base font-medium mb-2"
            style={{ color: `${accentColor}70` }}
          >
            {unit}
          </span>
        )}
        {trendIcon && (
          <span className={`font-mono text-sm mb-2 ml-1 ${trendColor}`}>
            {trendIcon}
          </span>
        )}
      </div>

      {/* Bottom accent bar */}
      <div
        className="h-0.5 rounded-full w-full"
        style={{
          background: `linear-gradient(90deg, ${accentColor}60, transparent)`,
        }}
      />
    </div>
  );
}
