import { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { Panel, EmptyState, Button } from '../ui/Primitives';
import { dailyCounts, previousPeriodCount } from '../../lib/queryHistory';
import { navigate, ROUTES } from '../../lib/router';

const PERIODS = [
  { value: 7, label: 'Week' },
  { value: 14, label: '2 Weeks' },
];

function barTone(count, max) {
  if (!count) return 'is-empty';
  const ratio = count / max;
  if (ratio >= 0.85) return 'tone-strong';
  if (ratio >= 0.5) return 'tone-mid';
  return 'tone-soft';
}

export default function QueryActivity({ history }) {
  const [days, setDays] = useState(7);
  const [hover, setHover] = useState(null);

  const buckets = useMemo(() => dailyCounts(history, days), [history, days]);
  const total = buckets.reduce((s, b) => s + b.count, 0);
  const prev = useMemo(() => previousPeriodCount(history, days), [history, days]);
  const max = Math.max(1, ...buckets.map((b) => b.count));
  const peakIndex = buckets.reduce((best, b, i) => (b.count > buckets[best].count ? i : best), 0);
  const shown = hover ?? (total ? peakIndex : null);
  const todayIndex = buckets.length - 1;

  let delta = null;
  if (prev !== null && prev > 0) {
    const change = Math.round(((total - prev) / prev) * 100);
    delta = { text: `${change >= 0 ? '+' : ''}${change}% vs previous ${days} days`, up: change >= 0 };
  } else if (prev === 0 && total > 0) {
    delta = { text: `Up from 0 in the previous ${days} days`, up: true };
  }

  return (
    <Panel
      className="ag-activity"
      title="Query Activity"
      subtitle="Database interaction over time"
      actions={(
        <label className="ag-select-pill">
          <span className="ag-visually-hidden">Period</span>
          <select value={days} onChange={(e) => { setDays(Number(e.target.value)); setHover(null); }}>
            {PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
      )}
    >
      {history.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No query activity yet"
          action={<Button variant="dark" onClick={() => navigate(ROUTES.workspace)}>Open AI Workspace</Button>}
        >
          Every question you ask AgentDB is tracked here by day.
        </EmptyState>
      ) : (
        <div className="ag-activity-body">
          <div className="ag-activity-summary">
            <p className="ag-activity-total">{total}</p>
            <p className="ag-activity-label">{total === 1 ? 'query' : 'queries'} in the last {days} days</p>
            {delta && <span className={`ag-delta ${delta.up ? 'is-up' : 'is-down'}`}>{delta.text}</span>}
          </div>
          <div className={`ag-bars ${days > 7 ? 'is-dense' : ''}`} onMouseLeave={() => setHover(null)}>
            {buckets.map((b, i) => {
              const d = new Date(b.dayStart);
              const label = days > 7 ? d.getDate() : d.toLocaleDateString(undefined, { weekday: 'short' });
              const height = b.count ? 34 + (b.count / max) * 66 : 30;
              const isToday = i === todayIndex;
              return (
                <div
                  key={b.dayStart}
                  className="ag-bar-col"
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  tabIndex={0}
                  aria-label={`${d.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}: ${b.count} queries`}
                >
                  <div className="ag-bar-track">
                    <div
                      className={`ag-bar ${barTone(b.count, max)} ${isToday && b.count ? 'is-today' : ''}`}
                      style={{ height: `${height}%`, animationDelay: `${i * 40}ms` }}
                    >
                      {shown === i && (
                        <span className="ag-bar-tip">
                          {b.count} {b.count === 1 ? 'query' : 'queries'}
                          <span className="ag-bar-tip-dot" />
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`ag-bar-label ${isToday ? 'is-today' : ''}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Panel>
  );
}
