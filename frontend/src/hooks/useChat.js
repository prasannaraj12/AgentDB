import { useState, useRef, useCallback } from 'react';
import { addHistoryEntry, updateHistoryEntry } from '../lib/queryHistory';

const SESSION_ID = 'session_' + Math.random().toString(36).slice(2);

/** Outcome of an agent turn, read from its tool trace. */
export function summarizeTrace(trace = []) {
  const sqlCalls = trace.filter((s) => s.step === 'tool_call' && s.tool === 'tool_execute_query');
  const sqlResults = trace.filter((s) => s.step === 'tool_result' && s.tool === 'tool_execute_query');
  let failed = false;
  let rows = null;
  let error = null;
  for (const r of sqlResults) {
    try {
      const parsed = JSON.parse(r.output);
      if (Array.isArray(parsed)) { if (rows === null) rows = parsed.length; }
      else if (parsed?.error) { failed = true; error = error || parsed.error; }
    } catch { /* non-JSON output */ }
  }
  // A failed attempt followed by a successful retry still answered the question.
  if (failed && rows !== null) failed = false;
  return {
    kind: sqlCalls.length ? 'sql' : 'chat',
    sql: sqlCalls[0]?.input?.sql_query || null,
    status: failed ? 'failed' : 'success',
    rows,
    error,
  };
}

function updateLast(setMessages, fn) {
  setMessages((prev) => {
    if (!prev.length) return prev;
    const msgs = [...prev];
    msgs[msgs.length - 1] = fn({ ...msgs[msgs.length - 1] });
    return msgs;
  });
}

export function useChat({ getDatabase } = {}) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);

  const appendAgentMessage = useCallback((text) => {
    setMessages((prev) => [...prev, { role: 'agent', content: text, notice: true }]);
  }, []);

  const clearChat = useCallback(async () => {
    setMessages([]);
    try { await fetch(`/chat/${SESSION_ID}`, { method: 'DELETE' }); } catch { /* backend offline */ }
  }, []);

  const sendMessage = useCallback(async (raw) => {
    const userMsg = raw?.trim();
    if (!userMsg || loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);

    const started = Date.now();
    const historyId = addHistoryEntry({ query: userMsg, ts: started, db: getDatabase?.() || null });
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMsg },
      { role: 'agent', content: '', trace: [], streaming: true, question: userMsg },
    ]);

    let finished = false;
    const finish = (patch) => {
      if (finished) return;
      finished = true;
      updateHistoryEntry(historyId, { durationMs: Date.now() - started, ...patch });
    };

    try {
      const response = await fetch('/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, session_id: SESSION_ID }),
      });
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          if (event.type === 'token') {
            updateLast(setMessages, (last) => ({ ...last, content: (last.content || '') + event.value }));
          } else if (event.type === 'rich') {
            updateLast(setMessages, (last) => {
              const existing = last.richBlobs || [];
              try {
                const obj = JSON.parse(event.value);
                return { ...last, richBlobs: [...existing.filter((b) => b.type !== obj.type), obj] };
              } catch { return last; }
            });
          } else if (event.type === 'done') {
            const trace = event.trace || [];
            updateLast(setMessages, (last) => ({ ...last, trace, streaming: false, durationMs: Date.now() - started }));
            const s = summarizeTrace(trace);
            finish({ status: s.status, kind: s.kind, sql: s.sql, rows: s.rows, error: s.error });
          } else if (event.type === 'error') {
            updateLast(setMessages, () => ({ role: 'agent', content: event.value, error: true, trace: [], streaming: false }));
            finish({ status: 'failed', kind: 'chat', error: event.value });
          }
        }
      }
    } catch {
      updateLast(setMessages, () => ({
        role: 'agent',
        content: 'Connection error. Make sure the backend is running.',
        error: true,
        trace: [],
        streaming: false,
      }));
      finish({ status: 'failed', kind: 'chat', error: 'Connection error' });
    } finally {
      finish({ status: 'failed', kind: 'chat', error: 'No response received' });
      loadingRef.current = false;
      setIsLoading(false);
      updateLast(setMessages, (last) => (last.role === 'agent' && last.streaming ? { ...last, streaming: false } : last));
    }
  }, [getDatabase]);

  return { messages, isLoading, sendMessage, appendAgentMessage, clearChat };
}
