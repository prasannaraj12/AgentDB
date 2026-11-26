import { useState, useEffect, useCallback } from 'react';

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
  return data;
}

const DEFAULT_DB = 'ecommerce.db';
const ACTIVE_DB_KEY = 'agentdb.activeDb';

function readActiveDb() {
  try { return localStorage.getItem(ACTIVE_DB_KEY) || DEFAULT_DB; } catch { return DEFAULT_DB; }
}

function storeActiveDb(name) {
  try { localStorage.setItem(ACTIVE_DB_KEY, name); } catch { /* storage unavailable */ }
}

export function useDatabase(onMessage) {
  const [databases, setDatabases] = useState([]);
  const [activeDb, setActiveDb] = useState(readActiveDb);
  const [attachedDbs, setAttachedDbs] = useState({});
  const [connection, setConnection] = useState('checking'); // 'checking' | 'online' | 'offline'
  // Bumps whenever the database context changes. null until the backend has been
  // synced to the remembered database, so dependent fetches don't run twice.
  const [version, setVersion] = useState(null);

  const fetchDatabases = useCallback(async () => {
    try {
      const [dbRes, attRes] = await Promise.all([fetch('/databases'), fetch('/databases/attached')]);
      if (!dbRes.ok || !attRes.ok) throw new Error('backend error');
      const { databases: dbs } = await dbRes.json();
      const { attached } = await attRes.json();
      setDatabases(dbs || []);
      setAttachedDbs(attached || {});
      setConnection('online');
      return dbs || [];
    } catch {
      setConnection('offline');
      return null;
    }
  }, []);

  useEffect(() => {
    // Initial load: the backend keeps one global active database and the frontend can't
    // read which one it is, so re-select the database this browser last used.
    let cancelled = false;
    (async () => {
      const dbs = await fetchDatabases();
      if (cancelled) return;
      const remembered = readActiveDb();
      const target = dbs?.includes(remembered) ? remembered : dbs?.includes(DEFAULT_DB) ? DEFAULT_DB : dbs?.[0];
      if (target) {
        try {
          await postJson('/databases/select', { filename: target });
          if (cancelled) return;
          setActiveDb(target);
          storeActiveDb(target);
        } catch { /* keep the remembered name; the connection pill shows backend state */ }
      }
      if (!cancelled) setVersion(0);
    })();
    return () => { cancelled = true; };
  }, [fetchDatabases]);

  const selectDb = useCallback(async (filename) => {
    await postJson('/databases/select', { filename });
    setActiveDb(filename);
    storeActiveDb(filename);
    setVersion((v) => (v ?? 0) + 1);
    onMessage?.(`Switched to **${filename}**. How can I help you?`);
  }, [onMessage]);

  const attachDb = useCallback(async (filename) => {
    const data = await postJson('/databases/attach', { filename });
    setAttachedDbs((prev) => ({ ...prev, [data.alias]: filename }));
    setVersion((v) => (v ?? 0) + 1);
    onMessage?.(`Attached **${filename}** as \`${data.alias}\`. You can now query across both databases.`);
  }, [onMessage]);

  const detachDb = useCallback(async (alias) => {
    await postJson('/databases/detach', { filename: '', alias });
    setAttachedDbs((prev) => {
      const next = { ...prev };
      delete next[alias];
      return next;
    });
    setVersion((v) => (v ?? 0) + 1);
  }, []);

  const uploadDb = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/databases/upload', { method: 'POST', body: formData });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || `Upload failed (${res.status})`);
    await fetchDatabases();
    await selectDb(data.filename || file.name);
    return data;
  }, [fetchDatabases, selectDb]);

  return {
    databases, activeDb, attachedDbs, connection, version,
    fetchDatabases, selectDb, attachDb, detachDb, uploadDb,
  };
}
