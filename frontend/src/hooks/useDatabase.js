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

export function useDatabase(onMessage) {
  const [databases, setDatabases] = useState([]);
  const [activeDb, setActiveDb] = useState('ecommerce.db');
  const [attachedDbs, setAttachedDbs] = useState({});
  const [connection, setConnection] = useState('checking'); // 'checking' | 'online' | 'offline'
  const [version, setVersion] = useState(0); // bumps whenever the database context changes

  const fetchDatabases = useCallback(async () => {
    try {
      const [dbRes, attRes] = await Promise.all([fetch('/databases'), fetch('/databases/attached')]);
      if (!dbRes.ok || !attRes.ok) throw new Error('backend error');
      const { databases: dbs } = await dbRes.json();
      const { attached } = await attRes.json();
      setDatabases(dbs || []);
      setAttachedDbs(attached || {});
      setConnection('online');
    } catch {
      setConnection('offline');
    }
  }, []);

  useEffect(() => {
    // Initial load of the database list from the backend.
    fetchDatabases();
  }, [fetchDatabases]);

  const selectDb = useCallback(async (filename) => {
    await postJson('/databases/select', { filename });
    setActiveDb(filename);
    setVersion((v) => v + 1);
    onMessage?.(`Switched to **${filename}**. How can I help you?`);
  }, [onMessage]);

  const attachDb = useCallback(async (filename) => {
    const data = await postJson('/databases/attach', { filename });
    setAttachedDbs((prev) => ({ ...prev, [data.alias]: filename }));
    setVersion((v) => v + 1);
    onMessage?.(`Attached **${filename}** as \`${data.alias}\`. You can now query across both databases.`);
  }, [onMessage]);

  const detachDb = useCallback(async (alias) => {
    await postJson('/databases/detach', { filename: '', alias });
    setAttachedDbs((prev) => {
      const next = { ...prev };
      delete next[alias];
      return next;
    });
    setVersion((v) => v + 1);
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
