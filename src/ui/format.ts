/** Shared display formatters for the DOM UI. */

/** Formats a duration as mm:ss (or h:mm:ss past one hour). */
export function formatDuration(ms: number | null): string | null {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return null;

  const totalSeconds = Math.floor(ms / 1000);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);

  const pair = (value: number): string => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pair(minutes)}:${pair(seconds)}` : `${pair(minutes)}:${pair(seconds)}`;
}

/** Formats a score with thousands separators; null becomes an em dash. */
export function formatScore(score: number | null): string {
  if (score === null || !Number.isFinite(score)) return '—';
  return Math.max(0, Math.round(score)).toLocaleString('en-US');
}

/** Formats a duration; null becomes an em dash. */
export function formatTime(ms: number | null): string {
  return formatDuration(ms) ?? '—';
}
