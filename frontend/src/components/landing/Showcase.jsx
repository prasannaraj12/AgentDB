import { useEffect, useRef, useState } from 'react';
import { BarChart3, LineChart, Lightbulb, Sparkles, ArrowUp } from 'lucide-react';
import { highlightSql } from '../../lib/sqlHighlight';
import { usePointerVars, prefersReducedMotion } from './motion';

// Illustrative content. Figures are real query results from the bundled sample
// database (backend/database/setup_db.py) at the time of writing; the sample is
// randomly generated, so a freshly built database will show different numbers.
const CATEGORY_SALES = [
  { label: 'Electronics', value: 86232.3 },
  { label: 'Books', value: 58745.89 },
  { label: 'Sports', value: 55562.12 },
  { label: 'Home & Garden', value: 47560.65 },
];
const MONTHLY_REVENUE = [
  ['Nov', 5470.49], ['Dec', 15979.5], ['Jan', 14809.12], ['Feb', 20776.01], ['Mar', 13152.46],
  ['Apr', 24795.74], ['May', 23320.2], ['Jun', 24901.09], ['Jul', 22920.78], ['Aug', 29674.46],
  ['Sep', 11625.3], ['Oct', 23254.43], ['Nov', 17421.38],
];

const SCENES = {
  bar: {
    label: 'Bar Chart', icon: BarChart3,
    question: 'Show me a bar chart of sales by product category.',
    answer: "Here's the bar chart of sales by product category.",
    sql: `SELECT p.category,
       SUM(oi.quantity * oi.unit_price) AS total_sales
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
GROUP BY p.category
ORDER BY total_sales DESC`,
    meta: '4 rows',
  },
  line: {
    label: 'Line Chart', icon: LineChart,
    question: 'Give me a line chart of monthly revenue.',
    answer: 'Monthly revenue over the last 13 months, peaking in August.',
    sql: `SELECT strftime('%Y-%m', order_date) AS month,
       SUM(total_amount) AS revenue
FROM orders
GROUP BY month
ORDER BY month`,
    meta: '13 rows',
  },
  insights: {
    label: 'AI Insights', icon: Lightbulb,
    question: 'What stands out in sales by category?',
    answer: 'Electronics clearly leads; the other three categories are close together.',
    sql: `SELECT p.category,
       SUM(oi.quantity * oi.unit_price) AS total_sales
FROM order_items oi
JOIN products p ON oi.product_id = p.product_id
GROUP BY p.category
ORDER BY total_sales DESC`,
    meta: '4 rows',
  },
};
const ORDER = ['bar', 'line', 'insights'];
const usd = (v) => `$${Math.round(v).toLocaleString('en-US')}`;
const usdK = (v) => `$${(v / 1000).toFixed(1)}k`;

