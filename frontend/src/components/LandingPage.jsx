import React, { useState, useEffect, useRef } from 'react';
import { Database, BarChart2, GitBranch, Zap, ChevronDown, Star, ArrowRight, Table, Brain, Share2, MessageSquare, CheckCircle } from 'lucide-react';

const FEATURES = [
  { icon: <Database size={20} />, color: '#6b4cff', title: 'Natural Language → SQL', desc: 'Ask in plain English. AgentDB converts it to SQL, runs it, and returns results instantly.' },
  { icon: <BarChart2 size={20} />, color: '#00C49F', title: 'Interactive Charts', desc: 'Bar, line, pie, and scatter charts rendered automatically. Pin them to a dashboard.' },
  { icon: <GitBranch size={20} />, color: '#FFBB28', title: 'ER & Flow Diagrams', desc: 'Visualize your schema as an ER diagram or map processes as a flowchart — one prompt.' },
  { icon: <Brain size={20} />, color: '#FF8042', title: 'AI Insights', desc: 'Every query comes with bullet-point analysis by Gemini 2.5 Flash. Understand your data.' },
  { icon: <Table size={20} />, color: '#6b4cff', title: 'Multi-Database', desc: 'Upload and switch between multiple SQLite databases. Query across them simultaneously.' },
  { icon: <Share2 size={20} />, color: '#00C49F', title: 'Shareable Dashboards', desc: 'Pin charts and share with a single link. No login required for viewers.' },
];

const STEPS = [
  { num: '01', color: '#6b4cff', title: 'Connect your database', desc: 'Upload a SQLite, CSV, or JSON file. AgentDB parses the schema automatically.' },
  { num: '02', color: '#00C49F', title: 'Ask in plain English', desc: 'Type any question about your data — queries, charts, diagrams, or insights.' },
  { num: '03', color: '#FFBB28', title: 'Get instant answers', desc: 'See results as tables, charts, ER diagrams, and AI-generated insights in seconds.' },
];

const TESTIMONIALS = [
  { quote: 'AgentDB replaced hours of manual SQL work. I just ask and get charts instantly.', name: 'Data Analyst', company: 'E-commerce startup', avatar: 'DA' },
  { quote: 'The ER diagram feature alone saved us days of documentation work.', name: 'Backend Engineer', company: 'SaaS company', avatar: 'BE' },
  { quote: 'Non-technical teammates can now explore our database without any help.', name: 'Product Manager', company: 'Tech company', avatar: 'PM' },
];

const FAQS = [
  { q: 'What databases does AgentDB support?', a: 'AgentDB supports SQLite (.db, .sqlite), CSV, TSV, and JSON files. Upload any of these and start querying immediately.' },
  { q: 'Do I need to know SQL?', a: 'No. AgentDB converts your plain English questions into SQL automatically using Gemini 2.5 Flash.' },
  { q: 'Is my data safe?', a: 'Your database files are stored locally. Only the schema and query context are sent to the Gemini API — never your raw data.' },
  { q: 'Can I share my charts?', a: 'Yes. Pin any chart to the dashboard and click Share to get a public link anyone can view.' },
  { q: 'What chart types are supported?', a: 'Bar, line, pie, and scatter charts via Recharts. ER diagrams and flowcharts via Mermaid.js.' },
];

const CHART_BARS = [
  { h: 65, color: '#6b4cff', label: 'Electronics' },
  { h: 85, color: '#00C49F', label: 'Clothing' },
  { h: 45, color: '#FFBB28', label: 'Books' },
  { h: 90, color: '#FF8042', label: 'Sports' },
  { h: 55, color: '#8884d8', label: 'Home' },
  { h: 72, color: '#6b4cff', label: 'Beauty' },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'none', border: 'none', padding: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left', gap: 16 }}>
        <span style={{ color: '#f0f0f5', fontSize: '0.97rem', fontWeight: 500, lineHeight: 1.5 }}>{q}</span>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: open ? '#6b4cff' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
          <ChevronDown size={14} color="#fff" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }} />
        </div>
      </button>
      <div style={{ maxHeight: open ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
        <p style={{ color: '#9ea4b0', fontSize: '0.9rem', lineHeight: 1.75, paddingBottom: 20, margin: 0 }}>{a}</p>
      </div>
    </div>
  );
}

