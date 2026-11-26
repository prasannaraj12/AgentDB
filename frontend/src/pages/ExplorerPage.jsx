import { useRef, useState } from 'react';
import { Database, Upload, Plug, Unplug, ArrowRightLeft, LoaderCircle, FileUp } from 'lucide-react';
import { useApp } from '../lib/appContext';
import { PageHeader, Panel, Button, EmptyState } from '../components/ui/Primitives';
import { databaseTotals, numberFmt } from '../lib/dbInsights';

const ACCEPT = '.db,.sqlite,.sqlite3,.csv,.tsv,.json';

export default function ExplorerPage() {
  const { db, report: { report } } = useApp();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);
  const [dragging, setDragging] = useState(false);

  const run = async (key, fn, success) => {
    setBusy(key);
    setMessage(null);
    try {
      await fn();
      if (success) setMessage({ kind: 'ok', text: success });
    } catch (e) {
      setMessage({ kind: 'error', text: e.message });
    } finally {
      setBusy(null);
    }
  };

  const upload = (file) => file && run('upload', () => db.uploadDb(file), `Uploaded ${file.name} and made it the active database.`);
  const attachedFiles = new Map(Object.entries(db.attachedDbs).map(([alias, f]) => [f, alias]));
  const totals = report ? databaseTotals(report) : null;

  return (
    <div className="ag-page">
      <PageHeader
        title="Database Explorer"
        subtitle="Switch the active database, attach others for cross-database queries, or upload new data."
        actions={<Button variant="dark" icon={Upload} onClick={() => fileRef.current?.click()} disabled={!!busy}>Upload data</Button>}
      />
      <input ref={fileRef} type="file" hidden accept={ACCEPT} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; upload(f); }} />

      {message && <p className={message.kind === 'ok' ? 'ag-inline-ok' : 'ag-inline-error'} role="status">{message.text}</p>}

      <div className="ag-db-grid">
        {db.databases.length === 0 && (
          <Panel><EmptyState icon={Database} title={db.connection === 'offline' ? 'Backend offline' : 'No databases found'}>
            {db.connection === 'offline' ? 'Start the backend server, then reload this page.' : 'Upload a SQLite database or a CSV/JSON file to begin.'}
          </EmptyState></Panel>
        )}
        {db.databases.map((name, i) => {
          const active = name === db.activeDb;
          const alias = attachedFiles.get(name);
          return (
            <Panel key={name} className={`ag-db-card ${active ? 'is-active' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
              <div className="ag-db-card-top">
                <span className={`ag-db-icon ${active ? 'is-active' : ''}`}><Database size={16} /></span>
                <div className="ag-db-name">
                  <p title={name}>{name}</p>
                  <span>{active ? 'Active database' : alias ? `Attached as [${alias}]` : 'Available'}</span>
                </div>
                {active && <span className="ag-badge is-dark">Active</span>}
                {alias && <span className="ag-badge">Attached</span>}
              </div>
              {active && totals && (
                <p className="ag-db-meta">{numberFmt.format(totals.totalRecords)} records · {totals.tableCount} tables{Object.keys(db.attachedDbs).length ? ' (incl. attached)' : ''}</p>
              )}
              <div className="ag-db-actions">
                {!active && (
                  <Button className="ag-btn-sm" icon={busy === `select:${name}` ? LoaderCircle : ArrowRightLeft} disabled={!!busy}
                    onClick={() => run(`select:${name}`, () => db.selectDb(name), `Switched to ${name}.`)}>Make active</Button>
                )}
                {!active && !alias && (
                  <Button className="ag-btn-sm" icon={Plug} disabled={!!busy}
                    onClick={() => run(`attach:${name}`, () => db.attachDb(name), `Attached ${name}.`)}>Attach</Button>
                )}
                {alias && (
                  <Button className="ag-btn-sm" icon={Unplug} disabled={!!busy}
                    onClick={() => run(`detach:${name}`, () => db.detachDb(alias), `Detached ${name}.`)}>Detach</Button>
                )}
              </div>
            </Panel>
          );
        })}
      </div>

      <label
        className={`ag-dropzone ${dragging ? 'is-dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files?.[0]); }}
      >
        <input type="file" hidden accept={ACCEPT} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; upload(f); }} />
        {busy === 'upload' ? <LoaderCircle size={20} className="ag-spin" /> : <FileUp size={20} />}
        <span className="ag-dropzone-title">{busy === 'upload' ? 'Uploading…' : 'Drop a file here or click to browse'}</span>
        <span className="ag-dropzone-text">SQLite (.db, .sqlite, .sqlite3) or CSV, TSV and JSON — tabular files are converted to SQLite.</span>
      </label>
    </div>
  );
}
