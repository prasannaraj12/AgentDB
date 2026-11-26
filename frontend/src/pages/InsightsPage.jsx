import { useMemo, useState } from 'react';
import { Sparkles, Pin, Share2, Link, Check, X, Trash2 } from 'lucide-react';
import { useApp } from '../lib/appContext';
import { useQueryHistory } from '../lib/queryHistory';
import { InsightList } from '../components/dashboard/insights';
import { buildInsights } from '../lib/buildInsights';
import { ChartBody } from '../components/ChartRenderer';
import { PageHeader, Panel, Button, EmptyState, Loading } from '../components/ui/Primitives';
import { navigate, ROUTES } from '../lib/router';

function ShareControl({ charts }) {
  const [url, setUrl] = useState(null);
  const [state, setState] = useState('idle');

  const share = async () => {
    setState('sharing');
    try {
      const res = await fetch('/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charts, title: 'AgentDB Dashboard' }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUrl(`${window.location.origin}/share/${data.token}`);
      setState('idle');
    } catch {
      setState('error');
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setState('copied'); setTimeout(() => setState('idle'), 1600); } catch { /* ignore */ }
  };

  if (url) {
    return (
      <div className="ag-share-url">
        <span title={url}>{url}</span>
        <button type="button" className="ag-mini-btn" onClick={copy}>{state === 'copied' ? <Check size={12} /> : <Link size={12} />}{state === 'copied' ? 'Copied' : 'Copy link'}</button>
      </div>
    );
  }
  return (
    <>
      {state === 'error' && <span className="ag-inline-error">Could not create link.</span>}
      <Button icon={Share2} onClick={share} disabled={state === 'sharing'}>{state === 'sharing' ? 'Creating link…' : 'Share board'}</Button>
    </>
  );
}

export default function InsightsPage() {
  const { report: { report, loading }, db, ask, pinnedCharts, unpinChart, clearPinned } = useApp();
  const history = useQueryHistory();
  const items = useMemo(
    () => buildInsights({ report, history, activeDb: db.activeDb, includePatterns: true }),
    [report, history, db.activeDb],
  );

  return (
    <div className="ag-page">
      <PageHeader
        title="Insights"
        subtitle={`Facts about ${db.activeDb} and your query activity, plus the charts you pinned.`}
        actions={<Button variant="dark" icon={Sparkles} onClick={() => ask('Give me the key insights about this database')}>Ask AgentDB for insights</Button>}
      />
      {loading && !report ? <Loading label={`Analyzing ${db.activeDb}…`} /> : (
        <div className="ag-insight-grid"><InsightList items={items} /></div>
      )}

      <Panel
        className="ag-pinned"
        title="Pinned charts"
        subtitle="Pin a chart from any AI Workspace answer to keep it here."
        actions={pinnedCharts.length > 0 && (
          <>
            <ShareControl charts={pinnedCharts} />
            <Button icon={Trash2} className="ag-btn-danger" onClick={clearPinned}>Clear</Button>
          </>
        )}
      >
        {pinnedCharts.length === 0 ? (
          <EmptyState
            icon={Pin}
            title="No pinned charts yet"
            action={<Button variant="dark" onClick={() => navigate(ROUTES.workspace)}>Create a chart</Button>}
          >
            Ask for a bar, line, pie or scatter chart, then press Pin on the result.
          </EmptyState>
        ) : (
          <div className="ag-pinned-grid">
            {pinnedCharts.map((c, i) => (
              <div key={i} className="ag-pinned-card">
                <div className="ag-pinned-head">
                  <div>
                    <p className="ag-chart-title">{c.title}</p>
                    <p className="ag-chart-sub">{c.chart_type} · {c.data?.length || 0} points</p>
                  </div>
                  <button type="button" className="ag-icon-btn" onClick={() => unpinChart(i)} aria-label={`Unpin ${c.title}`}><X size={14} /></button>
                </div>
                <ChartBody config={c} height={220} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
