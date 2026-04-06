'use client';

import { useBluetooth } from '@/hooks/useBluetooth';
import Dashboard from '@/components/Dashboard';
import { useEffect, useState } from 'react';

// EKG animation path
function EkgBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full opacity-5 pointer-events-none"
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
    >
      <polyline
        className="ekg-line"
        points="0,300 100,300 150,300 200,100 250,500 300,300 350,300 400,200 450,400 500,300 600,300 700,300 750,300 800,150 850,450 900,300 950,300 1000,250 1050,350 1100,300 1200,300"
        fill="none"
        stroke="#00e5ff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Bluetooth icon SVG
function BluetoothIcon({ size = 32, color = '#00e5ff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M6.5 6.5L17.5 17.5M6.5 17.5L12 12L17.5 6.5L12 1V23L17.5 17.5"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ConnectScreen({
  onConnect,
  onDemo,
  isConnecting,
  error,
}: {
  onConnect: () => void;
  onDemo: () => void;
  isConnecting: boolean;
  error: string | null;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 relative overflow-hidden">
      <EkgBackground />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,229,255,0.06) 0%, transparent 70%)',
        }}
      />

      <div
        className={`w-full max-w-sm sm:max-w-md md:max-w-lg transition-all duration-700 ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        {/* Logo area */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center relative"
              style={{
                backgroundColor: '#00e5ff12',
                border: '1px solid #00e5ff30',
                boxShadow: '0 0 40px rgba(0,229,255,0.15)',
              }}
            >
              <BluetoothIcon size={32} />
              <div
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: '#050810', border: '1px solid #00ff8840' }}
              >
                <span
                  className="w-2 h-2 rounded-full heartbeat-dot"
                  style={{ backgroundColor: '#00ff88' }}
                />
              </div>
            </div>
          </div>

          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tighter mb-2 sm:mb-3 px-2"
            style={{
              background: 'linear-gradient(135deg, #00e5ff 0%, #4d9fff 50%, #00ff88 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            HypoShield
          </h1>
          <p className="text-slate-400 font-body text-sm sm:text-base leading-relaxed px-2">
            Real-time health monitoring via ESP32 BLE wearable.
            <br />
            <span className="text-slate-600 text-xs sm:text-sm">Chrome required for Web Bluetooth.</span>
          </p>
        </div>

        {/* Connection card */}
        <div
          className="card-glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-4"
          style={{ borderColor: '#1a2a45' }}
        >
          {/* Feature list */}
          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
            {[
              { icon: '♥', label: 'Heart Rate Monitoring', color: '#00e5ff' },
              { icon: 'O₂', label: 'Blood Oxygen (SpO₂)', color: '#00ff88' },
              { icon: '⚡', label: 'Activity Tracking', color: '#ffb300' },
              { icon: '✦', label: 'AI Risk Assessment', color: '#4d9fff' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 sm:gap-3">
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm flex-shrink-0"
                  style={{ backgroundColor: `${f.color}18`, color: f.color, border: `1px solid ${f.color}25` }}
                >
                  {f.icon}
                </div>
                <span className="text-xs sm:text-sm text-slate-300 font-body">{f.label}</span>
                <div className="flex-1 h-px bg-slate-800" />
                <span style={{ color: f.color }} className="text-[10px] sm:text-xs font-mono">
                  LIVE
                </span>
              </div>
            ))}
          </div>

          {/* Connect button */}
          <button
            onClick={onConnect}
            disabled={isConnecting}
            className="connect-btn w-full py-3 sm:py-4 rounded-xl sm:rounded-2xl font-display font-bold text-sm sm:text-base tracking-wide transition-all duration-300 relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: '#00e5ff18',
              border: '1px solid #00e5ff50',
              color: '#00e5ff',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#00e5ff25';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(0,229,255,0.2)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#00e5ff18';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
            }}
          >
            {isConnecting ? (
              <span className="flex items-center justify-center gap-2 sm:gap-3">
                <span
                  className="w-3 h-3 sm:w-4 sm:h-4 border-2 rounded-full animate-spin"
                  style={{ borderColor: '#00e5ff40', borderTopColor: '#00e5ff' }}
                />
                <span className="text-xs sm:text-sm">Scanning for HypoShield...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 sm:gap-3">
                <BluetoothIcon size={18} />
                <span>Connect Device</span>
              </span>
            )}
          </button>

          {/* Error */}
          {error && (
            <div
              className="mt-4 p-2 sm:p-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-mono leading-relaxed"
              style={{
                backgroundColor: '#ff3d5a12',
                border: '1px solid #ff3d5a30',
                color: '#ff8090',
              }}
            >
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Demo mode */}
        <button
          onClick={onDemo}
          className="w-full py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-display font-semibold text-xs sm:text-sm tracking-wide transition-all duration-200"
          style={{
            backgroundColor: '#111c3040',
            border: '1px solid #1a2a45',
            color: '#4a6080',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#8aa0c0';
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#2a3a55';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = '#4a6080';
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#1a2a45';
          }}
        >
          ⚙ Launch Demo Mode (no device needed)
        </button>

        <p className="text-center text-[10px] sm:text-xs text-slate-700 mt-6 font-mono">
          v1.0 · ESP32 BLE · Web Bluetooth API
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  const bluetooth = useBluetooth();

  const handleDemo = () => {
    bluetooth.simulateData();
  };

  if (bluetooth.isConnected && bluetooth.data) {
    return (
      <div className="w-full min-h-screen bg-[#050810]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          <Dashboard
            data={bluetooth.data}
            history={bluetooth.history}
            deviceName={bluetooth.deviceName}
            onDisconnect={bluetooth.disconnect}
          />
        </div>
      </div>
    );
  }

  return (
    <ConnectScreen
      onConnect={bluetooth.connect}
      onDemo={handleDemo}
      isConnecting={bluetooth.isConnecting}
      error={bluetooth.error}
    />
  );
}