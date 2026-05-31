import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Database, BarChart2, GitBranch, Zap, ChevronDown, Star, ArrowRight, Table, Brain, Share2, CheckCircle, TrendingUp, PieChart, Mic, Download, History, Shield, Play, Terminal, Cpu, Globe } from 'lucide-react';

/* ── Live Query Prompts ───────────────────────────────── */
const LIVE_QUERIES = [
  'Show top 10 customers by revenue',
  'Plot monthly sales trend as a line chart',
  'Which product category has the highest margin?',
  'Find all orders above $500 in Q4',
  'Show a pie chart of sales by region',
  'Who are the top 5 artists by track count?',
  'Compare revenue across all product categories',
  'Show me a bar chart of rentals by film rating',
];

/* ── Animated Stats ───────────────────────────────────── */
const STATS = [
  { value: 500, suffix: '+', label: 'Developers', color: '#6b4cff' },
  { value: 12, suffix: 'K+', label: 'Queries Run', color: '#00C49F' },
  { value: 4, suffix: ' DBs', label: 'Built-in Datasets', color: '#FFBB28' },
  { value: 99, suffix: '%', label: 'Accuracy', color: '#FF8042' },
];

/* ── Schema Preview Data ──────────────────────────────── */
const SCHEMA_TABLES = [
  { name: 'customers', cols: ['id', 'name', 'email', 'country'], color: '#6b4cff' },
  { name: 'orders', cols: ['id', 'customer_id', 'total', 'date'], color: '#00C49F' },
  { name: 'products', cols: ['id', 'name', 'category', 'price'], color: '#FFBB28' },
  { name: 'tracks', cols: ['id', 'title', 'artist_id', 'genre'], color: '#FF8042' },
];

/* ── Data ─────────────────────────────────────────────── */
const FEATURES = [
  { icon: <Database size={18} />, color: '#6b4cff', title: 'Natural Language → SQL', desc: 'Ask in plain English. AgentDB converts it to SQL and runs it instantly.' },
  { icon: <BarChart2 size={18} />, color: '#00C49F', title: 'Interactive Charts', desc: 'Bar, line, pie, and scatter charts rendered automatically.' },
  { icon: <Brain size={18} />, color: '#FF8042', title: 'AI Insights', desc: 'Bullet-point analysis by Gemini 2.5 Flash on every query.' },
  { icon: <Table size={18} />, color: '#FFBB28', title: 'Multi-Database', desc: 'Upload and switch between multiple SQLite databases.' },
  { icon: <Share2 size={18} />, color: '#00C49F', title: 'Shareable Dashboards', desc: 'Pin charts and share with a single link. No login needed.' },
  { icon: <TrendingUp size={18} />, color: '#6b4cff', title: 'Trend Analysis', desc: 'Spot patterns over time with auto-generated line charts.' },
  { icon: <PieChart size={18} />, color: '#FF8042', title: 'Pie & Scatter Charts', desc: 'Visualize distributions and correlations instantly.' },
  { icon: <Mic size={18} />, color: '#00C49F', title: 'Voice Input', desc: 'Speak your query. AgentDB transcribes and executes it.' },
  { icon: <Download size={18} />, color: '#FFBB28', title: 'CSV Export', desc: 'Export any result as CSV with one click.' },
  { icon: <History size={18} />, color: '#6b4cff', title: 'Query History', desc: 'Every query saved. Replay or re-run from the sidebar.' },
  { icon: <Shield size={18} />, color: '#FF8042', title: 'Local-First Privacy', desc: 'Your data never leaves your machine.' },
  { icon: <GitBranch size={18} />, color: '#00C49F', title: 'Flow Diagrams', desc: 'Map workflows as flowcharts from a single prompt.' },
];

const STEPS = [
  { num: '01', color: '#6b4cff', title: 'Connect your database', desc: 'Upload a SQLite, CSV, or JSON file. Schema parsed automatically.' },
  { num: '02', color: '#00C49F', title: 'Ask in plain English', desc: 'Type any question — queries, charts, diagrams, or insights.' },
  { num: '03', color: '#FFBB28', title: 'Get instant answers', desc: 'Results as tables, charts, and AI-generated insights in seconds.' },
];

const TESTIMONIALS = [
  { quote: 'AgentDB replaced hours of manual SQL work. I just ask and get charts instantly.', name: 'Data Analyst', company: 'E-commerce startup', avatar: 'DA' },
  { quote: 'The flow diagram feature alone saved us days of documentation work.', name: 'Backend Engineer', company: 'SaaS company', avatar: 'BE' },
  { quote: 'Non-technical teammates can now explore our database without any help.', name: 'Product Manager', company: 'Tech company', avatar: 'PM' },
];

