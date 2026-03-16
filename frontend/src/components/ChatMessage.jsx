import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { User, ChevronDown, Terminal, Copy, Check, Lightbulb } from 'lucide-react';
import ChartRenderer from './ChartRenderer';
import MermaidDiagram from './MermaidDiagram';
import DataTable from './DataTable';

const TOOL_LABELS = {
  tool_execute_query:      { label: 'Execute SQL',      icon: '🛢️' },
  tool_generate_chart:     { label: 'Generate Chart',   icon: '📊' },
  tool_generate_flowchart: { label: 'Generate Diagram', icon: '🔀' },
};

// ── InsightLine ───────────────────────────────────────────────────────────────
function InsightLine({ text }) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('`') && part.endsWith('`'))
          return <code key={i} className="db-tag">{part.slice(1, -1)}</code>;
        if (part.startsWith('**') && part.endsWith('**'))
          return <strong key={i} className="insight-bold">{part.slice(2, -2)}</strong>;
        return part;
      })}
    </span>
  );
}

// ── InsightCard ───────────────────────────────────────────────────────────────
function InsightCard({ content }) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const lines = content.split('\n').filter(l => l.trim());
  const cleaned = lines.map(l => l.replace(/^#{1,6}\s+/, ''));
  const hasBullets = cleaned.some(l => /^[-•*]/.test(l.trim()));

  return (
    <div className="insight-card">
      <div className="insight-header">
        <div className="insight-title"><Lightbulb size={14} strokeWidth={2} /><span>Insights</span></div>
        <div className="insight-actions">
          <button className="insight-action-btn" onClick={handleCopy} title="Copy insights">
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button className="insight-action-btn" onClick={() => setOpen(o => !o)}>
            <ChevronDown size={12} style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
          </button>
        </div>
      </div>
      {open && (
        <div className="insight-body">
          {hasBullets ? (
            <ul className="insight-list">
              {cleaned.map((line, i) => {
                const clean = line.replace(/^[-•*]\s*/, '').trim();
                if (!clean) return null;
                return (
                  <li key={i} className="insight-item">
                    <span className="insight-dot" />
                    <InsightLine text={clean} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="insight-text"><InsightLine text={cleaned.join(' ')} /></p>
          )}
        </div>
      )}
    </div>
  );
}

// ── NLSQLCard ─────────────────────────────────────────────────────────────────
function NLSQLCard({ sql }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="nlsql-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span className="nlsql-label nlsql-label-sql">Generated SQL</span>
        <button className="insight-action-btn" onClick={handleCopy}>
          {copied ? <Check size={11} /> : <Copy size={11} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="nlsql-code">{sql}</pre>
    </div>
  );
}

// ── AgentTrace ────────────────────────────────────────────────────────────────
function groupTrace(trace) {
  const HIDDEN = new Set(['tool_get_schema', 'tool_explain_data']);
  const pairs = [];
  for (let i = 0; i < trace.length; i++) {
    if (trace[i].step !== 'tool_call') continue;
    if (HIDDEN.has(trace[i].tool)) continue;
    const result = trace[i + 1]?.step === 'tool_result' ? trace[i + 1] : null;
    pairs.push({ call: trace[i], result });
  }
  const groups = [];
  for (const pair of pairs) {
    const last = groups[groups.length - 1];
    if (last && last.tool === pair.call.tool) last.items.push(pair);
    else groups.push({ tool: pair.call.tool, items: [pair] });
  }
  return groups;
}

function AgentTrace({ trace }) {
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState(null);
  const groups = groupTrace(trace);
  const totalSteps = groups.reduce((sum, g) => sum + g.items.length, 0);
  if (totalSteps === 0) return null;

  return (
    <div className="trace-panel">
      <button className="trace-toggle" onClick={() => setOpen(o => !o)}>
        <Terminal size={12} />
        <span>Agent Execution</span>
        <span className="trace-count">{totalSteps} steps</span>
        <ChevronDown size={12} style={{ marginLeft: 'auto', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
      </button>
      {open && (
        <div className="trace-timeline">
          {groups.map((group, gi) => {
            const meta = TOOL_LABELS[group.tool] || { label: group.tool, icon: '🔧' };
            const isExpanded = expandedGroup === gi;
            const isSql = group.tool === 'tool_execute_query';
            return (
              <div key={gi} className="tl-group">
                <div className="tl-row" onClick={() => setExpandedGroup(isExpanded ? null : gi)}>
                  <span className="tl-dot" />
                  <span className="tl-icon">{meta.icon}</span>
                  <span className="tl-label">{meta.label}</span>
                  {group.items.length > 1 && <span className="tl-badge">{group.items.length}×</span>}
                  <span className="tl-status">✓</span>
                  <ChevronDown size={11} className="tl-chevron" style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
                </div>
                {isExpanded && (
                  <div className="tl-detail">
                    {group.items.map((pair, ii) => {
                      let display = '';
                      if (isSql) {
                        display = pair.call.input?.sql_query || JSON.stringify(pair.call.input, null, 2);
                      } else {
                        const raw = pair.result?.output || JSON.stringify(pair.call.input, null, 2);
                        try { display = JSON.stringify(JSON.parse(raw), null, 2); } catch { display = raw; }
                      }
                      return (
                        <div key={ii} className="tl-detail-item">
                          {group.items.length > 1 && <span className="tl-detail-num">#{ii + 1}</span>}
                          <span className="tl-detail-label">{isSql ? 'SQL Query' : 'Result'}</span>
                          <pre className="trace-code">{display}</pre>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function findJsonObjects(str) {
  const results = [];
  let i = 0;
  while (i < str.length) {
    if (str[i] === '{') {
      let depth = 0, j = i, inStr = false, esc = false;
      while (j < str.length) {
        const c = str[j];
        if (esc) { esc = false; }
        else if (c === '\\' && inStr) { esc = true; }
        else if (c === '"') { inStr = !inStr; }
        else if (!inStr) {
          if (c === '{') depth++;
          else if (c === '}') { depth--; if (depth === 0) break; }
        }
        j++;
      }
      if (depth === 0) { results.push({ start: i, end: j + 1, raw: str.slice(i, j + 1) }); i = j + 1; }
      else i++;
    } else i++;
  }
  return results;
}

// ── ChatMessage ───────────────────────────────────────────────────────────────
export default function ChatMessage({ message, onPinChart }) {
  const [parsedBlocks, setParsedBlocks] = useState([]);

  const sqlQuery = message.trace?.find(
    s => s.step === 'tool_call' && s.tool === 'tool_execute_query'
  )?.input?.sql_query || null;

  useEffect(() => {
    const blocks = [];
    const cleaned = message.content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '');

    const candidates = findJsonObjects(cleaned);
    let lastIndex = 0;

    for (const { start, end, raw } of candidates) {
      try {
        let obj = JSON.parse(raw);
        const wrapperKey = Object.keys(obj).find(k => k.endsWith('_response'));
        if (wrapperKey && obj[wrapperKey]?.type) obj = obj[wrapperKey];
        if (!['chart', 'mermaid', 'explanation'].includes(obj.type)) continue;
        const textPart = cleaned.substring(lastIndex, start).trim();
        if (textPart) blocks.push({ type: 'text', content: textPart });
        blocks.push(obj);
        lastIndex = end;
      } catch { /* skip */ }
    }

    const tail = cleaned.substring(lastIndex).trim();
    if (tail) blocks.push({ type: 'text', content: tail });
    if (blocks.length === 0) blocks.push({ type: 'text', content: message.content });

    // Deduplicate text that echoes explanation bullets
    const explanationBlock = blocks.find(b => b.type === 'explanation');
    if (explanationBlock) {
      const expLines = new Set(
        (explanationBlock.content || '').split('\n')
          .map(l => l.replace(/^[-•*\d.]\s*/, '').trim().toLowerCase())
          .filter(l => l.length > 10)
      );
      setParsedBlocks(blocks.filter(b => {
        if (b.type !== 'text') return true;
        const lines = b.content.split('\n')
          .map(l => l.replace(/^[-•*\d.]\s*/, '').trim().toLowerCase())
          .filter(l => l.length > 10);
        if (lines.length === 0) return false;
        return lines.filter(l => expLines.has(l)).length / lines.length < 0.4;
      }));
    } else {
      setParsedBlocks(blocks);
    }
  }, [message.content]);

  const richBlobs = message.richBlobs || [];
  const hasChart = parsedBlocks.some(b => b.type === 'chart') || richBlobs.some(b => b.type === 'chart');

  return (
    <div className={`message-wrapper ${message.role}`}>
      <div className={`message-avatar ${message.role}-avatar`}>
        {message.role === 'user' ? <User size={20} color="#fff" /> : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <line x1="12" y1="2.5" x2="12" y2="5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="1.8" r="1.8" fill="white"/>
            <rect x="3.5" y="5" width="17" height="13" rx="4" fill="white" fillOpacity="0.18" stroke="white" strokeWidth="2"/>
            <circle cx="9" cy="11.5" r="2.4" fill="white"/>
            <circle cx="15" cy="11.5" r="2.4" fill="white"/>
            <circle cx="9.8" cy="10.8" r="0.9" fill="#6d28d9"/>
            <circle cx="15.8" cy="10.8" r="0.9" fill="#6d28d9"/>
            <path d="M8.5 15 Q12 17.2 15.5 15" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
            <rect x="1" y="9.5" width="2.5" height="4" rx="1.2" fill="white"/>
            <rect x="20.5" y="9.5" width="2.5" height="4" rx="1.2" fill="white"/>
          </svg>
        )}
      </div>

      <div className="message-content">
        {sqlQuery && !message.streaming && <NLSQLCard sql={sqlQuery} />}

        {/* Text + inline rich blocks (non-streaming fallback) */}
        {parsedBlocks.map((block, idx) => {
          if (block.type === 'text') return (
            <span key={idx} className={message.streaming && idx === parsedBlocks.length - 1 ? 'streaming-cursor' : ''}>
              <ReactMarkdown>{block.content}</ReactMarkdown>
            </span>
          );
          if (block.type === 'chart') return (
            <ChartRenderer key={idx} config={block} sqlQuery={sqlQuery} onPinChart={onPinChart} />
          );
          if (block.type === 'mermaid') return <MermaidDiagram key={idx} content={block.content} />;
          if (block.type === 'explanation') return <InsightCard key={idx} content={block.content} />;
          return null;
        })}

        {/* Rich blobs from SSE events */}
        {richBlobs.map((blob, idx) => {
          if (blob.type === 'chart') return (
            <ChartRenderer key={`r-${idx}`} config={blob} sqlQuery={sqlQuery} onPinChart={onPinChart} />
          );
          if (blob.type === 'mermaid') return <MermaidDiagram key={`r-${idx}`} content={blob.content} />;
          if (blob.type === 'explanation') return <InsightCard key={`r-${idx}`} content={blob.content} />;
          return null;
        })}

        {/* Raw data table — only when no chart rendered */}
        {sqlQuery && !hasChart && (() => {
          const resultStep = message.trace?.find(s => s.step === 'tool_result' && s.tool === 'tool_execute_query');
          if (!resultStep) return null;
          try {
            const data = JSON.parse(resultStep.output);
            if (Array.isArray(data) && data.length > 0)
              return <DataTable key="raw-table" data={data} sqlQuery={sqlQuery} />;
          } catch {}
          return null;
        })()}

        {message.trace?.length > 0 && <AgentTrace trace={message.trace} />}
      </div>
    </div>
  );
}
