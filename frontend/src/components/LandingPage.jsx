import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight, Zap, BarChart3, ShieldCheck, Brain, Upload, MessageSquareText, Sparkles,
  Code2, Lightbulb, Table2, Network, Wand2, Play, Github,
} from 'lucide-react';
import Logo from './shell/Logo';
import HeroField from './landing/HeroField';
import Showcase from './landing/Showcase';
import { useReveal, usePointerVars, useSpotlight } from './landing/motion';
import '../styles/landing.css';

const NAV = [
  { id: 'features', label: 'Features' },
  { id: 'how', label: 'How It Works' },
  { id: 'capabilities', label: 'Capabilities' },
  { id: 'technology', label: 'Technology' },
];

const HIGHLIGHTS = [
  { icon: Zap, title: 'Instant answers', text: 'Ask in plain English and get an answer in seconds.' },
  { icon: BarChart3, title: 'Auto charts', text: 'Bar, line, pie and scatter charts drawn from your results.' },
  { icon: ShieldCheck, title: 'Private & secure', text: 'Read-only queries. The model sees your schema and small result previews, not your files.' },
  { icon: Brain, title: 'AI powered', text: 'A LangGraph agent plans the SQL, the chart and the insights.' },
];

const STEPS = [
  { n: '01', icon: Upload, title: 'Connect your database', text: 'Upload a SQLite, CSV, TSV or JSON file. The schema is read automatically.' },
  { n: '02', icon: MessageSquareText, title: 'Ask in plain English', text: 'Type any question — queries, charts, ER diagrams or insights.' },
  { n: '03', icon: Sparkles, title: 'Get instant answers', text: 'Results arrive as tables, charts and AI-generated insights.' },
];

const FLOW = [
  { label: 'Question', detail: 'Natural language' },
  { label: 'Schema understanding', detail: 'SchemaRAG' },
  { label: 'SQL generation', detail: 'LangGraph agent' },
  { label: 'Execution', detail: 'SQLite · read-only' },
  { label: 'Visualization', detail: 'Recharts · Mermaid' },
  { label: 'Insights', detail: 'Streamed answer' },
];

const STACK = [
  { name: 'React + Vite', role: 'Frontend and PWA' },
  { name: 'FastAPI', role: 'REST API with SSE streaming' },
  { name: 'LangGraph', role: 'ReAct agent with tool calling' },
  { name: 'Groq · Gemini', role: 'LLM provider, chosen on the server' },
  { name: 'SQLite', role: 'Databases, attachable across files' },
  { name: 'SchemaRAG', role: 'Schema retrieval for large databases' },
  { name: 'Recharts', role: 'Bar, line, pie and scatter charts' },
  { name: 'Mermaid.js', role: 'ER diagrams and flowcharts' },
];

function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

function Headline() {
  const words = [
    { t: 'From' }, { t: 'question', cls: 'lp-grad-a' }, { t: '→', cls: 'lp-arrow' },
    { t: 'SQL', cls: 'lp-grad-b' }, { t: '→', cls: 'lp-arrow' },
    { t: 'insights', cls: 'lp-grad-c' }, { t: 'in' }, { t: 'seconds.' },
  ];
  // Keep each arrow on the same line as the word before it.
  const groups = [];
  words.forEach((w, i) => {
    if (w.cls === 'lp-arrow' && groups.length) groups[groups.length - 1].push({ ...w, i });
    else groups.push([{ ...w, i }]);
  });
  return (
    <h1 className="lp-h1" aria-label="From question to SQL to insights in seconds.">
      {groups.map((g, gi) => (
        <span key={gi} className="lp-word-group" aria-hidden="true">
          {g.map((w) => (
            <span key={w.i} className="lp-word" style={{ '--i': w.i }}>
              <span className={w.cls || ''}>{w.t}</span>
            </span>
          ))}
        </span>
      ))}
    </h1>
  );
}

