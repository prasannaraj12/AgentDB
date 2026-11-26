import { History } from 'lucide-react';
import { Panel, StatusDot, EmptyState } from '../ui/Primitives';
import { formatDate, formatDuration } from '../../lib/dbInsights';
import { navigate, ROUTES } from '../../lib/router';

export function QueryTable({ rows, onRowClick, showRows = false, renderAction }) {
  return (
    <div className="ag-table-scroll">
      <table className="ag-table">
        <thead>
          <tr>
            <th>Query</th>
            <th>Database</th>
            <th>Date</th>
            {showRows && <th className="num">Rows</th>}
            <th className="num">Duration</th>
            <th>Status</th>
            {renderAction && <th><span className="ag-visually-hidden">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((e) => (
            <tr key={e.id || e.ts} onClick={onRowClick ? () => onRowClick(e) : undefined} className={onRowClick ? 'is-clickable' : ''}>
              <td className="ag-cell-query" title={e.query}>{e.query}</td>
              <td className="ag-cell-muted ag-col-db" title={e.db || undefined}>{e.db || '—'}</td>
              <td className="ag-cell-muted">{formatDate(e.ts)}</td>
              {showRows && <td className="num">{typeof e.rows === 'number' ? e.rows : '—'}</td>}
              <td className="num">{formatDuration(e.durationMs)}</td>
              <td title={e.error || undefined}><StatusDot status={e.status} /></td>
              {renderAction && <td className="ag-cell-action">{renderAction(e)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RecentQueries({ history }) {
  const rows = history.slice(0, 5);
  return (
    <Panel
      className="ag-recent"
      title="Recent Queries"
      actions={history.length > 0 && (
        <a className="ag-link" href={ROUTES.history} onClick={(e) => { e.preventDefault(); navigate(ROUTES.history); }}>View all</a>
      )}
    >
      {rows.length ? <QueryTable rows={rows} /> : (
        <EmptyState icon={History} title="No queries yet">
          Questions you ask in the AI Workspace appear here with their status.
        </EmptyState>
      )}
    </Panel>
  );
}
