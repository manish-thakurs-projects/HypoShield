export function format(value: number, decimals = 0): string {
  return value.toFixed(decimals);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
