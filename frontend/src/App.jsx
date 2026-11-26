import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import SharedDashboard from './components/SharedDashboard';
import LandingPage from './components/LandingPage';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
import SidebarNav from './components/shell/SidebarNav';
import TopBar from './components/shell/TopBar';
import DashboardPage from './pages/DashboardPage';
import WorkspacePage from './pages/WorkspacePage';
import InsightsPage from './pages/InsightsPage';
import ReportsPage from './pages/ReportsPage';
import HistoryPage from './pages/HistoryPage';
import ExplorerPage from './pages/ExplorerPage';
import SchemaPage from './pages/SchemaPage';
import ErDiagramPage from './pages/ErDiagramPage';
import SettingsPage from './pages/SettingsPage';
import { useChat } from './hooks/useChat';
import { useDatabase } from './hooks/useDatabase';
import { useReport } from './hooks/useReport';
import { navigate, usePath, ROUTES } from './lib/router';
import { AppContext } from './lib/appContext';
import './styles/agentdb.css';
import './styles/workspace.css';
import './styles/pages.css';

const PAGES = {
  [ROUTES.dashboard]: DashboardPage,
  [ROUTES.workspace]: WorkspacePage,
  [ROUTES.insights]: InsightsPage,
  [ROUTES.reports]: ReportsPage,
  [ROUTES.history]: HistoryPage,
  [ROUTES.explorer]: ExplorerPage,
  [ROUTES.schema]: SchemaPage,
  [ROUTES.er]: ErDiagramPage,
  [ROUTES.settings]: SettingsPage,
};

function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function useStoredState(key, fallback) {
  const [value, setValue] = useState(() => readStored(key, fallback));
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  }, [key, value]);
  return [value, setValue];
}

function Landing() {
  useEffect(() => {
    document.body.classList.add('landing');
    return () => document.body.classList.remove('landing');
  }, []);
  return <LandingPage onLaunch={() => navigate(ROUTES.dashboard)} />;
}

function AgentDBApp({ path }) {
  const [collapsed, setCollapsed] = useStoredState('agentdb.sidebarCollapsed', false);
  const [mobileNav, setMobileNav] = useState(false);
  const [displayName, setDisplayName] = useStoredState('agentdb.displayName', '');
  const [pinnedCharts, setPinnedCharts] = useStoredState('agentdb.pinnedCharts', []);
  const [installPrompt, setInstallPrompt] = useState(null);

  const notifyRef = useRef(null);
  const onDbMessage = useCallback((text) => notifyRef.current?.(text), []);
  const db = useDatabase(onDbMessage);
  const activeDbRef = useRef(db.activeDb);
  useEffect(() => { activeDbRef.current = db.activeDb; }, [db.activeDb]);
  const getDatabase = useCallback(() => activeDbRef.current, []);

  const chat = useChat({ getDatabase });
  useEffect(() => { notifyRef.current = chat.appendAgentMessage; }, [chat.appendAgentMessage]);

  const report = useReport(db.version);

  const [suggestions, setSuggestions] = useState([]);
  useEffect(() => {
    let cancelled = false;
    fetch('/suggestions')
      .then((r) => (r.ok ? r.json() : { suggestions: [] }))
      .then((d) => { if (!cancelled) setSuggestions(d.suggestions || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [db.version]);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const { sendMessage } = chat;
  const ask = useCallback((text) => {
    navigate(ROUTES.workspace);
    sendMessage(text);
  }, [sendMessage]);

  const ctx = useMemo(() => ({
    chat, db, report, suggestions, ask, displayName, setDisplayName,
    pinnedCharts,
    pinChart: (config) => setPinnedCharts((prev) => [...prev, config]),
    unpinChart: (index) => setPinnedCharts((prev) => prev.filter((_, i) => i !== index)),
    clearPinned: () => setPinnedCharts([]),
  }), [chat, db, report, suggestions, ask, displayName, setDisplayName, pinnedCharts, setPinnedCharts]);

  const Page = PAGES[path];
  useEffect(() => {
    if (!Page) navigate(ROUTES.dashboard, { replace: true });
  }, [Page]);

  return (
    <AppContext.Provider value={ctx}>
      <div className="ag-app">
        <div className={`ag-frame ${collapsed ? 'is-collapsed' : ''}`}>
          <SidebarNav
            path={path}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((c) => !c)}
            mobileOpen={mobileNav}
            onCloseMobile={() => setMobileNav(false)}
            connection={db.connection}
            activeDb={db.activeDb}
            attachedCount={Object.keys(db.attachedDbs).length}
          />
          <div className="ag-main">
            <TopBar
              onOpenMobileNav={() => setMobileNav(true)}
              onAsk={ask}
              connection={db.connection}
              activeDb={db.activeDb}
              displayName={displayName}
              installPrompt={installPrompt}
              onInstall={handleInstall}
            />
            <main className={`ag-content ${path === ROUTES.workspace ? 'is-workspace' : ''}`} key={path}>
              {Page && <Page />}
            </main>
          </div>
        </div>
      </div>
    </AppContext.Provider>
  );
}

export default function App() {
  const path = usePath();
  let content;
  if (path.startsWith('/share/')) content = <SharedDashboard />;
  else if (path === '/app' || path.startsWith('/app/')) content = <AgentDBApp path={path} />;
  else content = <Landing />;
  return (
    <>
      {content}
      <PWAUpdatePrompt />
    </>
  );
}
