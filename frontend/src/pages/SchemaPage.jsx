import { useMemo, useState } from 'react';
import { Search, KeyRound, Sparkles, Table2 } from 'lucide-react';
import { useApp } from '../lib/appContext';
import { PageHeader, Panel, Button, Loading, EmptyState } from '../components/ui/Primitives';
import DataTable from '../components/DataTable';
import { inferRelationships, listTables, numberFmt, qualifiedName } from '../lib/dbInsights';

export default function SchemaPage() {
  const { report: { report, loading, error }, db, ask } = useApp();
  const tables = useMemo(() => listTables(report), [report]);
  const rels = useMemo(() => (report ? inferRelationships(report) : []), [report]);
  const [selectedKey, setSelectedKey] = useState(null);
  const [filter, setFilter] = useState('');

  const visible = tables.filter((t) => qualifiedName(t.db, t.table).toLowerCase().includes(filter.trim().toLowerCase()));
  const selected = tables.find((t) => `${t.db}.${t.table}` === selectedKey) || visible[0] || null;
  const name = selected ? qualifiedName(selected.db, selected.table) : '';
  const related = selected ? rels.filter((r) => r.from === selected || r.to === selected) : [];

  return (
    <div className="ag-page">
      <PageHeader title="Tables & Schema" subtitle={`Every table and column in ${db.activeDb}${Object.keys(db.attachedDbs).length ? ' and attached databases' : ''}.`} />
      {error && <p className="ag-inline-error">{error}</p>}
      {loading && !report ? <Loading label="Reading schema…" /> : tables.length === 0 ? (
        <Panel><EmptyState icon={Table2} title="No tables">This database has no tables yet.</EmptyState></Panel>
      ) : (
        <div className="ag-schema">
          <Panel className="ag-schema-list">
            <label className="ag-input-icon">
              <Search size={14} />
              <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter tables" aria-label="Filter tables" />
            </label>
            <ul>
              {visible.map((t) => {
                const key = `${t.db}.${t.table}`;
                const isSel = selected && key === `${selected.db}.${selected.table}`;
                return (
                  <li key={key}>
                    <button type="button" className={isSel ? 'is-active' : ''} onClick={() => setSelectedKey(key)} aria-current={isSel || undefined}>
                      <Table2 size={14} />
                      <span className="ag-schema-name">{qualifiedName(t.db, t.table)}</span>
                      <span className="ag-schema-count">{numberFmt.format(t.info.row_count)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>

          {selected && (
            <div className="ag-schema-detail" key={name}>
              <Panel
                title={name}
                subtitle={`${numberFmt.format(selected.info.row_count)} rows · ${selected.info.columns.length} columns`}
                actions={<Button icon={Sparkles} onClick={() => ask(`Describe the ${name} table and summarize its key patterns`)}>Ask about this table</Button>}
              >
                <div className="ag-table-scroll">
                  <table className="ag-table ag-cols-table">
                    <thead><tr><th>Column</th><th>Type</th><th>Key</th><th>Nullable</th><th>Statistics</th></tr></thead>
                    <tbody>
                      {selected.info.columns.map((c) => {
                        const s = selected.info.stats?.[c.name];
                        return (
                          <tr key={c.name}>
                            <td><b>{c.name}</b></td>
                            <td><span className="ag-type">{c.type || 'ANY'}</span></td>
                            <td>{c.pk ? <span className="ag-pk"><KeyRound size={11} /> Primary</span> : related.some((r) => r.to === selected && r.column === c.name) ? <span className="ag-fk">References</span> : <span className="ag-cell-muted">—</span>}</td>
                            <td className="ag-cell-muted">{c.notnull || (c.pk && /^int/i.test(c.type || '')) ? 'No' : 'Yes'}</td>
                            <td className="ag-cell-muted">{s ? `min ${numberFmt.format(s.min)} · max ${numberFmt.format(s.max)} · avg ${numberFmt.format(s.avg)}` : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {related.length > 0 && (
                  <p className="ag-rel-note">
                    Inferred relationships: {related.map((r, i) => (
                      <span key={i} className="ag-rel">{qualifiedName(r.from.db, r.from.table)} → {qualifiedName(r.to.db, r.to.table)} <em>via {r.column}</em></span>
                    ))}
                  </p>
                )}
              </Panel>
              {selected.info.sample?.length > 0 && (
                <Panel title="Sample rows" subtitle="First 5 rows">
                  <DataTable data={selected.info.sample} compact />
                </Panel>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
