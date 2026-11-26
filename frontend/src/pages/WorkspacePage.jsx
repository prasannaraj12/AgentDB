import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Mic, MicOff, Plus, Upload, X, Database, History, Sparkles, LoaderCircle } from 'lucide-react';
import ChatMessage from '../components/ChatMessage';
import { useApp } from '../lib/appContext';
import { useQueryHistory } from '../lib/queryHistory';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { formatRelative } from '../lib/dbInsights';
import { StatusDot } from '../components/ui/Primitives';

function ContextBar() {
  const { db } = useApp();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const run = async (label, fn) => {
    setBusy(label);
    setError(null);
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(null); }
  };

  const attachable = db.databases.filter((d) => d !== db.activeDb && !Object.values(db.attachedDbs).includes(d));

  return (
    <div className="ag-context">
      <div className="ag-context-db">
        <Database size={14} />
        <label className="ag-visually-hidden" htmlFor="ws-db">Active database</label>
        <select id="ws-db" value={db.activeDb} disabled={!!busy}
          onChange={(e) => run('select', () => db.selectDb(e.target.value))}>
          {(db.databases.length ? db.databases : [db.activeDb]).map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {Object.entries(db.attachedDbs).map(([alias, file]) => (
        <span key={alias} className="ag-context-chip" title={`${file} attached as [${alias}]`}>
          +{alias}
          <button type="button" onClick={() => run('detach', () => db.detachDb(alias))} aria-label={`Detach ${alias}`}><X size={11} /></button>
        </span>
      ))}
      {attachable.length > 0 && (
        <select className="ag-context-attach" value="" disabled={!!busy}
          onChange={(e) => { const f = e.target.value; if (f) run('attach', () => db.attachDb(f)); }}
          aria-label="Attach another database">
          <option value="" disabled>Attach database…</option>
          {attachable.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      )}
      <button type="button" className="ag-mini-btn" disabled={!!busy} onClick={() => fileRef.current?.click()}>
        {busy === 'upload' ? <LoaderCircle size={12} className="ag-spin" /> : <Upload size={12} />} Upload
      </button>
      <input ref={fileRef} type="file" hidden accept=".db,.sqlite,.sqlite3,.csv,.tsv,.json"
        onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) run('upload', () => db.uploadDb(f)); }} />
      {error && <span className="ag-context-error" role="alert">{error}</span>}
    </div>
  );
}

function HistoryRail({ onPick, onNewChat, disabled }) {
  const history = useQueryHistory();
  return (
    <aside className="ag-rail" aria-label="Recent questions">
      <button type="button" className="ag-btn ag-btn-dark ag-rail-new" onClick={onNewChat} disabled={disabled}>
        <Plus size={14} /> New conversation
      </button>
      <p className="ag-rail-label"><History size={12} /> Recent questions</p>
      {history.length === 0 ? <p className="ag-rail-empty">Your questions will appear here.</p> : (
        <ul className="ag-rail-list">
          {history.slice(0, 40).map((e) => (
            <li key={e.id || e.ts}>
              <button type="button" onClick={() => onPick(e.query)} title={e.query}>
                <span className="ag-rail-q">{e.query}</span>
                <span className="ag-rail-meta">
                  <StatusDot status={e.status} />
                  <span>{formatRelative(e.ts)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function Composer({ value, setValue, onSend, disabled }) {
  const ref = useRef(null);
  const { isListening, toggle } = useVoiceInput((t) => setValue(t));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [value]);

  const submit = (e) => {
    e?.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value.trim());
    setValue('');
  };

  return (
    <form className="ag-composer" onSubmit={submit}>
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) submit(e); }}
        placeholder="Ask about your data, request a chart, or draw an ER diagram…"
        aria-label="Message AgentDB"
        autoFocus
      />
      <div className="ag-composer-actions">
        <button type="button" className={`ag-icon-btn ${isListening ? 'is-recording' : ''}`} onClick={toggle}
          aria-label={isListening ? 'Stop voice input' : 'Voice input'} title="Voice input">
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
        <button type="submit" className="ag-send" disabled={!value.trim() || disabled} aria-label="Send">
          {disabled ? <LoaderCircle size={16} className="ag-spin" /> : <ArrowUp size={16} strokeWidth={2.4} />}
        </button>
      </div>
    </form>
  );
}

export default function WorkspacePage() {
  const { chat, db, suggestions, pinChart } = useApp();
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);
  const { messages, isLoading, sendMessage, clearChat } = chat;

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const empty = messages.length === 0;

  return (
    <div className="ag-workspace">
      <HistoryRail onPick={setDraft} onNewChat={clearChat} disabled={isLoading} />
      <section className="ag-convo">
        <ContextBar />
        <div className="ag-thread" aria-live="polite">
          {empty ? (
            <div className="ag-welcome">
              <span className="ag-welcome-icon"><Sparkles size={20} /></span>
              <h1>Ask anything about {db.activeDb}</h1>
              <p>AgentDB writes the SQL, runs it read-only, and answers with tables, charts, diagrams and insights.</p>
              {suggestions.length > 0 && (
                <div className="ag-suggestions">
                  {suggestions.map((s) => (
                    <button key={s} type="button" onClick={() => sendMessage(s)} disabled={isLoading}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="ag-thread-inner">
              {messages.map((m, i) => <ChatMessage key={i} message={m} onPinChart={pinChart} />)}
              <div ref={endRef} />
            </div>
          )}
        </div>
        <Composer value={draft} setValue={setDraft} onSend={sendMessage} disabled={isLoading} />
        <p className="ag-composer-hint">Enter to send · Shift + Enter for a new line · Queries are read-only</p>
      </section>
    </div>
  );
}
