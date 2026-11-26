import { useMemo } from 'react';
import { Sparkles, Network, Copy } from 'lucide-react';
import { useApp } from '../lib/appContext';
import { PageHeader, Panel, Button, Loading, EmptyState } from '../components/ui/Primitives';
import MermaidDiagram from '../components/MermaidDiagram';
import { buildErDiagram, inferRelationships, listTables, qualifiedName } from '../lib/dbInsights';

export default function ErDiagramPage() {
  const { report: { report, loading, error }, db, ask } = useApp();
  const diagram = useMemo(() => (report ? buildErDiagram(report) : ''), [report]);
  const rels = useMemo(() => (report ? inferRelationships(report) : []), [report]);
  const tableCount = listTables(report).length;

  return (
    <div className="ag-page">
      <PageHeader
        title="ER Diagrams"
        subtitle={`Entity–relationship diagram generated from the live schema of ${db.activeDb}.`}
        actions={(
          <>
            <Button icon={Copy} disabled={!diagram} onClick={() => navigator.clipboard?.writeText(diagram)}>Copy Mermaid</Button>
            <Button variant="dark" icon={Sparkles} onClick={() => ask('Draw the ER diagram of this database')}>Generate with AI</Button>
          </>
        )}
      />
      {error && <p className="ag-inline-error">{error}</p>}
      {loading && !report ? <Loading label="Reading schema…" /> : !diagram ? (
        <Panel><EmptyState icon={Network} title="No tables to diagram">Upload or select a database with tables.</EmptyState></Panel>
      ) : (
        <>
          <Panel className="ag-er-panel" title={`${tableCount} tables · ${rels.length} relationships`}
            subtitle="Relationships are inferred from column names (for example customer_id → customers), because SQLite foreign keys are not exposed by the API.">
            <MermaidDiagram content={diagram} />
          </Panel>
          {rels.length > 0 && (
            <Panel title="Relationships">
              <div className="ag-table-scroll">
                <table className="ag-table">
                  <thead><tr><th>Parent table</th><th>Child table</th><th>Column</th><th>Cardinality</th></tr></thead>
                  <tbody>
                    {rels.map((r, i) => (
                      <tr key={i}>
                        <td><b>{qualifiedName(r.from.db, r.from.table)}</b></td>
                        <td>{qualifiedName(r.to.db, r.to.table)}</td>
                        <td><span className="ag-type">{r.column}</span></td>
                        <td className="ag-cell-muted">One to many</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
