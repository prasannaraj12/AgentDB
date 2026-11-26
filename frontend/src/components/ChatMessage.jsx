import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ChevronDown, Copy, Check, Lightbulb, Terminal, TriangleAlert, Info, Network } from 'lucide-react';
import ChartRenderer from './ChartRenderer';
import MermaidDiagram from './MermaidDiagram';
import DataTable from './DataTable';
import SqlBlock from './workspace/SqlBlock';
import Logo from './shell/Logo';
import { Segmented } from './ui/Primitives';
import { formatDuration } from '../lib/dbInsights';

const RICH_TYPES = ['chart', 'mermaid', 'explanation'];

/** Locate balanced {...} objects in free text (for replies that inline JSON blobs). */
function findJsonObjects(str) {
  const results = [];
  let i = 0;
  while (i < str.length) {
    if (str[i] === '{') {
      let depth = 0, j = i, inStr = false, esc = false;
      while (j < str.length) {
        const c = str[j];
        if (esc) esc = false;
        else if (c === '\\' && inStr) esc = true;
        else if (c === '"') inStr = !inStr;
        else if (!inStr) {
          if (c === '{') depth++;
          else if (c === '}') { depth--; if (depth === 0) break; }
        }
        j++;
      }
      if (depth === 0) { results.push({ start: i, end: j + 1, raw: str.slice(i, j + 1) }); i = j + 1; } else i++;
    } else i++;
  }
  return results;
}

/** Split reply text into prose and any inline chart/mermaid/explanation blobs. */
function parseContent(content) {
  const text = [];
  const blobs = [];
  const cleaned = (content || '').replace(/```json\s*/g, '').replace(/```\s*/g, '');
  let last = 0;
  for (const { start, end, raw } of findJsonObjects(cleaned)) {
    try {
      let obj = JSON.parse(raw);
      const wrapper = Object.keys(obj).find((k) => k.endsWith('_response'));
      if (wrapper && obj[wrapper]?.type) obj = obj[wrapper];
      if (!RICH_TYPES.includes(obj.type)) continue;
      text.push(cleaned.slice(last, start));
      blobs.push(obj);
      last = end;
    } catch { /* not JSON */ }
  }
  text.push(cleaned.slice(last));
  return { text: text.join('').trim(), blobs };
}

/** SQL calls paired with their results from the agent trace. */
function sqlRuns(trace = []) {
  const runs = [];
  trace.forEach((step, i) => {
    if (step.step !== 'tool_call' || step.tool !== 'tool_execute_query') return;
    const result = trace.slice(i + 1).find((s) => s.step === 'tool_result' && s.tool === 'tool_execute_query');
    let rows = null;
    let error = null;
    if (result) {
      try {
        const parsed = JSON.parse(result.output);
        if (Array.isArray(parsed)) rows = parsed;
        else if (parsed?.error) error = parsed.error;
      } catch { /* ignore */ }
    }
    runs.push({ sql: step.input?.sql_query || '', rows, error });
  });
  return runs;
}

