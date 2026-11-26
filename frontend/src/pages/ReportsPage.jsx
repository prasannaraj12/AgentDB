import { Download, RefreshCw, TriangleAlert, KeyRound } from 'lucide-react';
import { useApp } from '../lib/appContext';
import { PageHeader, Panel, Button, Loading, EmptyState } from '../components/ui/Primitives';
import DataTable from '../components/DataTable';
import { anomalyFindings, databaseTotals, listTables, numberFmt, qualifiedName } from '../lib/dbInsights';
import { downloadReportHtml } from '../lib/reportHtml';

function Stat({ label, value, tone }) {
  return (
    <div className={`ag-stat tone-${tone}`}>
      <span className="ag-stat-value">{value}</span>
      <span className="ag-stat-label">{label}</span>
    </div>
  );
}

export default function ReportsPage() {
  const { report: { report, loading, error, refresh }, db } = useApp();
  const tables = listTables(report);
  const totals = report ? databaseTotals(report) : null;
  const outliers = report ? anomalyFindings(report) : [];

  return (
    <div className="ag-page">
      <PageHeader
        title="Database Report"
        subtitle={`Row counts, column statistics and outliers for ${db.activeDb}${Object.keys(db.attachedDbs).length ? ' and attached databases' : ''}.`}
        actions={(
          <>
            <Button icon={RefreshCw} onClick={refresh} disabled={loading}>Refresh</Button>
            <Button variant="dark" icon={Download} onClick={() => downloadReportHtml(report)} disabled={!report}>Download HTML</Button>
          </>
        )}
      />

      {error && <p className="ag-inline-error">{error}</p>}
      {loading && !report && <Loading label="Generating report…" />}

      {totals && (
        <div className="ag-stat-row">
          <Stat tone="peach" label="Records" value={numberFmt.format(totals.totalRecords)} />
          <Stat tone="blue" label="Tables" value={totals.tableCount} />
          <Stat tone="grey" label="Columns" value={totals.columns} />
          <Stat tone="violet" label="Columns with outliers" value={outliers.length} />
        </div>
      )}

      {report && tables.length === 0 && <EmptyState title="No tables found">This database is empty.</EmptyState>}

      {tables.map(({ db: dbName, table, info }, i) => (
        <Panel
          key={`${dbName}.${table}`}
          className="ag-report-table"
          style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
          title={qualifiedName(dbName, table)}
          subtitle={`${numberFmt.format(info.row_count)} rows · ${info.columns.length} columns`}
        >
          <div className="ag-col-pills">
            {info.columns.map((c) => (
              <span key={c.name} className={`ag-col-pill ${c.pk ? 'is-pk' : ''}`}>
                {c.pk && <KeyRound size={11} />}{c.name}<em>{c.type || 'ANY'}</em>
              </span>
            ))}
          </div>

          {Object.keys(info.stats || {}).length > 0 && (
            <div className="ag-table-scroll ag-report-stats">
              <table className="ag-table">
                <thead>
                  <tr><th>Numeric column</th><th className="num">Min</th><th className="num">Max</th><th className="num">Average</th><th className="num">Total</th><th>Outliers</th></tr>
                </thead>
                <tbody>
                  {Object.entries(info.stats).map(([col, s]) => (
                    <tr key={col}>
                      <td><b>{col}</b></td>
                      <td className="num">{numberFmt.format(s.min)}</td>
                      <td className="num">{numberFmt.format(s.max)}</td>
                      <td className="num">{numberFmt.format(s.avg)}</td>
                      <td className="num">{numberFmt.format(s.total)}</td>
                      <td>{s.anomalies
                        ? <span className="ag-outlier"><TriangleAlert size={11} /> {s.anomalies} beyond 2σ</span>
                        : <span className="ag-cell-muted">None</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {info.sample?.length > 0 && (
            <div className="ag-report-sample">
              <p className="ag-section-label">Sample rows</p>
              <DataTable data={info.sample} compact />
            </div>
          )}
        </Panel>
      ))}
    </div>
  );
}
