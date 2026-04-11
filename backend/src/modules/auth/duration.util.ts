/**
 * Parses strings like `15m`, `7d`, `24h` to milliseconds (same idea as the `ms` package).
 */
export function parseDurationToMs(value: string, fallbackMs: number): number {
  const s = value.trim();
  const match = /^(\d+(?:\.\d+)?)(ms|s|m|h|d|w)$/i.exec(s);
  if (!match) return fallbackMs;
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return fallbackMs;
  const unit = match[2].toLowerCase();
  const mult: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
  };
  return Math.round(n * (mult[unit] ?? fallbackMs));
}
