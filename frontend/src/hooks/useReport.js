import { useState, useEffect, useCallback } from 'react';

/** Loads /report/generate (schema, row counts, samples, column stats) for the current database context. */
export function useReport(version) {
  const [state, setState] = useState({ report: null, loading: true, error: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (version === null || version === undefined) return undefined; // database not synced yet
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState((s) => ({ ...s, loading: true, error: null }));
    fetch('/report/generate')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((report) => { if (!cancelled) setState({ report, loading: false, error: null }); })
      .catch(() => { if (!cancelled) setState((s) => ({ ...s, loading: false, error: 'Could not load database details.' })); });
    return () => { cancelled = true; };
  }, [version, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { ...state, refresh };
}
