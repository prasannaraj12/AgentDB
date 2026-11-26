// Query history store shared by the chat, dashboard and history pages.
// Persisted in localStorage under the existing 'queryHistory' key; older
// entries only have { query, ts } and are shown with unknown status.
import { useSyncExternalStore } from 'react';

const KEY = 'queryHistory';
const MAX_ENTRIES = 200;
const listeners = new Set();

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(parsed)) return [];
    // A question still "running" from a page that was closed or refreshed will never finish.
    const stale = Date.now() - 5 * 60 * 1000;
    return parsed.map((e) => (e.status === 'running' && (e.ts || 0) < stale
      ? { ...e, status: 'failed', error: 'Interrupted (page closed or refreshed)' }
      : e));
  } catch {
    return [];
  }
}

let entries = load();

function commit(next) {
  entries = next.slice(0, MAX_ENTRIES);
  try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch { /* storage unavailable */ }
  listeners.forEach((cb) => cb());
}

export function addHistoryEntry(entry) {
  const id = entry.id || `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  commit([{ id, status: 'running', ...entry }, ...entries]);
  return id;
}

export function updateHistoryEntry(id, patch) {
  commit(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
}

export function clearHistory() {
  commit([]);
}

function subscribe(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useQueryHistory() {
  return useSyncExternalStore(subscribe, () => entries, () => entries);
}

const DAY = 24 * 60 * 60 * 1000;

export function startOfDay(ts) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Daily query counts for the `days` days ending today (oldest first). */
export function dailyCounts(history, days, now = Date.now()) {
  const today = startOfDay(now);
  const buckets = Array.from({ length: days }, (_, i) => ({
    dayStart: today - (days - 1 - i) * DAY,
    count: 0,
  }));
  const first = buckets[0].dayStart;
  for (const e of history) {
    if (!e.ts || e.ts < first) continue;
    const idx = Math.floor((startOfDay(e.ts) - first) / DAY);
    if (idx >= 0 && idx < days) buckets[idx].count += 1;
  }
  return buckets;
}

/** Count of queries in the `days` days before the current window, or null if none were tracked then. */
export function previousPeriodCount(history, days, now = Date.now()) {
  const windowStart = startOfDay(now) - (days - 1) * DAY;
  const prevStart = windowStart - days * DAY;
  const oldest = history.reduce((min, e) => (e.ts && e.ts < min ? e.ts : min), Infinity);
  if (oldest >= windowStart) return null; // history doesn't reach back that far
  return history.filter((e) => e.ts >= prevStart && e.ts < windowStart).length;
}

/** Success rate among entries whose outcome was recorded. */
export function successStats(history) {
  const finished = history.filter((e) => e.status === 'success' || e.status === 'failed');
  const ok = finished.filter((e) => e.status === 'success').length;
  const durations = finished.map((e) => e.durationMs).filter((d) => typeof d === 'number');
  return {
    tracked: finished.length,
    succeeded: ok,
    failed: finished.length - ok,
    rate: finished.length ? ok / finished.length : null,
    avgDurationMs: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
  };
}
