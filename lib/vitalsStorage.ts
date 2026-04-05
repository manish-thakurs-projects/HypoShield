export const VITALS_SAVED_EVENT = 'vitals-saved';

const RECORDS_KEY = 'hypo_vitals_records';
const ACTIVE_SESSION_KEY = 'hypo_active_session_id';

/** Max rows kept in localStorage (oldest dropped first). */
export const MAX_VITALS_RECORDS = 20_000;

export interface VitalsRecord {
  heartRate: number;
  spo2: number;
  activity: number;
  timestamp: string;
  sessionId: string;
  deviceLabel: string;
}

function readRecords(): VitalsRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is VitalsRecord =>
        r &&
        typeof r === 'object' &&
        typeof (r as VitalsRecord).heartRate === 'number' &&
        typeof (r as VitalsRecord).sessionId === 'string' &&
        typeof (r as VitalsRecord).timestamp === 'string'
    );
  } catch {
    return [];
  }
}

function writeRecords(records: VitalsRecord[]): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function getAllRecords(): VitalsRecord[] {
  return readRecords();
}

export function getActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

export function setActiveSessionId(sessionId: string | null): void {
  if (typeof window === 'undefined') return;
  if (sessionId == null) {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  } else {
    localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
  }
}

export function appendSample(params: {
  heartRate: number;
  spo2: number;
  activity: number;
  timestamp: Date;
  sessionId: string;
  deviceLabel: string;
}): void {
  if (typeof window === 'undefined') return;

  const row: VitalsRecord = {
    heartRate: params.heartRate,
    spo2: params.spo2,
    activity: params.activity,
    timestamp: params.timestamp.toISOString(),
    sessionId: params.sessionId,
    deviceLabel: params.deviceLabel,
  };

  let records = readRecords();
  records.push(row);
  if (records.length > MAX_VITALS_RECORDS) {
    records = records.slice(-MAX_VITALS_RECORDS);
  }
  writeRecords(records);

  window.dispatchEvent(new CustomEvent(VITALS_SAVED_EVENT));
}

export function clearAllRecords(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(RECORDS_KEY);
  window.dispatchEvent(new CustomEvent(VITALS_SAVED_EVENT));
}

export function recordsToCsv(records: VitalsRecord[]): string {
  const header = 'timestamp_iso,session_id,device,heart_rate_bpm,spo2_percent,activity';
  const lines = records.map((r) =>
    [
      r.timestamp,
      r.sessionId,
      csvEscape(r.deviceLabel),
      r.heartRate,
      r.spo2,
      r.activity,
    ].join(',')
  );
  return [header, ...lines].join('\n');
}

function csvEscape(s: string): string {
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