const FAQS = [
  { q: 'What databases does AgentDB support?', a: 'AgentDB supports SQLite (.db, .sqlite), CSV, TSV, and JSON files. Upload any of these and start querying immediately.' },
  { q: 'Do I need to know SQL?', a: 'No. AgentDB converts your plain English questions into SQL automatically using Gemini 2.5 Flash.' },
  { q: 'Is my data safe?', a: 'Your database files are stored locally. Only the schema and query context are sent to the Gemini API — never your raw data.' },
  { q: 'Can I share my charts?', a: 'Yes. Pin any chart to the dashboard and click Share to get a public link anyone can view.' },
  { q: 'What chart types are supported?', a: 'Bar, line, pie, and scatter charts via Recharts. Flowcharts via Mermaid.js.' },
];

const CHART_BARS = [
  { h: 65, color: '#6b4cff', label: 'Electronics' },
  { h: 85, color: '#00C49F', label: 'Clothing' },
  { h: 45, color: '#FFBB28', label: 'Books' },
  { h: 90, color: '#FF8042', label: 'Sports' },
  { h: 55, color: '#8884d8', label: 'Home' },
  { h: 72, color: '#6b4cff', label: 'Beauty' },
];

/* ── Typewriter Hook ──────────────────────────────────── */
function useTypewriter(texts, speed = 55, pause = 1800) {
  const [display, setDisplay] = useState('');
  const [idx, setIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = texts[idx];
    let timeout;
    if (!deleting && charIdx < current.length) {
      timeout = setTimeout(() => setCharIdx(c => c + 1), speed);
    } else if (!deleting && charIdx === current.length) {
      timeout = setTimeout(() => setDeleting(true), pause);
    } else if (deleting && charIdx > 0) {
      timeout = setTimeout(() => setCharIdx(c => c - 1), speed / 2);
    } else if (deleting && charIdx === 0) {
      setDeleting(false);
      setIdx(i => (i + 1) % texts.length);
    }
    setDisplay(current.slice(0, charIdx));
    return () => clearTimeout(timeout);
  }, [charIdx, deleting, idx, texts, speed, pause]);

  return display;
}

/* ── Animated Counter ────────────────────────────────── */
function AnimatedCounter({ value, suffix, duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * value));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

