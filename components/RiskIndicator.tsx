'use client';

import { useEffect, useRef } from 'react';
import { HealthData } from '@/hooks/useBluetooth';

export type RiskLevel = 'SAFE' | 'MODERATE' | 'HIGH RISK';

interface RiskResult {
  level: RiskLevel;
  score: number;
  explanation: string;
  factors: string[];
}

const BASELINE_HR_LOW = 70;
const BASELINE_HR_HIGH = 80;
const ACTIVITY_THRESHOLD = 1500;

export function calculateRisk(data: HealthData): RiskResult {
  let score = 0;
  const factors: string[] = [];

  const baselineHR = (BASELINE_HR_LOW + BASELINE_HR_HIGH) / 2;

  if (data.heartRate > baselineHR + 20) {
    score += 30;
    factors.push(`elevated heart rate (${data.heartRate} bpm)`);
  } else if (data.heartRate > baselineHR + 10) {
    score += 15;
    factors.push(`slightly elevated heart rate (${data.heartRate} bpm)`);
  }

  if (data.activity > ACTIVITY_THRESHOLD) {
    score += 25;
    factors.push(`high activity level (${data.activity})`);
  } else if (data.activity > ACTIVITY_THRESHOLD * 0.7) {
    score += 12;
    factors.push(`moderate activity level (${data.activity})`);
  }

  if (data.spo2 < 94) {
    score += 10;
    factors.push(`low blood oxygen (${data.spo2}%)`);
  } else if (data.spo2 < 96) {
    score += 5;
    factors.push(`borderline SpO₂ (${data.spo2}%)`);
  }

  score = Math.min(100, score);

  let level: RiskLevel;
  let explanation: string;

  if (score >= 60) {
    level = 'HIGH RISK';
    explanation =
      factors.length > 0
        ? `High risk detected due to ${factors.join(' and ')}. Consider resting or having a snack soon.`
        : 'High risk detected. Monitor your condition closely.';
  } else if (score >= 30) {
    level = 'MODERATE';
    explanation =
      factors.length > 0
        ? `Moderate concern due to ${factors.join(' and ')}. Stay hydrated and monitor your levels.`
        : 'Moderate concern detected. Keep an eye on your vitals.';
  } else {
    level = 'SAFE';
    explanation = 'All vitals within normal range. You\'re doing great — keep it up!';
  }

  return { level, score, explanation, factors };
}

const RISK_CONFIG = {
  SAFE: {
    color: '#00ff88',
    bgColor: '#00ff8812',
    borderColor: '#00ff8830',
    glowClass: 'glow-safe',
    icon: '✦',
    label: 'ALL CLEAR',
  },
  MODERATE: {
    color: '#ffb300',
    bgColor: '#ffb30012',
    borderColor: '#ffb30030',
    glowClass: 'glow-moderate',
    icon: '⚠',
    label: 'WATCH',
  },
  'HIGH RISK': {
    color: '#ff3d5a',
    bgColor: '#ff3d5a12',
    borderColor: '#ff3d5a30',
    glowClass: 'glow-danger',
    icon: '✖',
    label: 'ALERT',
  },
};

interface RiskIndicatorProps {
  data: HealthData;
}

export default function RiskIndicator({ data }: RiskIndicatorProps) {
  const result = calculateRisk(data);
  const cfg = RISK_CONFIG[result.level];
  const segCount = 20;

  return (
    <div
      className={`card-glass rounded-2xl p-6 ${cfg.glowClass}`}
      style={{ borderColor: cfg.borderColor }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div
            className="text-xs font-display font-semibold uppercase tracking-widest mb-1"
            style={{ color: `${cfg.color}99` }}
          >
            Risk Assessment
          </div>
          <div
            className="text-3xl font-display font-extrabold tracking-tight"
            style={{ color: cfg.color }}
          >
            {result.level}
          </div>
        </div>
        <div
          className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center"
          style={{
            backgroundColor: cfg.bgColor,
            border: `2px solid ${cfg.borderColor}`,
            color: cfg.color,
          }}
        >
          <span className="text-2xl leading-none">{cfg.icon}</span>
          <span className="text-[9px] font-display font-bold mt-0.5" style={{ color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Score bar */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-slate-500 font-display uppercase tracking-wider">Risk Score</span>
          <span className="font-mono text-sm font-bold" style={{ color: cfg.color }}>
            {result.score}<span className="text-slate-500">/100</span>
          </span>
        </div>
        {/* Segmented bar */}
        <div className="flex gap-1 h-2">
          {Array.from({ length: segCount }, (_, i) => {
            const threshold = ((i + 1) / segCount) * 100;
            const filled = threshold <= result.score;
            const segColor =
              i < 6
                ? '#00ff88'
                : i < 12
                ? '#ffb300'
                : '#ff3d5a';
            return (
              <div
                key={i}
                className="flex-1 rounded-full transition-all duration-500"
                style={{
                  backgroundColor: filled ? segColor : `${segColor}20`,
                  opacity: filled ? 1 : 0.3,
                }}
              />
            );
          })}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-green-500 font-display">SAFE</span>
          <span className="text-[10px] text-amber-500 font-display">MODERATE</span>
          <span className="text-[10px] text-red-500 font-display">HIGH RISK</span>
        </div>
      </div>

      {/* Explanation */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: `${cfg.color}08`,
          border: `1px solid ${cfg.color}20`,
        }}
      >
        <div
          className="text-xs font-display font-semibold uppercase tracking-widest mb-2"
          style={{ color: `${cfg.color}80` }}
        >
          AI Insight
        </div>
        <p className="text-sm text-slate-300 leading-relaxed font-body">
          {result.explanation}
        </p>
      </div>

      {/* Factor tags */}
      {result.factors.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {result.factors.map((factor, i) => (
            <span
              key={i}
              className="text-xs px-3 py-1 rounded-full font-display"
              style={{
                color: cfg.color,
                backgroundColor: `${cfg.color}12`,
                border: `1px solid ${cfg.color}25`,
              }}
            >
              {factor}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
