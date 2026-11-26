import { useMemo, useState } from 'react';
import { History, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useApp } from '../lib/appContext';
import { useQueryHistory, clearHistory, successStats } from '../lib/queryHistory';
import { QueryTable } from '../components/dashboard/RecentQueries';
import { PageHeader, Panel, Button, EmptyState, Segmented } from '../components/ui/Primitives';
import { formatDuration } from '../lib/dbInsights';

export default function HistoryPage() {
  const { ask, chat } = useApp();
  const history = useQueryHistory();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return history.filter((e) =>
      (filter === 'all' || e.status === filter)
      && (!q || e.query.toLowerCase().includes(q) || (e.sql || '').toLowerCase().includes(q) || (e.db || '').toLowerCase().includes(q)));
  }, [history, filter, search]);

  const stats = successStats(history);

  const onClear = () => {
    if (window.confirm(`Delete all ${history.length} saved queries from this browser? This cannot be undone.`)) clearHistory();
  };

  return (
    <div className="ag-page">
      <PageHeader
        title="Query History"
        subtitle={history.length
          ? `${history.length} questions saved in this browser · ${stats.succeeded} succeeded · ${stats.failed} failed`
            + (stats.avgDurationMs !== null ? ` · average ${formatDuration(stats.avgDurationMs)}` : '')
          : 'Every question you ask is saved here with its outcome.'}
        actions={history.length > 0 && <Button icon={Trash2} className="ag-btn-danger" onClick={onClear}>Clear history</Button>}
      />
      <Panel
        className="ag-history"
        actions={null}
      >
        <div className="ag-toolbar">
          <label className="ag-input-icon">
            <Search size={14} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions, SQL or database" aria-label="Search history" />
          </label>
          <Segmented
            label="Filter by status"
            value={filter}
            onChange={setFilter}
            options={[{ value: 'all', label: 'All' }, { value: 'success', label: 'Success' }, { value: 'failed', label: 'Failed' }]}
          />
        </div>
        {rows.length ? (
          <QueryTable
            rows={rows}
            showRows
            renderAction={(e) => (
              <button type="button" className="ag-mini-btn" onClick={() => ask(e.query)} disabled={chat.isLoading} title="Ask this question again in the AI Workspace">
                <RotateCcw size={12} /> Ask again
              </button>
            )}
          />
        ) : (
          <EmptyState icon={History} title={history.length ? 'No matching queries' : 'No queries yet'}>
            {history.length ? 'Try a different search or filter.' : 'Ask a question in the AI Workspace to get started.'}
          </EmptyState>
        )}
      </Panel>
    </div>
  );
}
