import { useState, useRef } from 'react';

const SESSION_ID = 'session_' + Math.random().toString(36).slice(2);

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('queryHistory') || '[]'); } catch { return []; }
  });

  const saveHistory = (history) => {
    setQueryHistory(history);
    localStorage.setItem('queryHistory', JSON.stringify(history));
  };

  const appendAgentMessage = (text) => {
    setMessages((prev) => [...prev, { role: 'agent', content: text }]);
  };

  const typewriteMessage = (text, onDone) => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setMessages([{ role: 'agent', content: text.slice(0, i), streaming: i < text.length }]);
      if (i >= text.length) { clearInterval(interval); onDone?.(); }
    }, 22);
    return () => clearInterval(interval);
  };

  const sendMessage = async (userMsg) => {
    if (!userMsg.trim() || isLoading) return;
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    saveHistory([{ query: userMsg, ts: Date.now() }, ...queryHistory.slice(0, 49)]);
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: 'agent', content: '', trace: [], streaming: true, question: userMsg }]);

    try {
      const response = await fetch('/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, session_id: SESSION_ID }),
      });

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
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'token') {
              setMessages((prev) => {
                const msgs = [...prev];
                const last = { ...msgs[msgs.length - 1] };
                last.content = (last.content || '') + event.value;
                msgs[msgs.length - 1] = last;
                return msgs;
              });
            } else if (event.type === 'rich') {
              setMessages((prev) => {
                const msgs = [...prev];
                const last = { ...msgs[msgs.length - 1] };
                const existing = last.richBlobs || [];
                try {
                  const obj = JSON.parse(event.value);
                  last.richBlobs = [...existing.filter((b) => b.type !== obj.type), obj];
                } catch { last.richBlobs = existing; }
                msgs[msgs.length - 1] = last;
                return msgs;
              });
            } else if (event.type === 'done') {
              setMessages((prev) => {
                const msgs = [...prev];
                const last = { ...msgs[msgs.length - 1] };
                last.trace = event.trace || [];
                last.streaming = false;
                msgs[msgs.length - 1] = last;
                return msgs;
              });
            } else if (event.type === 'error') {
              setMessages((prev) => {
                const msgs = [...prev];
                msgs[msgs.length - 1] = { role: 'agent', content: `Error: ${event.value}`, trace: [] };
                return msgs;
              });
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch {
      setMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = {
          role: 'agent',
          content: 'Connection error. Make sure the backend is running.',
          trace: [],
          streaming: false,
        };
        return msgs;
      });
    } finally {
      setIsLoading(false);
      setMessages((prev) => {
        const msgs = [...prev];
        const last = msgs[msgs.length - 1];
        if (last?.role === 'agent' && last?.streaming) {
          msgs[msgs.length - 1] = { ...last, streaming: false };
        }
        return msgs;
      });
    }
  };

  return { messages, setMessages, isLoading, queryHistory, sendMessage, appendAgentMessage, typewriteMessage };
}