/* ── Capability visuals: small, purely decorative, animate on hover/reveal ── */
function CapVisual({ kind }) {
  if (kind === 'sql') {
    return (
      <div className="lp-cv lp-cv-sql" aria-hidden="true">
        <p className="lp-cv-q">“Top 5 customers by spend”</p>
        <div className="lp-cv-arrow" />
        <p className="lp-cv-code"><b>SELECT</b> c.first_name, <i>SUM</i>(o.total_amount)<br /><b>FROM</b> customers c <b>JOIN</b> orders o …<br /><b>ORDER BY</b> 2 <b>DESC LIMIT</b> 5</p>
      </div>
    );
  }
  if (kind === 'viz') {
    return (
      <div className="lp-cv lp-cv-viz" aria-hidden="true">
        {[62, 88, 45, 100, 70, 54].map((h, i) => <i key={i} style={{ '--h': `${h}%`, '--d': `${i * 70}ms` }} />)}
      </div>
    );
  }
  if (kind === 'insight') {
    return (
      <div className="lp-cv lp-cv-insight" aria-hidden="true">
        {[90, 74, 82].map((w, i) => <span key={i} style={{ '--w': `${w}%`, '--d': `${i * 120}ms` }}><em /></span>)}
      </div>
    );
  }
  if (kind === 'schema') {
    return (
      <div className="lp-cv lp-cv-schema" aria-hidden="true">
        <div><b>orders</b><span>order_id <em>PK</em></span><span>customer_id</span><span>total_amount</span></div>
      </div>
    );
  }
  if (kind === 'er') {
    return (
      <svg className="lp-cv lp-cv-er" viewBox="0 0 200 90" aria-hidden="true">
        <path d="M68 26 C 104 26, 104 64, 136 64" className="lp-cv-er-link" pathLength="1" />
        <path d="M68 26 C 110 26, 112 22, 136 22" className="lp-cv-er-link" pathLength="1" />
        <rect x="4" y="12" width="64" height="28" rx="6" /><rect x="136" y="8" width="60" height="28" rx="6" /><rect x="136" y="50" width="60" height="28" rx="6" />
        <text x="36" y="26">customers</text><text x="166" y="22">orders</text><text x="166" y="64">order_items</text>
      </svg>
    );
  }
  return (
    <div className="lp-cv lp-cv-assist" aria-hidden="true">
      {['Show me the top 10 records from orders', 'Now as a pie chart', 'Which region spends most?'].map((t, i) => (
        <span key={t} style={{ '--d': `${i * 110}ms` }}>{t}</span>
      ))}
    </div>
  );
}

const CAPABILITIES = [
  { kind: 'sql', icon: Code2, title: 'Natural language to SQL', text: 'Plain-English questions become SQLite queries that run read-only, including joins and cross-database queries.', size: 'xl' },
  { kind: 'viz', icon: BarChart3, title: 'Automated data visualization', text: 'Ask for a chart and get one, with the right axes picked from your result.', size: 'md' },
  { kind: 'insight', icon: Lightbulb, title: 'AI-generated insights', text: 'Every answer comes with short, specific observations about the data.', size: 'sm' },
  { kind: 'schema', icon: Table2, title: 'Database schema exploration', text: 'Browse tables, columns, keys, statistics and sample rows.', size: 'sm' },
  { kind: 'er', icon: Network, title: 'ER diagram generation', text: 'Entity-relationship diagrams drawn from your live schema.', size: 'sm' },
  { kind: 'assist', icon: Wand2, title: 'Intelligent query assistance', text: 'Schema-aware suggestions, follow-up questions that remember context, and a searchable history of every query.', size: 'lg' },
];