function Bars() {
  const max = Math.max(...CATEGORY_SALES.map((d) => d.value));
  return (
    <div className="lp-demo-bars" role="img" aria-label="Bar chart of total sales by category">
      {CATEGORY_SALES.map((d, i) => (
        <div key={d.label} className="lp-demo-bar-col">
          <span className="lp-demo-bar-val">{usdK(d.value)}</span>
          <div className="lp-demo-bar-track">
            <div className={`lp-demo-bar tone-${i}`} style={{ height: `${(d.value / max) * 100}%`, animationDelay: `${120 + i * 90}ms` }} />
          </div>
          <span className="lp-demo-bar-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Line() {
  // Draw in real pixels (no viewBox stretching) so dots stay round and the stroke reveal is exact.
  const boxRef = useRef(null);
  const [W, setW] = useState(640);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = 190, P = 14;
  const vals = MONTHLY_REVENUE.map((d) => d[1]);
  const max = Math.max(...vals) * 1.08;
  const pts = vals.map((v, i) => [P + (i * (W - 2 * P)) / (vals.length - 1), H - P - (v / max) * (H - 2 * P)]);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const area = `${path} L${pts[pts.length - 1][0]} ${H - P} L${pts[0][0]} ${H - P} Z`;
  const peak = vals.indexOf(Math.max(...vals));
  return (
    <div className="lp-demo-line" role="img" aria-label="Line chart of monthly revenue" ref={boxRef}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        <defs>
          <linearGradient id="lpArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7557FF" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#7557FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => <line key={f} x1={P} x2={W - P} y1={P + f * (H - 2 * P)} y2={P + f * (H - 2 * P)} className="lp-demo-grid" />)}
        <path d={area} fill="url(#lpArea)" className="lp-demo-area" />
        <path d={path} className="lp-demo-path" pathLength="1" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={i === peak ? 4 : 2.4} className={i === peak ? 'lp-demo-dot is-peak' : 'lp-demo-dot'} style={{ animationDelay: `${300 + i * 45}ms` }} />)}
      </svg>
      <div className="lp-demo-line-labels">{MONTHLY_REVENUE.map(([m], i) => <span key={i}>{m}</span>)}</div>
      <span className="lp-demo-peak" style={{ left: `${(pts[peak][0] / W) * 100}%`, top: `${(pts[peak][1] / H) * 100}%` }}>{usdK(vals[peak])}</span>
    </div>
  );
}

function Insights() {
  const total = CATEGORY_SALES.reduce((s, d) => s + d.value, 0);
  const [first, second, third, last] = CATEGORY_SALES;
  return (
    <div className="lp-demo-insights">
      <ul>
        <li><b>{first.label}</b> leads with {usd(first.value)} — {((first.value / total) * 100).toFixed(1)}% of {usd(total)} in total sales.</li>
        <li><b>{second.label}</b> and <b>{third.label}</b> are close: only {usd(second.value - third.value)} apart.</li>
        <li><b>{last.label}</b> is the smallest category at {usd(last.value)} ({((last.value / total) * 100).toFixed(1)}%).</li>
      </ul>
      <table>
        <thead><tr><th>category</th><th>total_sales</th></tr></thead>
        <tbody>{CATEGORY_SALES.map((d) => <tr key={d.label}><td>{d.label}</td><td>{d.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

export default function Showcase() {
  const [scene, setScene] = useState('bar');
  const [auto, setAuto] = useState(true);
  const stageRef = useRef(null);
  const rootRef = useRef(null);
  usePointerVars(stageRef, { ease: 0.1 });

  // Gently cycle scenes while the showcase is on screen, until the visitor picks one.
  useEffect(() => {
    if (!auto || prefersReducedMotion()) return undefined;
    let timer = 0;
    let onScreen = false;
    const io = new IntersectionObserver(([e]) => {
      onScreen = e.isIntersecting;
      clearInterval(timer);
      if (onScreen) timer = setInterval(() => setScene((s) => ORDER[(ORDER.indexOf(s) + 1) % ORDER.length]), 6500);
    }, { threshold: 0.35 });
    if (rootRef.current) io.observe(rootRef.current);
    return () => { clearInterval(timer); io.disconnect(); };
  }, [auto]);

  const s = SCENES[scene];
  const pick = (key) => { setScene(key); setAuto(false); };

  return (
    <div className="lp-showcase" ref={rootRef}>
      <div className="lp-tabs" role="tablist" aria-label="Product preview">
        {ORDER.map((key) => {
          const Icon = SCENES[key].icon;
          return (
            <button key={key} type="button" role="tab" aria-selected={scene === key} aria-controls="lp-demo-panel"
              className={scene === key ? 'is-active' : ''} onClick={() => pick(key)}>
              <Icon size={14} /> {SCENES[key].label}
              {scene === key && auto && <span className="lp-tab-progress" key={`p-${key}`} />}
            </button>
          );
        })}
      </div>

      <div className="lp-stage" ref={stageRef} onPointerEnter={() => setAuto(false)}>
        <div className="lp-window">
          <span className="lp-window-glare" aria-hidden="true" />
          <div className="lp-window-bar">
            <span className="lp-dots" aria-hidden="true"><i /><i /><i /></span>
            <span className="lp-window-title">AgentDB · AI Workspace</span>
            <span className="lp-window-chip">Illustrative preview · sample database</span>
          </div>

          <div className="lp-window-body" id="lp-demo-panel" role="tabpanel" key={scene}>
            <div className="lp-demo-user">{s.question}</div>
            <div className="lp-demo-agent">
              <span className="lp-demo-avatar"><Sparkles size={13} /></span>
              <div className="lp-demo-content">
                <p className="lp-demo-answer">{s.answer}</p>
                <div className="lp-sql">
                  <div className="lp-sql-head"><span>SQL</span><em>Success · {s.meta}</em></div>
                  <pre><code>{highlightSql(s.sql)}</code></pre>
                </div>
                <div className="lp-demo-viz">
                  {scene === 'bar' && <Bars />}
                  {scene === 'line' && <Line />}
                  {scene === 'insights' && <Insights />}
                </div>
              </div>
            </div>
            <div className="lp-demo-composer" aria-hidden="true">
              <span>Ask about your data…</span>
              <span className="lp-demo-send"><ArrowUp size={13} /></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
