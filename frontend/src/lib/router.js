// Minimal pushState router — avoids adding a routing dependency.
// App pages live under /app/* so they never collide with the backend proxy
// prefixes (/chat, /databases, /report, /export, /share, /suggestions).
import { useSyncExternalStore } from 'react';

const listeners = new Set();

function subscribe(cb) {
  listeners.add(cb);
  window.addEventListener('popstate', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('popstate', cb);
  };
}

const getPath = () => window.location.pathname;

export function navigate(to, { replace = false } = {}) {
  if (to === window.location.pathname) return;
  if (replace) window.history.replaceState({}, '', to);
  else window.history.pushState({}, '', to);
  listeners.forEach((cb) => cb());
}

export function usePath() {
  return useSyncExternalStore(subscribe, getPath, getPath);
}

export const ROUTES = {
  dashboard: '/app/dashboard',
  workspace: '/app/workspace',
  insights: '/app/insights',
  reports: '/app/reports',
  history: '/app/history',
  explorer: '/app/databases',
  schema: '/app/schema',
  er: '/app/er-diagrams',
  settings: '/app/settings',
};
