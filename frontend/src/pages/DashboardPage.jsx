import { useMemo } from 'react';
import { Database, Clock, Sparkles } from 'lucide-react';
import { useApp } from '../lib/appContext';
import { useQueryHistory, successStats, dailyCounts } from '../lib/queryHistory';
import { databaseTotals, formatRelative, numberFmt } from '../lib/dbInsights';
import { navigate, ROUTES } from '../lib/router';
import { Panel, RoundAction } from '../components/ui/Primitives';
import QueryActivity from '../components/dashboard/QueryActivity';
import RecentQueries from '../components/dashboard/RecentQueries';
import { InsightList } from '../components/dashboard/insights';
import { buildInsights } from '../lib/buildInsights';

function MetricCard({ tone, title, label, value, onOpen, actionLabel, delay }) {
  return (
    <div className={`ag-metric tone-${tone}`} style={{ animationDelay: `${delay}ms` }}>
      <p className="ag-metric-title">{title}</p>
      <p className="ag-metric-label">{label}</p>
      <p className="ag-metric-value">{value}</p>
      <span className="ag-notch ag-notch-br">
        <RoundAction onClick={onOpen} label={actionLabel} />
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { report: { report, loading, error }, db, displayName } = useApp();
  const history = useQueryHistory();

  const totals = report ? databaseTotals(report) : null;
  const sqlStats = successStats(history.filter((e) => e.kind !== 'chat'));
  const weekCount = useMemo(() => dailyCounts(history, 7).reduce((s, b) => s + b.count, 0), [history]);
  const lastQuery = history[0];
  const insights = useMemo(
    () => buildInsights({ report, history, activeDb: db.activeDb }),
    [report, history, db.activeDb],
  );

  const pending = loading && !report ? '…' : '—';
  const dbCount = 1 + Object.keys(db.attachedDbs).length;

  return (
    <div className="ag-dashboard">
      <Panel as="section" className="ag-hero">
        <div className="ag-hero-main">
          <h1 className="ag-hello">{displayName ? `Hello, ${displayName}` : 'Welcome to AgentDB'}</h1>
          <p className="ag-hello-sub">
            {error ? error : 'Explore your data and uncover meaningful insights with AgentDB.'}
          </p>
          <div className="ag-metrics">
            <MetricCard
              tone="peach" delay={40}
              title="Total Records"
              label={totals ? `Across ${totals.tableCount} tables` : 'Rows in all tables'}
              value={totals ? numberFmt.format(totals.totalRecords) : pending}
              onOpen={() => navigate(ROUTES.schema)} actionLabel="Open tables and schema"
            />
            <MetricCard
              tone="blue" delay={100}
              title="Database Tables"
              label={totals ? `${totals.columns} columns · ${dbCount} database${dbCount > 1 ? 's' : ''}` : 'Tables in the active database'}
              value={totals ? numberFmt.format(totals.tableCount) : pending}
              onOpen={() => navigate(ROUTES.explorer)} actionLabel="Open database explorer"
            />
            <MetricCard
              tone="grey" delay={160}
              title="Query Success Rate"
              label={sqlStats.tracked ? `${sqlStats.succeeded} of ${sqlStats.tracked} queries` : 'No queries tracked yet'}
              value={sqlStats.rate === null ? '—' : `${Math.round(sqlStats.rate * 1000) / 10}%`}
              onOpen={() => navigate(ROUTES.history)} actionLabel="Open query history"
            />
          </div>
        </div>

        <div className="ag-hero-side">
          <div className="ag-pills">
            <div className="ag-time-pill is-dark">
              <span className="ag-time-icon is-accent"><Database size={15} /></span>
              <div className="ag-time-main">
                <span className="ag-time-value">{weekCount} {weekCount === 1 ? 'query' : 'queries'}</span>
                <span className="ag-time-sub">Last 7 days</span>
              </div>
              <span className="ag-time-tag">Asked</span>
            </div>
            <div className="ag-time-pill">
              <span className="ag-time-icon"><Clock size={15} /></span>
              <div className="ag-time-main">
                <span className="ag-time-value">{lastQuery ? formatRelative(lastQuery.ts) : 'No queries'}</span>
                <span className="ag-time-sub">Last query</span>
              </div>
              <span className="ag-time-tag">Activity</span>
            </div>
          </div>

          <div className="ag-promo">
            <span className="ag-notch ag-notch-tl">
              <span className="ag-chip"><Sparkles size={11} /> AI</span>
            </span>
            <span className="ag-promo-art" aria-hidden="true" />
            <h2 className="ag-promo-title">Your data.<br />Your intelligence.</h2>
            <p className="ag-promo-text">Turn natural-language questions into actionable database insights.</p>
            <span className="ag-promo-action">
              <RoundAction onClick={() => navigate(ROUTES.workspace)} label="Open AI Workspace" />
            </span>
          </div>
        </div>
      </Panel>

      <div className="ag-lower">
        <QueryActivity history={history} />
        <RecentQueries history={history} />
        <Panel className="ag-insights-panel" title="AI Insights">
          {loading && !report ? <p className="ag-muted">Analyzing {db.activeDb}…</p> : <InsightList items={insights} />}
        </Panel>
      </div>
    </div>
  );
}