export default function LandingPage({ onLaunch }) {
  const rootRef = useRef(null);
  const heroRef = useRef(null);
  const navRef = useRef(null);
  const [active, setActive] = useState('');
  const [exiting, setExiting] = useState(false);

  useReveal(rootRef);
  useSpotlight(rootRef);
  usePointerVars(heroRef, { global: true, ease: 0.05 });

  // Load sequence + nav background + scroll progress, without re-rendering on scroll.
  useEffect(() => {
    const root = rootRef.current;
    const raf = requestAnimationFrame(() => root?.classList.add('is-loaded'));
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        navRef.current?.classList.toggle('is-scrolled', y > 24);
        const max = document.documentElement.scrollHeight - window.innerHeight;
        root?.style.setProperty('--progress', max > 0 ? (y / max).toFixed(4) : '0');
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', onScroll); };
  }, []);

  // Active section for the nav indicator.
  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-40% 0px -50% 0px', threshold: [0, 0.25, 0.5] });
    sections.forEach((s) => io.observe(s));
    const onTop = () => { if (window.scrollY < 200) setActive(''); };
    window.addEventListener('scroll', onTop, { passive: true });
    return () => { io.disconnect(); window.removeEventListener('scroll', onTop); };
  }, []);

  const launch = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { onLaunch(); return; }
    setExiting(true);
    setTimeout(onLaunch, 320);
  };

  return (
    <div className={`lp ${exiting ? 'is-exiting' : ''}`} ref={rootRef}>
      <div className="lp-progress" aria-hidden="true" />

      {/* ── Navigation ─────────────────────────────────────────────── */}
      <header className="lp-nav" ref={navRef}>
        <div className="lp-nav-inner">
          <a href="#top" className="lp-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="AgentDB — back to top">
            <Logo variant="light" size={28} />
          </a>
          <nav className="lp-nav-links" aria-label="Sections">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className={active === n.id ? 'is-active' : ''}
                aria-current={active === n.id ? 'true' : undefined}
                onClick={(e) => { e.preventDefault(); scrollToId(n.id); }}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="lp-nav-right">
            <span className="lp-provider" title="AgentDB runs on Groq or Google Gemini; the provider and model are set on the server (LLM_PROVIDER in backend/.env).">
              <i /> Groq · Gemini
            </span>
            <button type="button" className="lp-btn lp-btn-primary lp-btn-sm" onClick={launch}>
              Launch App <ArrowRight size={14} className="lp-btn-arrow" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="lp-hero" id="top" ref={heroRef}>
        <div className="lp-hero-bg" aria-hidden="true">
          <span className="lp-light lp-light-a" />
          <span className="lp-light lp-light-b" />
          <span className="lp-light lp-light-c" />
          <span className="lp-grid" />
          <HeroField />
          <span className="lp-hero-fade" />
        </div>

        <div className="lp-hero-content">
          <p className="lp-eyebrow lp-seq" style={{ '--seq': 2 }}><span />INTELLIGENT DATABASE INTERACTION</p>
          <Headline />
          <p className="lp-lead lp-seq" style={{ '--seq': 9 }}>
            Ask in natural language. Get SQL executed, charts rendered, and AI insights — all in one response.
          </p>
          <p className="lp-sublead lp-seq" style={{ '--seq': 10 }}>No SQL expertise required. Your data, understood.</p>

          <div className="lp-ctas lp-seq" style={{ '--seq': 11 }}>
            <button type="button" className="lp-btn lp-btn-primary" onClick={launch}>
              Start querying your data <ArrowRight size={16} className="lp-btn-arrow" />
            </button>
            <button type="button" className="lp-btn lp-btn-ghost" onClick={() => scrollToId('how')}>
              <Play size={14} className="lp-btn-play" /> See how it works
            </button>
          </div>

          <ul className="lp-highlights">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="lp-highlight lp-seq" style={{ '--seq': 12 + i }} data-spotlight>
                <span className="lp-highlight-icon"><Icon size={16} /></span>
                <div>
                  <p className="lp-highlight-title">{title}</p>
                  <p className="lp-highlight-text">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Product showcase ───────────────────────────────────────── */}
      <section className="lp-section lp-showcase-section" id="features">
        <div className="lp-container">
          <div className="lp-section-head" data-reveal>
            <p className="lp-kicker">The product</p>
            <h2 className="lp-h2">One question. SQL, chart and insight in a single answer.</h2>
          </div>
          <div className="lp-showcase-wrap" data-reveal="zoom">
            <Showcase />
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section className="lp-section" id="how">
        <div className="lp-container">
          <div className="lp-section-head" data-reveal>
            <p className="lp-kicker">How it works</p>
            <h2 className="lp-h2">From question to insight in seconds.</h2>
          </div>
          <div className="lp-steps" data-reveal="steps">
            <svg className="lp-steps-line" viewBox="0 0 1000 4" preserveAspectRatio="none" aria-hidden="true">
              <line x1="0" y1="2" x2="1000" y2="2" pathLength="1" />
            </svg>
            {STEPS.map(({ n, icon: Icon, title, text }, i) => (
              <article key={n} className="lp-step" style={{ '--i': i }} data-spotlight>
                <span className="lp-step-num">{n}</span>
                <span className="lp-step-icon"><Icon size={18} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Capabilities ───────────────────────────────────────────── */}
      <section className="lp-section" id="capabilities">
        <div className="lp-container">
          <div className="lp-section-head lp-section-head-split" data-reveal>
            <div>
              <p className="lp-kicker">Capabilities</p>
              <h2 className="lp-h2">Everything between a question and a decision.</h2>
            </div>
            <p className="lp-section-note">Six capabilities, one conversation. Each answer can combine several of them.</p>
          </div>
          <div className="lp-caps">
            {CAPABILITIES.map(({ kind, icon: Icon, title, text, size }, i) => (
              <article key={kind} className={`lp-cap lp-cap-${size}`} data-reveal style={{ '--i': i }} data-spotlight>
                <CapVisual kind={kind} />
                <div className="lp-cap-text">
                  <span className="lp-cap-icon"><Icon size={15} /></span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Technology ─────────────────────────────────────────────── */}
      <section className="lp-section" id="technology">
        <div className="lp-container">
          <div className="lp-section-head" data-reveal>
            <p className="lp-kicker">Technology</p>
            <h2 className="lp-h2">How a question flows through AgentDB.</h2>
          </div>
          <ol className="lp-flow" data-reveal="flow">
            {FLOW.map((f, i) => (
              <li key={f.label} style={{ '--i': i }}>
                <span className="lp-flow-node">{String(i + 1).padStart(2, '0')}</span>
                <p className="lp-flow-label">{f.label}</p>
                <p className="lp-flow-detail">{f.detail}</p>
              </li>
            ))}
            <span className="lp-flow-pulse" aria-hidden="true" />
          </ol>
          <div className="lp-stack" data-reveal>
            {STACK.map((s) => (
              <div key={s.name} className="lp-stack-item" data-spotlight>
                <p>{s.name}</p>
                <span>{s.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <section className="lp-final" data-reveal>
        <span className="lp-final-glow" aria-hidden="true" />
        <h2 className="lp-final-title">Your data has answers.<br /><span className="lp-grad-c">Start asking.</span></h2>
        <p className="lp-final-text">Turn complex database interactions into simple conversations.</p>
        <button type="button" className="lp-btn lp-btn-primary lp-btn-lg" onClick={launch}>
          Launch AgentDB <ArrowRight size={17} className="lp-btn-arrow" />
        </button>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer-inner">
          <div className="lp-footer-brand">
            <Logo variant="light" size={28} />
            <p>Talk to your database in plain English. Built for the iTech AI Innovation Hackathon 2026.</p>
          </div>
          <nav className="lp-footer-links" aria-label="Footer">
            {NAV.map((n) => <a key={n.id} href={`#${n.id}`} onClick={(e) => { e.preventDefault(); scrollToId(n.id); }}>{n.label}</a>)}
            <button type="button" onClick={launch}>Launch App</button>
            <a href="https://github.com/prasannaraj12/AgentDB" target="_blank" rel="noreferrer"><Github size={14} /> GitHub</a>
          </nav>
        </div>
        <div className="lp-container lp-footer-base">
          <span>© {new Date().getFullYear()} AgentDB · MIT License</span>
        </div>
      </footer>
    </div>
  );
}
