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

/** How the current document was loaded: 'navigate' | 'reload' | 'back_forward' | 'prerender'. */
export function documentNavigationType() {
  const entry = typeof performance !== 'undefined' && performance.getEntriesByType?.('navigation')?.[0];
  if (entry?.type) return entry.type;
  // Legacy Navigation Timing (Level 1) fallback.
  return performance?.navigation?.type === 1 ? 'reload' : 'navigate';
}

/**
 * Startup routing, run once before the first render. A browser refresh (Ctrl+R / F5) of an
 * app page returns to the landing page; typed URLs, links and back/forward keep their route,
 * so /app/workspace can still be opened directly. Only the URL changes: database selection
 * and the conversation stay in storage and are restored on the next launch.
 */
export function applyStartupRoute() {
  const path = window.location.pathname;
  if (documentNavigationType() === 'reload' && (path === '/app' || path.startsWith('/app/'))) {
    window.history.replaceState({}, '', '/');
  }
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