export default function LandingPage({ onLaunch }) {
  const [exiting, setExiting] = useState(false);
  const sectionRefs = useRef([]);

  // Intersection observer for section reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.animation = 'sectionReveal 0.65s cubic-bezier(0.4,0,0.2,1) both';
          observer.unobserve(e.target);
        }
      }),
      { threshold: 0.12 }
    );
    sectionRefs.current.forEach(el => { if (el) { el.style.opacity = '0'; observer.observe(el); } });
    return () => observer.disconnect();
  }, []);

  const handleLaunch = () => {
    setExiting(true);
    setTimeout(onLaunch, 380);
  };

  const ref = (i) => (el) => { sectionRefs.current[i] = el; };
  return (
    <div className={exiting ? 'landing-exit' : 'landing-enter'} style={{ background: '#0a0b0f', color: '#fff', fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif", overflowX: 'hidden', minHeight: '100vh', width: '100%', boxSizing: 'border-box' }}>

      {/* ── NAV ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,11,15,0.9)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 6vw', display: 'flex', alignItems: 'center', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6b4cff 0%,#4f46e5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(107,76,255,0.4)' }}>
            <Database size={15} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.02em', background: 'linear-gradient(90deg,#fff,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AgentDB</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(107,76,255,0.12)', border: '1px solid rgba(107,76,255,0.3)', borderRadius: 20, padding: '4px 12px' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00C49F', boxShadow: '0 0 6px #00C49F' }} />
            <span style={{ fontSize: '0.73rem', color: '#c4b5fd', fontWeight: 500 }}>Gemini 2.5 Flash</span>
          </div>
          <button onClick={handleLaunch} style={{ background: 'linear-gradient(135deg,#6b4cff,#4f46e5)', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 20px', fontSize: '0.87rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(107,76,255,0.35)', transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(107,76,255,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(107,76,255,0.35)'; }}>
            Launch App →
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ padding: '110px 6vw 90px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 800, height: 500, background: 'radial-gradient(ellipse, rgba(107,76,255,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 200, left: '15%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(0,196,159,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 150, right: '10%', width: 250, height: 250, background: 'radial-gradient(circle, rgba(255,187,40,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(107,76,255,0.1)', border: '1px solid rgba(107,76,255,0.35)', borderRadius: 24, padding: '6px 16px', fontSize: '0.78rem', color: '#c4b5fd', marginBottom: 32, fontWeight: 500 }}>
          <Zap size={12} color="#6b4cff" fill="#6b4cff" /> AI-powered database intelligence
        </div>

        <h1 style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-0.04em', margin: '0 auto 24px', maxWidth: 820 }}>
          Talk to your database<br />
          <span style={{ background: 'linear-gradient(135deg, #6b4cff 0%, #00C49F 60%, #FFBB28 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>in plain English</span>
        </h1>

        <p style={{ color: '#9ea4b0', fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', lineHeight: 1.75, maxWidth: 580, margin: '0 auto 44px' }}>
          Ask questions, get SQL executed, charts rendered, and AI insights — all in one response. No SQL knowledge required.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 72 }}>
          <button onClick={handleLaunch} style={{ background: 'linear-gradient(135deg,#6b4cff,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: '15px 36px', fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 8px 24px rgba(107,76,255,0.4)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            Start for free <ArrowRight size={17} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={14} color="#00C49F" />
            <span style={{ color: '#6e6e73', fontSize: '0.85rem' }}>No credit card required</span>
          </div>
        </div>

        {/* App preview window */}
        <div style={{ maxWidth: 900, margin: '0 auto', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 50px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(107,76,255,0.15)', background: '#12131a' }}>
          {/* Window chrome */}
          <div style={{ background: '#0d0e14', padding: '13px 18px', display: 'flex', alignItems: 'center', gap: 7, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f57' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#febc2e' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#28c840' }} />
            <span style={{ marginLeft: 10, fontSize: '0.75rem', color: '#444', fontWeight: 500 }}>AgentDB — Intelligent Database Agent</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <div style={{ background: 'rgba(107,76,255,0.15)', border: '1px solid rgba(107,76,255,0.3)', borderRadius: 6, padding: '2px 10px', fontSize: '0.68rem', color: '#c4b5fd' }}>ecommerce.db</div>
            </div>
          </div>
          {/* Chat area */}
          <div style={{ padding: '28px 28px 20px', display: 'flex', flexDirection: 'column', gap: 18, textAlign: 'left' }}>
            {/* Agent message */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(107,76,255,0.4)' }}>
                <Database size={14} color="#fff" />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px 14px 14px 14px', padding: '12px 16px', fontSize: '0.87rem', color: '#e0e0e0', lineHeight: 1.65, maxWidth: 480 }}>
                Hello! I'm AgentDB. Ask me anything about your database — queries, charts, diagrams, or insights.
              </div>
            </div>
            {/* User message */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ background: 'linear-gradient(135deg,#6b4cff,#4f46e5)', borderRadius: '14px 4px 14px 14px', padding: '12px 16px', fontSize: '0.87rem', color: '#fff', maxWidth: 360 }}>
                Show a bar chart of sales by product category
              </div>
            </div>
            {/* Agent response with chart */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(107,76,255,0.4)' }}>
                <Database size={14} color="#fff" />
              </div>
              <div style={{ flex: 1, maxWidth: 560 }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '4px 14px 14px 14px', padding: '12px 16px', fontSize: '0.87rem', color: '#e0e0e0', marginBottom: 10 }}>
                  Here's the bar chart of sales by product category:
                </div>
                <div style={{ background: '#0d0e14', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 16px 8px', overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ea4b0', marginBottom: 12, fontWeight: 500 }}>Sales by Product Category</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100, paddingBottom: 4 }}>
                    {CHART_BARS.map((b, i) => (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: '100%', height: `${b.h}%`, background: b.color, borderRadius: '4px 4px 0 0', opacity: 0.85, boxShadow: `0 0 10px ${b.color}44` }} />
                        <span style={{ fontSize: '0.6rem', color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{b.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: 'rgba(0,196,159,0.06)', border: '1px solid rgba(0,196,159,0.2)', borderRadius: 10, padding: '10px 14px', marginTop: 10 }}>
                  <div style={{ fontSize: '0.72rem', color: '#00C49F', fontWeight: 600, marginBottom: 6 }}>✦ AI Insights</div>
                  <div style={{ fontSize: '0.8rem', color: '#9ea4b0', lineHeight: 1.6 }}>• Sports leads with highest revenue at $90K<br />• Electronics and Beauty show strong performance<br />• Books category has growth opportunity</div>
                </div>
              </div>
            </div>
          </div>
          {/* Input bar */}
          <div style={{ padding: '12px 20px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '10px 18px', fontSize: '0.85rem', color: '#555' }}>
              Ask about your database, request a chart, or ask for insights...
            </div>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6b4cff,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ArrowRight size={15} color="#fff" />
            </div>
          </div>
        </div>
      </section>

      {/* ── TECH STACK STRIP ── */}
      <div ref={ref(0)} style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '22px 6vw', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4vw', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)' }}>
        <span style={{ color: '#444', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 8 }}>Built with</span>
        {['FastAPI', 'LangGraph', 'Gemini 2.5 Flash', 'React', 'Recharts', 'Mermaid.js', 'SQLite'].map(t => (
          <span key={t} style={{ color: '#6e6e73', fontSize: '0.88rem', fontWeight: 600, letterSpacing: '-0.01em' }}>{t}</span>
        ))}
      </div>

      {/* ── HOW IT WORKS ── */}
      <section ref={ref(1)} style={{ padding: '100px 6vw', background: 'linear-gradient(180deg, #0a0b0f 0%, #0d0e16 100%)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-block', background: 'rgba(107,76,255,0.1)', border: '1px solid rgba(107,76,255,0.3)', borderRadius: 20, padding: '4px 14px', fontSize: '0.75rem', color: '#c4b5fd', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>How it works</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>From question to insight<br /><span style={{ color: '#6b4cff' }}>in seconds</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28 }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '32px 28px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -20, right: -10, fontSize: '5rem', fontWeight: 900, color: s.color, opacity: 0.07, lineHeight: 1, userSelect: 'none' }}>{s.num}</div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${s.color}18`, border: `1px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: '1.2rem', fontWeight: 800, color: s.color }}>{s.num}</div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.01em' }}>{s.title}</h3>
                <p style={{ color: '#9ea4b0', fontSize: '0.88rem', lineHeight: 1.75, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section ref={ref(2)} style={{ padding: '100px 6vw', background: '#0a0b0f' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-block', background: 'rgba(0,196,159,0.1)', border: '1px solid rgba(0,196,159,0.3)', borderRadius: 20, padding: '4px 14px', fontSize: '0.75rem', color: '#00C49F', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>Features</div>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Everything you need to<br /><span style={{ color: '#00C49F' }}>understand your data</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <div key={i}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px', cursor: 'default', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = f.color + '60'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${f.color}18`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: `${f.color}18`, border: `1px solid ${f.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, color: f.color }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '0.97rem', fontWeight: 700, marginBottom: 9, letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ color: '#9ea4b0', fontSize: '0.86rem', lineHeight: 1.75, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section ref={ref(3)} style={{ padding: '100px 6vw', background: 'linear-gradient(180deg, #0d0e16 0%, #0a0b0f 100%)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Loved by <span style={{ background: 'linear-gradient(135deg,#6b4cff,#00C49F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>data teams</span></h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '28px' }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 18 }}>
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="#FFBB28" color="#FFBB28" />)}
                </div>
                <p style={{ color: '#d0d0d8', fontSize: '0.92rem', lineHeight: 1.75, marginBottom: 20, fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6b4cff,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#fff' }}>{t.avatar}</div>
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{t.name}</div>
                    <div style={{ fontSize: '0.76rem', color: '#9ea4b0' }}>{t.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section ref={ref(4)} style={{ padding: '100px 6vw', background: '#0a0b0f' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Frequently asked <span style={{ color: '#6b4cff' }}>questions</span></h2>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '0 28px' }}>
            {FAQS.map((f, i) => <FAQItem key={i} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section ref={ref(5)} style={{ padding: '100px 6vw', textAlign: 'center', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #0a0b0f 0%, #0d0e16 100%)' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(107,76,255,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 18, lineHeight: 1.1 }}>
            When it comes to your data,<br />
            <span style={{ background: 'linear-gradient(135deg,#6b4cff,#00C49F)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>all you need is AgentDB</span>
          </h2>
          <p style={{ color: '#9ea4b0', fontSize: '1.05rem', marginBottom: 44, lineHeight: 1.7 }}>Start querying your database in plain English today. Free, forever.</p>
          <button onClick={handleLaunch} style={{ background: 'linear-gradient(135deg,#6b4cff,#4f46e5)', color: '#fff', border: 'none', borderRadius: 12, padding: '16px 44px', fontSize: '1.1rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 30px rgba(107,76,255,0.45)', letterSpacing: '-0.01em' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
            Launch AgentDB <ArrowRight size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 24, flexWrap: 'wrap' }}>
            {['Free forever', 'No SQL needed', 'Upload any DB'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={13} color="#00C49F" />
                <span style={{ color: '#6e6e73', fontSize: '0.83rem' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '36px 6vw', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20, background: '#0a0b0f' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#6b4cff,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={13} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '0.95rem', background: 'linear-gradient(90deg,#fff,#c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AgentDB</span>
        </div>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="https://github.com/prasannaraj12/AgentDB" target="_blank" rel="noreferrer" style={{ color: '#6e6e73', fontSize: '0.84rem', textDecoration: 'none', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#c4b5fd'}
            onMouseLeave={e => e.currentTarget.style.color = '#6e6e73'}>GitHub</a>
          <span style={{ color: '#333', fontSize: '0.82rem' }}>Built for iTech AI Innovation Hackathon 2026</span>
        </div>
        <span style={{ color: '#333', fontSize: '0.78rem' }}>© 2026 AgentDB · MIT License</span>
      </footer>
    </div>
  );
}
