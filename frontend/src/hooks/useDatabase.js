import { useState, useEffect } from 'react';

export function useDatabase(onMessage) {
  const [databases, setDatabases] = useState([]);
  const [activeDb, setActiveDb] = useState('ecommerce.db');
  const [attachedDbs, setAttachedDbs] = useState({});

  useEffect(() => { fetchDatabases(); }, []);

  const fetchDatabases = async () => {
    try {
      const [dbRes, attRes] = await Promise.all([
        fetch('/databases'),
        fetch('/databases/attached'),
      ]);
      const { databases: dbs } = await dbRes.json();
      const { attached } = await attRes.json();
      setDatabases(dbs || []);
      setAttachedDbs(attached || {});
    } catch (e) {
      console.error('fetchDatabases:', e);
    }
  };

  const selectDb = async (filename) => {
    await fetch('/databases/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    });
    setActiveDb(filename);
    onMessage?.(`Switched to **${filename}**. How can I help you?`);
  };

  const attachDb = async (filename) => {
    const res = await fetch('/databases/attach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename }),
    });
    const data = await res.json();
    setAttachedDbs((prev) => ({ ...prev, [data.alias]: filename }));
    onMessage?.(`Attached **${filename}** as \`${data.alias}\`. You can now query across both databases.`);
  };

  const detachDb = async (alias) => {
    await fetch('/databases/detach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias }),
    });
    setAttachedDbs((prev) => {
      const next = { ...prev };
      delete next[alias];
      return next;
    });
  };

  const uploadDb = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/databases/upload', { method: 'POST', body: formData });
    if (res.ok) {
      const data = await res.json();
      await fetchDatabases();
      await selectDb(data.filename || file.name);
    }
  };

  return { databases, activeDb, attachedDbs, fetchDatabases, selectDb, attachDb, detachDb, uploadDb };
}