/* ── Live Query Terminal ─────────────────────────────── */
function LiveQueryTerminal() {
  const query = useTypewriter(LIVE_QUERIES, 50, 2000);
  const [sqlLines] = useState([
    'SELECT c.name, SUM(o.total) AS revenue',
    'FROM customers c JOIN orders o ON c.id = o.customer_id',
    'GROUP BY c.name ORDER BY revenue DESC LIMIT 10;',
  ]);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    setShowResult(false);
    const t = setTimeout(() => setShowResult(true), 1200);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div style={{ background: 'rgba(10,10,18,0.9)', border: '1px solid rgba(107,76,255,0.3)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(107,76,255,0.1)', maxWidth: 560, margin: '0 auto' }}>
      {/* Terminal chrome */}
      <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        <div style={{ marginLeft: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Terminal size={11} color="#555" />
          <span style={{ fontSize: '0.68rem', color: '#444', letterSpacing: '0.02em' }}>AgentDB — Natural Language Interface</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00C49F', boxShadow: '0 0 6px #00C49F', animation: 'pulse2 2s infinite' }} />
          <span style={{ fontSize: '0.62rem', color: '#00C49F', fontWeight: 600 }}>LIVE</span>
        </div>
      </div>

      {/* NL Input */}
      <div style={{ padding: '14px 16px 10px' }}>
        <div style={{ fontSize: '0.65rem', color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Natural Language Query</div>
        <div style={{ background: 'rgba(107,76,255,0.08)', border: '1px solid rgba(107,76,255,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: '0.85rem', color: '#c4b5fd', minHeight: 38, display: 'flex', alignItems: 'center' }}>
          <span>{query}</span>
          <span style={{ display: 'inline-block', width: 2, height: '1em', background: '#6b4cff', marginLeft: 2, animation: 'blink 0.7s step-end infinite', verticalAlign: 'middle' }} />
        </div>
      </div>

      {/* Arrow */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 16px' }}>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(107,76,255,0.4), transparent)' }} />
        <div style={{ fontSize: '0.65rem', color: '#6b4cff', fontWeight: 700, letterSpacing: '0.06em' }}>AI → SQL</div>
        <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,196,159,0.4))' }} />
      </div>

      {/* SQL Output */}
      <div style={{ padding: '6px 16px 10px' }}>
        <div style={{ fontSize: '0.65rem', color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Generated SQL</div>
        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,196,159,0.2)', borderRadius: 8, padding: '10px 14px', fontFamily: "'SF Mono','Fira Code',monospace", fontSize: '0.75rem', lineHeight: 1.7 }}>
          {sqlLines.map((line, i) => (
            <div key={i} style={{ color: i === 0 ? '#a6e3a1' : i === 1 ? '#89b4fa' : '#cba6f7' }}>{line}</div>
          ))}
        </div>
      </div>

      {/* Result preview */}
      <div style={{ padding: '0 16px 14px', opacity: showResult ? 1 : 0, transition: 'opacity 0.5s ease', transform: showResult ? 'translateY(0)' : 'translateY(6px)' }}>
        <div style={{ fontSize: '0.65rem', color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Results</div>
        <div style={{ background: 'rgba(0,196,159,0.05)', border: '1px solid rgba(0,196,159,0.15)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '6px 12px', background: 'rgba(0,196,159,0.08)', fontSize: '0.65rem', color: '#00C49F', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            <span>name</span><span>revenue</span>
          </div>
          {[['Eleanor Hunt', '$211.55'], ['Karl Schnyder', '$195.10'], ['Astrid Gruber', '$183.15']].map(([n, v], i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto', padding: '5px 12px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '0.75rem' }}>
              <span style={{ color: '#ccc' }}>{n}</span>
              <span style={{ color: '#00C49F', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          <div style={{ padding: '5px 12px', borderTop: '1px solid rgba(255,255,255,0.04)', fontSize: '0.65rem', color: '#444', fontStyle: 'italic' }}>+ 7 more rows · 0.04s</div>
        </div>
      </div>
    </div>
  );
}

/* ── Schema Explorer ─────────────────────────────────── */
function SchemaExplorer() {
  const [activeTable, setActiveTable] = useState(0);
  const t = SCHEMA_TABLES[activeTable];

  return (
    <div style={{ background: 'rgba(10,10,18,0.85)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', maxWidth: 320 }}>
      <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 7 }}>
        <Database size={12} color="#6b4cff" />
        <span style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 600 }}>ecommerce.db</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: '#333', background: 'rgba(107,76,255,0.1)', border: '1px solid rgba(107,76,255,0.2)', borderRadius: 4, padding: '1px 6px' }}>4 tables</span>
      </div>
      <div style={{ display: 'flex', gap: 4, padding: '8px 10px', flexWrap: 'wrap' }}>
        {SCHEMA_TABLES.map((tbl, i) => (
          <button key={i} onClick={() => setActiveTable(i)} style={{ background: activeTable === i ? `${tbl.color}20` : 'transparent', border: `1px solid ${activeTable === i ? tbl.color + '50' : 'rgba(255,255,255,0.07)'}`, borderRadius: 6, padding: '3px 9px', fontSize: '0.68rem', color: activeTable === i ? tbl.color : '#555', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'monospace' }}>
            {tbl.name}
          </button>
        ))}
      </div>
      <div style={{ padding: '4px 14px 14px' }}>
        <div style={{ fontSize: '0.62rem', color: '#444', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Columns</div>
        {t.cols.map((col, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: i < t.cols.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? '#FFBB28' : t.color, flexShrink: 0 }} />
            <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#ccc' }}>{col}</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: '#444', fontFamily: 'monospace' }}>{i === 0 ? 'PK' : i === 1 && col.includes('_id') ? 'FK' : 'TEXT'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── FAQ Item ─────────────────────────────────────────── */
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'none', border: 'none', padding: '22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left', gap: 20 }}>
        <span style={{ color: '#e8e8f0', fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.5 }}>{q}</span>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: open ? '#6b4cff' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
          <ChevronDown size={13} color="#fff" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
        </div>
      </button>
      <div style={{ maxHeight: open ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
        <p style={{ color: '#8a8fa8', fontSize: '0.88rem', lineHeight: 1.8, paddingBottom: 22, margin: 0 }}>{a}</p>
      </div>
    </div>
  );
}

/* ── Demo visuals ─────────────────────────────────────── */
const BarVisual = () => (
  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 14px 10px' }}>
    <div style={{ fontSize: '0.7rem', color: '#6e6e73', marginBottom: 10, fontWeight: 500, letterSpacing: '0.02em' }}>Sales by Product Category</div>
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, height: '80px' }}>
      {CHART_BARS.map((b, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
          <div style={{ width: '100%', height: `${b.h}px`, background: `linear-gradient(180deg, ${b.color}cc, ${b.color}55)`, borderRadius: '3px 3px 0 0', boxShadow: `0 0 8px ${b.color}44` }} />
          <span style={{ fontSize: '0.52rem', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{b.label}</span>
        </div>
      ))}
    </div>
  </div>
);

const LineVisual = () => {
  const pts = [38, 52, 47, 68, 74, 90];
  const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const W = 260, H = 76, pad = 8;
  const maxV = Math.max(...pts);
  const coords = pts.map((v, i) => ({ x: pad + (i / (pts.length - 1)) * (W - pad * 2), y: H - pad - ((v / maxV) * (H - pad * 2)) }));
  const polyline = coords.map(c => `${c.x},${c.y}`).join(' ');
  const area = `${coords[0].x},${H} ` + coords.map(c => `${c.x},${c.y}`).join(' ') + ` ${coords[coords.length - 1].x},${H}`;
  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '14px 14px 10px' }}>
      <div style={{ fontSize: '0.7rem', color: '#6e6e73', marginBottom: 8, fontWeight: 500 }}>Monthly Revenue ($K)</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id="lg2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00C49F" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00C49F" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#lg2)" />
        <polyline points={polyline} fill="none" stroke="#00C49F" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r="3" fill="#00C49F" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" />)}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
        {months.map(m => <span key={m} style={{ fontSize: '0.55rem', color: '#444' }}>{m}</span>)}
      </div>
    </div>
  );
};

const TableVisual = () => (
  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, overflow: 'hidden' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: 'rgba(255,255,255,0.03)', padding: '7px 12px', fontSize: '0.63rem', color: '#444', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      <span>Customer</span><span>Country</span><span style={{ textAlign: 'right' }}>Total</span>
    </div>
    {[['Eleanor Hunt','Canada','$211.55'],['Karl Schnyder','Switzerland','$195.10'],['Astrid Gruber','Austria','$183.15'],['Wyatt Girard','France','$174.90'],['Fynn Zimmermann','Germany','$166.80']].map(([n, c, t], i) => (
      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '7px 12px', fontSize: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <span style={{ color: '#ddd', fontWeight: 500 }}>{n}</span>
        <span style={{ color: '#6e6e73' }}>{c}</span>
        <span style={{ color: '#00C49F', textAlign: 'right', fontWeight: 600 }}>{t}</span>
      </div>
    ))}
  </div>
);

const DEMOS = [
  { label: 'Bar Chart', tag: 'ecommerce.db', tagColor: '#6b4cff', query: 'Show a bar chart of sales by product category', response: "Here's the bar chart of sales by product category:", insight: ['Sports leads with highest revenue at $90K', 'Electronics and Beauty show strong performance', 'Books category has growth opportunity'], insightColor: '#00C49F', Visual: BarVisual },
  { label: 'Line Chart', tag: 'shares.json', tagColor: '#00C49F', query: 'Show monthly revenue trend for the last 6 months', response: "Here's the monthly revenue trend:", insight: ['Revenue grew 34% over 6 months', 'Sharpest spike in October (+18% MoM)', 'Consistent upward trend — no dips'], insightColor: '#FFBB28', Visual: LineVisual },
  { label: 'AI Insights', tag: 'sakila.db', tagColor: '#FFBB28', query: 'Who are the top 5 customers by total spending?', response: 'Here are the top 5 customers by total spending:', insight: ['Eleanor Hunt leads at $211.55 total spend', 'Top 5 customers account for 8.2% of revenue', 'All top spenders are from North America'], insightColor: '#6b4cff', Visual: TableVisual },
];

const AgentAvatar = () => (
  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(107,76,255,0.5)' }}>
    <Database size={12} color="#fff" />
  </div>
);

/* ── Demo Deck ────────────────────────────────────────── */
function DemoDeck() {
  const [active, setActive] = useState(0);
  const [deckHeight, setDeckHeight] = useState(520);
  const cardRefs = useRef([]);

  useEffect(() => {
    const el = cardRefs.current[active];
    if (el) setDeckHeight(el.getBoundingClientRect().height + 16);
  }, [active]);

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Pill tabs — Apple-style segmented control */}
      <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 30, padding: 4, gap: 2, marginBottom: 32 }}>
        {DEMOS.map((d, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ background: active === i ? 'rgba(107,76,255,0.25)' : 'transparent', border: active === i ? '1px solid rgba(107,76,255,0.4)' : '1px solid transparent', borderRadius: 24, padding: '6px 20px', fontSize: '0.8rem', fontWeight: 600, color: active === i ? '#c4b5fd' : '#555', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.tagColor, display: 'inline-block', boxShadow: `0 0 5px ${d.tagColor}` }} />
            {d.label}
          </button>
        ))}
      </div>

      {/* Card stack */}
      <div style={{ position: 'relative', height: deckHeight, transition: 'height 0.45s cubic-bezier(0.4,0,0.2,1)' }}>
        {DEMOS.map((d, i) => {
          const offset = i - active;
          const isActive = i === active;
          const scale = isActive ? 1 : 1 - Math.abs(offset) * 0.035;
          const translateY = isActive ? 0 : Math.abs(offset) * 12;
          const opacity = isActive ? 1 : 1 - Math.abs(offset) * 0.4;
          const zIndex = DEMOS.length - Math.abs(offset);
          const { Visual } = d;
          return (
            <div key={i} ref={el => cardRefs.current[i] = el} onClick={() => !isActive && setActive(i)}
              style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `perspective(1200px) scale(${scale}) translateY(${translateY}px)`, opacity, zIndex, transition: 'all 0.45s cubic-bezier(0.4,0,0.2,1)', cursor: isActive ? 'default' : 'pointer', pointerEvents: isActive ? 'auto' : 'none', borderRadius: 20, overflow: 'hidden', background: 'rgba(18,19,28,0.85)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: `1px solid ${isActive ? 'rgba(107,76,255,0.25)' : 'rgba(255,255,255,0.05)'}`, boxShadow: isActive ? '0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)' : '0 16px 32px rgba(0,0,0,0.35)' }}>
              {/* macOS chrome */}
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '11px 16px', display: 'flex', alignItems: 'center', gap: 6, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                <span style={{ marginLeft: 10, fontSize: '0.7rem', color: '#333', letterSpacing: '0.01em' }}>AgentDB — Intelligent Database Agent</span>
                <div style={{ marginLeft: 'auto' }}>
                  <span style={{ background: `${d.tagColor}15`, border: `1px solid ${d.tagColor}35`, borderRadius: 5, padding: '2px 9px', fontSize: '0.65rem', color: d.tagColor, fontWeight: 600 }}>{d.tag}</span>
                </div>
              </div>
              {/* Chat body */}
              <div style={{ padding: '18px 20px 14px', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
                <div style={{ display: 'flex', gap: 9 }}>
                  <AgentAvatar />
                  <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px 12px 12px 12px', padding: '9px 13px', fontSize: '0.82rem', color: '#ccc', lineHeight: 1.6 }}>
                    Hello! I'm AgentDB. Ask me anything about your database.
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <div style={{ background: 'linear-gradient(135deg,#6b4cff,#4f46e5)', borderRadius: '12px 4px 12px 12px', padding: '9px 13px', fontSize: '0.82rem', color: '#fff', maxWidth: 340 }}>{d.query}</div>
                </div>
                <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <AgentAvatar />
                  <div style={{ flex: 1 }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px 12px 12px 12px', padding: '9px 13px', fontSize: '0.82rem', color: '#ccc', marginBottom: 10 }}>{d.response}</div>
                    <Visual />
                    <div style={{ background: `${d.insightColor}0a`, border: `1px solid ${d.insightColor}25`, borderRadius: 10, padding: '10px 13px', marginTop: 10 }}>
                      <div style={{ fontSize: '0.67rem', color: d.insightColor, fontWeight: 700, marginBottom: 6, letterSpacing: '0.04em' }}>✦ AI INSIGHTS</div>
                      {d.insight.map((ins, j) => <div key={j} style={{ fontSize: '0.76rem', color: '#8a8fa8', lineHeight: 1.65 }}>· {ins}</div>)}
                    </div>
                  </div>
                </div>
              </div>
              {/* Input bar */}
              <div style={{ padding: '10px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 20, padding: '8px 14px', fontSize: '0.8rem', color: '#333' }}>Ask about your database...</div>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6b4cff,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 8px rgba(107,76,255,0.4)' }}>
                  <ArrowRight size={13} color="#fff" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20, position: 'relative', zIndex: 10 }}>
        {DEMOS.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ width: active === i ? 20 : 6, height: 6, borderRadius: 3, background: active === i ? '#6b4cff' : 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
        ))}
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────── */
export default function LandingPage({ onLaunch }) {
  const [exiting, setExiting] = useState(false);
  const sectionRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.style.animation = 'sectionReveal 0.6s cubic-bezier(0.4,0,0.2,1) both'; observer.unobserve(e.target); } }),
      { threshold: 0.1 }
    );
    sectionRefs.current.forEach(el => { if (el) { el.style.opacity = '0'; observer.observe(el); } });
    return () => observer.disconnect();
  }, []);

  const handleLaunch = () => { setExiting(true); setTimeout(onLaunch, 380); };
  const ref = i => el => { sectionRefs.current[i] = el; };

  /* shared Apple-style card style */
  const glassCard = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18 };

  return (
    <div className={exiting ? 'landing-exit' : 'landing-enter'} style={{ background: '#07080c', color: '#fff', fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Inter', sans-serif", overflowX: 'hidden', minHeight: '100vh', width: '100%', boxSizing: 'border-box', position: 'relative' }}>

      {/* ── Fixed ambient background ── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 55% at 50% -5%, rgba(107,76,255,0.2) 0%, transparent 65%)' }} />
        <div style={{ position: 'absolute', top: '25%', left: '-15%', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,196,159,0.08) 0%, transparent 65%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', top: '55%', right: '-10%', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,76,255,0.1) 0%, transparent 65%)', filter: 'blur(80px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '25%', width: 800, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,196,159,0.05) 0%, transparent 70%)', filter: 'blur(100px)' }} />
      </div>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(7,8,12,0.72)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 max(24px, 5vw)', display: 'flex', alignItems: 'center', height: 60 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6b4cff,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(107,76,255,0.45)' }}>
            <Database size={14} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.02em', background: 'linear-gradient(90deg,#fff 40%,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AgentDB</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(107,76,255,0.1)', border: '1px solid rgba(107,76,255,0.25)', borderRadius: 20, padding: '4px 11px' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00C49F', boxShadow: '0 0 5px #00C49F' }} />
            <span style={{ fontSize: '0.71rem', color: '#a78bfa', fontWeight: 500 }}>Gemini 2.5 Flash</span>
          </div>
          <button onClick={handleLaunch}
            style={{ background: 'linear-gradient(135deg,#6b4cff,#4f46e5)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 10px rgba(107,76,255,0.4)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(107,76,255,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(107,76,255,0.4)'; }}>
            Launch App →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: 'clamp(80px,12vw,140px) max(24px,6vw) clamp(60px,8vw,100px)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Floating orbs */}
        {[{t:70,l:'7%',s:70,c:'#6b4cff',d:7},{t:180,r:'6%',s:44,c:'#00C49F',d:5},{t:320,l:'4%',s:26,c:'#FFBB28',d:9},{t:240,r:'11%',s:18,c:'#FF8042',d:6}].map((o,i)=>(
          <div key={i} style={{ position:'absolute', top:o.t, left:o.l, right:o.r, width:o.s, height:o.s, borderRadius:'50%', background:o.c, opacity:0.18, animation:`floatSlow ${o.d}s ease-in-out infinite ${i*0.7}s`, pointerEvents:'none', filter:`blur(${o.s/4}px)` }} />
        ))}
        {/* Spinning rings */}
        <div style={{ position:'absolute', top:50, right:'17%', width:110, height:110, borderRadius:'50%', border:'1px solid rgba(107,76,255,0.15)', animation:'spinOrb 14s linear infinite', pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:-3, left:'50%', width:7, height:7, borderRadius:'50%', background:'#6b4cff', transform:'translateX(-50%)', boxShadow:'0 0 8px #6b4cff' }} />
        </div>
        <div style={{ position:'absolute', top:130, left:'19%', width:60, height:60, borderRadius:'50%', border:'1px solid rgba(0,196,159,0.15)', animation:'spinOrb 9s linear infinite reverse', pointerEvents:'none' }}>
          <div style={{ position:'absolute', top:-2.5, left:'50%', width:5, height:5, borderRadius:'50%', background:'#00C49F', transform:'translateX(-50%)', boxShadow:'0 0 6px #00C49F' }} />
        </div>

        {/* Hook */}
        <p style={{ fontSize: '0.78rem', color: '#6b4cff', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 20 }}>
          Stop writing SQL. Start asking questions.
        </p>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(107,76,255,0.08)', border: '1px solid rgba(107,76,255,0.28)', borderRadius: 20, padding: '5px 14px', fontSize: '0.75rem', color: '#a78bfa', marginBottom: 28, fontWeight: 500 }}>
          <Zap size={11} color="#6b4cff" fill="#6b4cff" /> Powered by Gemini 2.5 Flash
        </div>

        {/* Headline — Apple-style: large, tight, centered */}
        <h1 style={{ fontSize: 'clamp(1.4rem, 3.2vw, 3.2rem)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.04em', margin: '0 auto 22px', whiteSpace: 'nowrap', textAlign: 'center', color: '#f5f5f7' }}>
          From question →{' '}
          <span style={{ background: 'linear-gradient(135deg,#6b4cff 0%,#00C49F 55%,#FFBB28 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>SQL → insights in seconds.</span>
        </h1>

        {/* Subtext — Apple-style: light grey, generous line-height */}
        <p style={{ color: '#86868b', fontSize: 'clamp(0.95rem, 1.6vw, 1.1rem)', lineHeight: 1.9, maxWidth: 520, margin: '0 auto 10px', fontWeight: 400 }}>
          Ask in natural language. Get SQL executed, charts rendered,<br />and AI insights — all in one response.
        </p>
        <p style={{ color: '#48484a', fontSize: '0.82rem', marginBottom: 40, fontWeight: 400 }}>
          No SQL. No setup. Just answers. · Works with SQLite, CSV, JSON
        </p>

        {/* What you get — 4 glass cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, maxWidth: 760, margin: '0 auto 40px' }}>
          {[
            { icon: <Zap size={16} />, color: '#6b4cff', title: 'Instant answers', desc: 'Ask anything → results in seconds' },
            { icon: <BarChart2 size={16} />, color: '#00C49F', title: 'Auto charts', desc: 'Visual insights, zero manual work' },
            { icon: <Shield size={16} />, color: '#FFBB28', title: 'Private & secure', desc: 'Data never leaves your machine' },
            { icon: <Brain size={16} />, color: '#FF8042', title: 'AI-powered', desc: 'Understands natural language' },
          ].map(({ icon, color, title, desc }) => (
            <div key={title} style={{ ...glassCard, padding: '14px 16px', textAlign: 'left', transition: 'border-color 0.2s, background 0.2s', borderColor: `${color}20` }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}50`; e.currentTarget.style.background = `${color}07`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}20`; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: `${color}15`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, marginBottom: 9 }}>{icon}</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e8e8f0', marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: '0.72rem', color: '#48484a', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
          <button onClick={handleLaunch}
            style={{ background: 'linear-gradient(135deg,#6b4cff,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: '0.98rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 6px 20px rgba(107,76,255,0.45)', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(107,76,255,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(107,76,255,0.45)'; }}>
            Start querying your data <ArrowRight size={15} />
          </button>
          <a href="#demo-section" onClick={e => { e.preventDefault(); document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' }); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '14px 24px', fontSize: '0.95rem', fontWeight: 600, color: '#d0d0d8', cursor: 'pointer', textDecoration: 'none', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}>
            ▶ See how it works
          </a>
        </div>

        {/* Social proof */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex' }}>
              {['#6b4cff','#00C49F','#FF8042','#FFBB28'].map((c,i) => (
                <div key={i} style={{ width: 26, height: 26, borderRadius: '50%', background: `linear-gradient(135deg,${c},${c}88)`, border: '2px solid #07080c', marginLeft: i===0?0:-7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700, color: '#fff' }}>
                  {['DA','BE','PM','FE'][i]}
                </div>
              ))}
            </div>
            <div>
              <div style={{ display: 'flex', gap: 1 }}>{[...Array(5)].map((_,i) => <Star key={i} size={10} fill="#FFBB28" color="#FFBB28" />)}</div>
              <span style={{ fontSize: '0.72rem', color: '#48484a' }}>Trusted by 500+ developers</span>
            </div>
          </div>
          <div style={{ width: 1, height: 24, background: 'rgba(255,255,255,0.07)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle size={12} color="#00C49F" />
            <span style={{ color: '#48484a', fontSize: '0.77rem' }}>Free forever · No credit card</span>
          </div>
        </div>

        {/* ── LIVE TERMINAL + SCHEMA EXPLORER ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, maxWidth: 920, margin: '0 auto 64px', textAlign: 'left' }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Terminal size={11} color="#6b4cff" /> Live Query Demo
            </div>
            <LiveQueryTerminal />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#555', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Database size={11} color="#00C49F" /> Schema Explorer
            </div>
            <SchemaExplorer />
            {/* Animated stats below schema */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
              {STATS.map((s, i) => (
                <div key={i} style={{ ...glassCard, padding: '12px 14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#555', marginTop: 4, fontWeight: 500 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Demo deck */}
        <div id="demo-section"><DemoDeck /></div>
      </section>

      {/* ── TECH STRIP ── */}
      <div ref={ref(0)} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '18px max(24px,5vw)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(16px,3vw,40px)', flexWrap: 'wrap', background: 'rgba(255,255,255,0.015)', position: 'relative', zIndex: 1 }}>
        <span style={{ color: '#333', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Built with</span>
        {['FastAPI','LangGraph','Gemini 2.5 Flash','React','Recharts','Mermaid.js','SQLite'].map(t => (
          <span key={t} style={{ color: '#48484a', fontSize: '0.84rem', fontWeight: 600, letterSpacing: '-0.01em' }}>{t}</span>
        ))}
      </div>

      {/* ── HOW IT WORKS ── */}
      <section ref={ref(1)} style={{ padding: 'clamp(70px,10vw,110px) max(24px,6vw)', background: 'transparent', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-block', background: 'rgba(107,76,255,0.08)', border: '1px solid rgba(107,76,255,0.22)', borderRadius: 20, padding: '4px 13px', fontSize: '0.7rem', color: '#a78bfa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>How it works</div>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.6rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: '#f5f5f7' }}>
              From question to insight<br /><span style={{ color: '#6b4cff' }}>in seconds</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ ...glassCard, padding: '28px 24px', position: 'relative', overflow: 'hidden', animation: `float ${6+i}s ease-in-out infinite ${i*0.8}s` }}>
                <div style={{ position: 'absolute', top: -16, right: -8, fontSize: '4.5rem', fontWeight: 900, color: s.color, opacity: 0.06, lineHeight: 1, userSelect: 'none' }}>{s.num}</div>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: `${s.color}15`, border: `1px solid ${s.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, fontSize: '1rem', fontWeight: 800, color: s.color }}>{s.num}</div>
                <h3 style={{ fontSize: '0.97rem', fontWeight: 700, marginBottom: 8, letterSpacing: '-0.01em', color: '#e8e8f0' }}>{s.title}</h3>
                <p style={{ color: '#6e6e73', fontSize: '0.85rem', lineHeight: 1.75, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section ref={ref(2)} style={{ padding: 'clamp(70px,10vw,110px) max(24px,6vw)', background: 'transparent', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1080, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-block', background: 'rgba(0,196,159,0.08)', border: '1px solid rgba(0,196,159,0.22)', borderRadius: 20, padding: '4px 13px', fontSize: '0.7rem', color: '#00C49F', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 14 }}>Features</div>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.6rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: '#f5f5f7' }}>
              Everything you need to<br /><span style={{ color: '#00C49F' }}>understand your data</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ ...glassCard, padding: '20px', cursor: 'default', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s', transformStyle: 'preserve-3d' }}
                onMouseMove={e => { const r=e.currentTarget.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-0.5; const y=(e.clientY-r.top)/r.height-0.5; e.currentTarget.style.transform=`perspective(600px) rotateY(${x*10}deg) rotateX(${-y*7}deg) translateZ(6px)`; e.currentTarget.style.borderColor=f.color+'55'; e.currentTarget.style.boxShadow=`0 12px 32px ${f.color}18`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; e.currentTarget.style.boxShadow='none'; }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: `${f.color}12`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: f.color }}>{f.icon}</div>
                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 6, letterSpacing: '-0.01em', color: '#e8e8f0' }}>{f.title}</h3>
                <p style={{ color: '#6e6e73', fontSize: '0.8rem', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section ref={ref(3)} style={{ padding: 'clamp(70px,10vw,110px) max(24px,6vw)', background: 'transparent', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.6rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: '#f5f5f7' }}>
              Loved by <span style={{ background: 'linear-gradient(135deg,#6b4cff,#00C49F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>data teams</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ ...glassCard, padding: '24px' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                  {[...Array(5)].map((_,j) => <Star key={j} size={12} fill="#FFBB28" color="#FFBB28" />)}
                </div>
                <p style={{ color: '#c0c0cc', fontSize: '0.88rem', lineHeight: 1.8, marginBottom: 18, fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6b4cff,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e8e8f0' }}>{t.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#48484a' }}>{t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section ref={ref(4)} style={{ padding: 'clamp(70px,10vw,110px) max(24px,6vw)', background: 'transparent', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem,3vw,2.6rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: '#f5f5f7' }}>
              Frequently asked <span style={{ color: '#6b4cff' }}>questions</span>
            </h2>
          </div>
          <div style={{ ...glassCard, padding: '0 24px' }}>
            {FAQS.map((f, i) => <FAQItem key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section ref={ref(5)} style={{ padding: 'clamp(80px,12vw,130px) max(24px,6vw)', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 350, background: 'radial-gradient(ellipse, rgba(107,76,255,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem,3.8vw,3rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1.1, color: '#f5f5f7' }}>
            When it comes to your data,<br />
            <span style={{ background: 'linear-gradient(135deg,#6b4cff,#00C49F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>all you need is AgentDB</span>
          </h2>
          <p style={{ color: '#6e6e73', fontSize: '1rem', marginBottom: 40, lineHeight: 1.7 }}>Start querying your database in plain English today. Free, forever.</p>
          <button onClick={handleLaunch}
            style={{ background: 'linear-gradient(135deg,#6b4cff,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: '15px 40px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 9, boxShadow: '0 8px 24px rgba(107,76,255,0.45)', animation: 'pulse3d 3s ease-in-out infinite' }}
            onMouseEnter={e => { e.currentTarget.style.animation='none'; e.currentTarget.style.transform='translateY(-2px) scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.animation='pulse3d 3s ease-in-out infinite'; e.currentTarget.style.transform='none'; }}>
            Launch AgentDB <ArrowRight size={16} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, marginTop: 22, flexWrap: 'wrap' }}>
            {['Free forever','No SQL needed','Upload any DB'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <CheckCircle size={12} color="#00C49F" />
                <span style={{ color: '#48484a', fontSize: '0.8rem' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '28px max(24px,5vw)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, background: 'rgba(7,8,12,0.7)', backdropFilter: 'blur(24px)', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#6b4cff,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={12} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', background: 'linear-gradient(90deg,#fff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AgentDB</span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="https://github.com/prasannaraj12/AgentDB" target="_blank" rel="noreferrer" style={{ color: '#48484a', fontSize: '0.82rem', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color='#a78bfa'}
            onMouseLeave={e => e.currentTarget.style.color='#48484a'}>GitHub</a>
          <span style={{ color: '#2a2a2a', fontSize: '0.78rem' }}>Built for iTech AI Innovation Hackathon 2026</span>
        </div>
        <span style={{ color: '#2a2a2a', fontSize: '0.75rem' }}>© 2026 AgentDB · MIT License</span>
      </footer>
    </div>
  );
}