function InsightCard({ content }) {
  const [copied, setCopied] = useState(false);
  const lines = content.split('\n').map((l) => l.replace(/^#{1,6}\s+/, '').trim()).filter(Boolean);
  const bullets = lines.some((l) => /^[-•*]\s/.test(l) || /^\d+\.\s/.test(l));
  const copy = async () => {
    try { await navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* ignore */ }
  };
  return (
    <section className="ag-answer-block ag-insights-card">
      <header className="ag-block-head">
        <span className="ag-block-icon tone-violet"><Lightbulb size={12} /></span>
        <h4>Insights</h4>
        <button type="button" className="ag-mini-btn" onClick={copy}>{copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy'}</button>
      </header>
      {bullets ? (
        <ul className="ag-insight-bullets">
          {lines.map((l, i) => <li key={i}><ReactMarkdown>{l.replace(/^([-•*]|\d+\.)\s*/, '')}</ReactMarkdown></li>)}
        </ul>
      ) : <div className="ag-md"><ReactMarkdown>{lines.join('\n\n')}</ReactMarkdown></div>}
    </section>
  );
}

const TOOL_LABELS = {
  tool_get_schema: 'Read schema',
  tool_execute_query: 'Execute SQL',
  tool_generate_chart: 'Generate chart',
  tool_generate_flowchart: 'Generate diagram',
  tool_explain_data: 'Write insights',
};

function AgentSteps({ trace, durationMs }) {
  const [open, setOpen] = useState(false);
  const calls = trace.filter((s) => s.step === 'tool_call');
  if (!calls.length) return null;
  return (
    <div className="ag-steps">
      <button type="button" className="ag-steps-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <Terminal size={12} />
        <span>Agent steps</span>
        <span className="ag-steps-count">{calls.length}</span>
        {typeof durationMs === 'number' && <span className="ag-steps-time">{formatDuration(durationMs)}</span>}
        <ChevronDown size={12} className="ag-steps-chevron" style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <ol className="ag-steps-list">
          {calls.map((c, i) => (
            <li key={i}>
              <span className="ag-steps-dot" />
              <span className="ag-steps-name">{TOOL_LABELS[c.tool] || c.tool}</span>
              {c.tool === 'tool_execute_query' && <code className="ag-steps-detail">{c.input?.sql_query}</code>}
              {c.tool === 'tool_generate_chart' && <code className="ag-steps-detail">{c.input?.chart_type} · {c.input?.x_axis} × {c.input?.y_axis}</code>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function ResultSection({ chart, rows, sql, onPinChart }) {
  const hasChart = Boolean(chart);
  const tableData = rows?.length ? rows : chart?.data;
  const [view, setView] = useState(hasChart ? 'chart' : 'table');
  if (!hasChart && !tableData?.length) return null;
  const effective = hasChart ? view : 'table';
  return (
    <section className="ag-answer-block ag-result">
      <header className="ag-block-head">
        <h4>Result</h4>
        {hasChart && tableData?.length > 0 && (
          <Segmented
            label="Result view"
            value={effective}
            onChange={setView}
            options={[{ value: 'chart', label: 'Chart' }, { value: 'table', label: 'Table' }]}
          />
        )}
      </header>
      {effective === 'chart' ? <ChartRenderer config={chart} onPinChart={onPinChart} /> : <DataTable data={tableData} sqlQuery={sql} />}
    </section>
  );
}

function UserMessage({ content }) {
  return (
    <div className="ag-msg is-user">
      <div className="ag-user-bubble">{content}</div>
    </div>
  );
}

export default function ChatMessage({ message, onPinChart }) {
  const { text, blobs: inlineBlobs } = useMemo(() => parseContent(message.content), [message.content]);

  if (message.role === 'user') return <UserMessage content={message.content} />;

  if (message.notice) {
    return (
      <div className="ag-msg-notice"><Info size={12} /><ReactMarkdown>{message.content}</ReactMarkdown></div>
    );
  }

  if (message.error) {
    return (
      <div className="ag-msg is-agent">
        <span className="ag-msg-avatar"><Logo collapsed /></span>
        <div className="ag-msg-body">
          <div className="ag-msg-error"><TriangleAlert size={14} /><span>{message.content}</span></div>
        </div>
      </div>
    );
  }

  const blobs = [...inlineBlobs, ...(message.richBlobs || [])];
  const byType = (t) => [...blobs].reverse().find((b) => b.type === t);
  const chart = byType('chart');
  const diagram = byType('mermaid');
  const explanation = byType('explanation');
  const trace = message.trace || [];
  const runs = sqlRuns(trace);
  const primary = runs.find((r) => r.rows) || runs[0];
  const thinking = message.streaming && !text && !blobs.length;

  return (
    <div className="ag-msg is-agent">
      <span className="ag-msg-avatar"><Logo collapsed /></span>
      <div className="ag-msg-body">
        {thinking ? (
          <div className="ag-thinking" role="status">
            <span className="ag-thinking-dots"><i /><i /><i /></span>
            Analyzing your question…
          </div>
        ) : (
          text && (
            <div className={`ag-md ag-summary ${message.streaming ? 'is-streaming' : ''}`}>
              <ReactMarkdown>{text}</ReactMarkdown>
            </div>
          )
        )}

        {!message.streaming && runs.map((r, i) => (
          <SqlBlock
            key={i}
            sql={r.sql}
            label={runs.length > 1 ? `Query ${i + 1} of ${runs.length}` : 'Generated SQL'}
            status={r.error
              ? { kind: 'failed', text: 'Failed', title: r.error }
              : r.rows ? { kind: 'success', text: `Success · ${r.rows.length.toLocaleString()} ${r.rows.length === 1 ? 'row' : 'rows'}` } : null}
          />
        ))}

        {!message.streaming && <ResultSection chart={chart} rows={primary?.rows} sql={primary?.sql} onPinChart={onPinChart} />}

        {diagram && (
          <section className="ag-answer-block">
            <header className="ag-block-head">
              <span className="ag-block-icon tone-blue"><Network size={12} /></span>
              <h4>Diagram</h4>
            </header>
            <MermaidDiagram content={diagram.content} />
          </section>
        )}

        {explanation && <InsightCard content={explanation.content} />}

        {!message.streaming && <AgentSteps trace={trace} durationMs={message.durationMs} />}
      </div>
    </div>
  );
}
