'use client';

import { useState, useCallback, useRef } from 'react';
import { appendSample, setActiveSessionId } from '@/lib/vitalsStorage';

export interface HealthData {
  heartRate: number;
  spo2: number;
  activity: number;
  timestamp: Date;
}

export interface BluetoothState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  deviceName: string | null;
  data: HealthData | null;
  history: HealthData[];
  connect: () => Promise<void>;
  disconnect: () => void;
  simulateData: () => void;
}

const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const CHARACTERISTIC_UUID = 'abcd1234-5678-1234-5678-abcdef123456';
const MAX_HISTORY = 60;

export function useBluetooth(): BluetoothState {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [data, setData] = useState<HealthData | null>(null);
  const [history, setHistory] = useState<HealthData[]>([]);

  const deviceRef = useRef<BluetoothDevice | null>(null);
  const characteristicRef = useRef<BluetoothRemoteGATTCharacteristic | null>(null);
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const deviceLabelRef = useRef<string | null>(null);

  const parseData = useCallback((raw: string): HealthData | null => {
    try {
      const parts = raw.trim().split(',');
      if (parts.length < 3) return null;
      const heartRate = parseInt(parts[0], 10);
      const spo2 = parseInt(parts[1], 10);
      const activity = parseInt(parts[2], 10);
      if (isNaN(heartRate) || isNaN(spo2) || isNaN(activity)) return null;
      return { heartRate, spo2, activity, timestamp: new Date() };
    } catch {
      return null;
    }
  }, []);

  const pushData = useCallback((newData: HealthData) => {
    setData(newData);
    setHistory((prev) => {
      const updated = [...prev, newData];
      return updated.length > MAX_HISTORY ? updated.slice(-MAX_HISTORY) : updated;
    });
    const sid = sessionIdRef.current;
    if (sid) {
      appendSample({
        heartRate: newData.heartRate,
        spo2: newData.spo2,
        activity: newData.activity,
        timestamp: newData.timestamp,
        sessionId: sid,
        deviceLabel: deviceLabelRef.current ?? 'HypoShield',
      });
    }
  }, []);

  const handleNotification = useCallback(
    (event: Event) => {
      const target = event.target as BluetoothRemoteGATTCharacteristic;
      const value = target.value;
      if (!value) return;
      const decoder = new TextDecoder();
      const raw = decoder.decode(value);
      const parsed = parseData(raw);
      if (parsed) pushData(parsed);
    },
    [parseData, pushData]
  );

  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);

    try {
      if (!navigator.bluetooth) {
        throw new Error('Web Bluetooth is not supported in this browser. Please use Chrome or Edge.');
      }

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'HypoShield' }],
        optionalServices: [SERVICE_UUID],
      });

      deviceRef.current = device;
      const label = device.name || 'HypoShield';
      setDeviceName(label);
      sessionIdRef.current = crypto.randomUUID();
      deviceLabelRef.current = label;
      setActiveSessionId(sessionIdRef.current);

      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setDeviceName(null);
        setError('Device disconnected unexpectedly.');
        sessionIdRef.current = null;
        deviceLabelRef.current = null;
        setActiveSessionId(null);
      });

      const server = await device.gatt!.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
      characteristicRef.current = characteristic;

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleNotification);

      setIsConnected(true);
      setIsConnecting(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown connection error';
      if (message.includes('User cancelled')) {
        setError('Connection cancelled by user.');
      } else {
        setError(message);
      }
      setIsConnected(false);
      setIsConnecting(false);
      setDeviceName(null);
      sessionIdRef.current = null;
      deviceLabelRef.current = null;
      setActiveSessionId(null);
    }
  }, [handleNotification]);

  const disconnect = useCallback(() => {
    if (characteristicRef.current) {
      try {
        characteristicRef.current.removeEventListener('characteristicvaluechanged', handleNotification);
        characteristicRef.current.stopNotifications();
      } catch {
        // ignore
      }
    }
    if (deviceRef.current?.gatt?.connected) {
      deviceRef.current.gatt.disconnect();
    }
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
    }
    setIsConnected(false);
    setDeviceName(null);
    setData(null);
    setHistory([]);
    setError(null);
    sessionIdRef.current = null;
    deviceLabelRef.current = null;
    setActiveSessionId(null);
  }, [handleNotification]);

  // Simulation mode for demo/testing without physical device
  const simulateData = useCallback(() => {
    if (simulationRef.current) {
      clearInterval(simulationRef.current);
      simulationRef.current = null;
      setIsConnected(false);
      setDeviceName(null);
      setData(null);
      setHistory([]);
      sessionIdRef.current = null;
      deviceLabelRef.current = null;
      setActiveSessionId(null);
      return;
    }

    sessionIdRef.current = crypto.randomUUID();
    deviceLabelRef.current = 'HypoShield (Demo)';
    setActiveSessionId(sessionIdRef.current);
    setIsConnected(true);
    setDeviceName('HypoShield (Demo)');
    setError(null);

    let tick = 0;
    const run = () => {
      tick++;
      // Simulate realistic health readings with gradual variation
      const phase = tick / 20;
      const heartRateBase = 72 + Math.sin(phase) * 15 + Math.random() * 6 - 3;
      const spo2Base = 97 - Math.max(0, (heartRateBase - 90) * 0.1) + Math.random() * 2 - 1;
      const activityBase = 800 + Math.sin(phase * 0.7) * 600 + Math.random() * 200;

      // Inject occasional high-risk scenario
      const riskScenario = tick % 40 > 30;
      const newData: HealthData = {
        heartRate: Math.round(riskScenario ? heartRateBase + 30 : heartRateBase),
        spo2: Math.round(Math.min(100, Math.max(90, riskScenario ? spo2Base - 4 : spo2Base))),
        activity: Math.round(riskScenario ? activityBase + 1200 : activityBase),
        timestamp: new Date(),
      };
      pushData(newData);
    };

    run(); // Immediate first reading
    simulationRef.current = setInterval(run, 1500);
  }, [pushData]);

  return {
    isConnected,
    isConnecting,
    error,
    deviceName,
    data,
    history,
    connect,
    disconnect,
    simulateData,
  };
}
