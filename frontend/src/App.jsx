import React, { useState, useEffect, useRef } from 'react';
import { Send, Database, Upload, LayoutDashboard, Trash2, ChevronDown, RotateCcw, Mic, MicOff, FileText } from 'lucide-react';
import ChatMessage from './components/ChatMessage';
import Dashboard from './components/Dashboard';
import ReportModal from './components/ReportModal';
import SharedDashboard from './components/SharedDashboard';
import { useChat } from './hooks/useChat';
import { useDatabase } from './hooks/useDatabase';
import { useVoiceInput } from './hooks/useVoiceInput';

const WELCOME = 'Hello! I am AgentDB, your Intelligent Database AI Agent. Ask me anything about your database: queries, charts, diagrams, or insights.';

export default function App() {
  if (window.location.pathname.startsWith('/share/')) return <SharedDashboard />;

  const [input, setInput] = useState('');
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [pinnedCharts, setPinnedCharts] = useState([]);
  const [dbOpen, setDbOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const endOfMessagesRef = useRef(null);
  const fileInputRef = useRef(null);

  const { messages, setMessages, isLoading, queryHistory, sendMessage, typewriteMessage } = useChat();

  const { databases, activeDb, attachedDbs, fetchDatabases, selectDb, attachDb, detachDb, uploadDb } =
    useDatabase((text) => setMessages((prev) => [...prev, { role: 'agent', content: text }]));

  const { isListening, toggle: toggleVoice } = useVoiceInput((text) => setInput(text));

  useEffect(() => { endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  // Typewrite welcome message on mount
  useEffect(() => {
    typewriteMessage(WELCOME);
  }, []);

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/suggestions');
      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch {}
  };

  useEffect(() => { fetchSuggestions(); }, [activeDb]);

  const handleSelectDb = async (filename) => {
    await selectDb(filename);
    fetchSuggestions();
  };

  const handleAttachDb = async (filename) => {
    await attachDb(filename);
    fetchSuggestions();
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await uploadDb(file);
    fetchSuggestions();
    e.target.value = '';
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput('');
    await sendMessage(msg);
  };

  const handleClearChat = () => {
    typewriteMessage('Chat cleared. How can I help you?');
  };

  const handlePinChart = (config) => setPinnedCharts((prev) => [...prev, config]);
  const handleUnpinChart = (i) => setPinnedCharts((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="app-container">
      {/* Title Bar */}
      <div className="titlebar">
        <div className="traffic-lights">
          <span className="tl tl-red" /><span className="tl tl-yellow" /><span className="tl tl-green" />
        </div>
        <span className="titlebar-title">AgentDB</span>
        <div className="titlebar-actions">
          <button className="mac-btn" onClick={() => setDashboardOpen(true)}>
            <LayoutDashboard size={13} /> Dashboard
            {pinnedCharts.length > 0 && <span className="badge">{pinnedCharts.length}</span>}
          </button>
          <button className="mac-btn" onClick={() => setReportOpen(true)}>
            <FileText size={13} /> Report
          </button>
          <button className="mac-btn" onClick={handleClearChat} title="Clear chat">
            <Trash2 size={13} />
          </button>
          <span className="status-dot" style={{ marginLeft: 4 }} />
          <span style={{ fontSize: '0.74rem', color: '#6e6e73' }}>Online</span>
        </div>
      </div>

      {/* Body */}
      <div className="mac-body">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-section-header" onClick={() => setDbOpen(o => !o)}>
              <span className="sidebar-section-title">Database</span>
              <ChevronDown size={12} className={`sidebar-section-chevron ${dbOpen ? 'open' : ''}`} />
            </div>
            <div className={`sidebar-section-body ${dbOpen ? '' : 'collapsed'}`}>
              <div className="db-selector-mac">
                <Database size={13} color="#6e6e73" />
                <select value={activeDb} onChange={(e) => handleSelectDb(e.target.value)} className="db-select">
                  {databases.map(db => <option key={db} value={db}>{db}</option>)}
                </select>
                <ChevronDown size={12} color="#6e6e73" />
              </div>

              {Object.entries(attachedDbs).map(([alias, filename]) => (
                <div key={alias} className="attached-db-row">
                  <span className="attached-db-badge">+</span>
                  <span className="attached-db-name" title={filename}>{alias}</span>
                  <button className="attached-db-remove" onClick={() => detachDb(alias)} title="Detach">×</button>
                </div>
              ))}

              {databases.filter(db => db !== activeDb && !Object.values(attachedDbs).includes(db)).length > 0 && (
                <select className="db-attach-select" defaultValue=""
                  onChange={(e) => { if (e.target.value) { handleAttachDb(e.target.value); e.target.value = ''; } }}>
                  <option value="" disabled>+ Attach another DB</option>
                  {databases.filter(db => db !== activeDb && !Object.values(attachedDbs).includes(db))
                    .map(db => <option key={db} value={db}>{db}</option>)}
                </select>
              )}

              <button className="sidebar-upload-btn" onClick={() => fileInputRef.current.click()}>
                <Upload size={12} /> Upload .db file
              </button>
              <input ref={fileInputRef} type="file" accept=".db,.sqlite,.sqlite3,.csv,.tsv,.json"
                style={{ display: 'none' }} onChange={handleUpload} />
            </div>
          </div>

          <div className="sidebar-divider" />

          <div className="sidebar-section" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingBottom: 0 }}>
            <div className="sidebar-section-header" onClick={() => setHistoryOpen(o => !o)}>
              <span className="sidebar-section-title">Query History</span>
              <ChevronDown size={12} className={`sidebar-section-chevron ${historyOpen ? 'open' : ''}`} />
            </div>
            <div className={`sidebar-section-body sidebar-history ${historyOpen ? '' : 'collapsed'}`} style={{ flex: 1 }}>
              {queryHistory.length === 0
                ? <p className="sidebar-empty">No queries yet</p>
                : queryHistory.map((item, i) => (
                  <div key={i} className="history-item" onClick={() => setInput(item.query)}>
                    <RotateCcw size={11} className="history-item-icon" />
                    <span className="history-item-text">{item.query}</span>
                  </div>
                ))
              }
            </div>
          </div>
        </aside>

        {/* Main Panel */}
        <div className="main-panel">
          <main className="chat-container">
            <div className="chat-inner">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} onPinChart={handlePinChart} />
              ))}
              {isLoading && !messages[messages.length - 1]?.streaming && (
                <div className="message-wrapper agent">
                  <div className="message-avatar agent-avatar"><Database size={14} color="#fff" /></div>
                  <div className="message-content" style={{ display: 'flex', alignItems: 'center', minHeight: '42px' }}>
                    <div className="typing-indicator">
                      <div className="dot" /><div className="dot" /><div className="dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>
          </main>

          <footer className="input-container">
            <div className="input-inner">
              {suggestions.length > 0 && messages.length <= 1 && !isLoading && (
                <div className="suggestions-row">
                  {suggestions.map((s, i) => (
                    <button key={i} className="suggestion-chip" onClick={() => setInput(s)}>{s}</button>
                  ))}
                </div>
              )}
              <form onSubmit={handleSend} className="input-box">
                <input type="text" className="input-field" value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your database, request a chart, or ask for insights..."
                  autoFocus disabled={isLoading} />
                <button type="button" className={`mic-btn ${isListening ? 'listening' : ''}`}
                  onClick={toggleVoice} title="Voice input">
                  {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                </button>
                <button type="submit" className="send-btn" disabled={!input.trim() || isLoading}>
                  <Send size={15} />
                </button>
              </form>
            </div>
          </footer>
        </div>
      </div>

      {dashboardOpen && (
        <Dashboard pinned={pinnedCharts} onUnpin={handleUnpinChart} onClose={() => setDashboardOpen(false)} />
      )}
      {reportOpen && <ReportModal onClose={() => setReportOpen(false)} />}
    </div>
  );
}
