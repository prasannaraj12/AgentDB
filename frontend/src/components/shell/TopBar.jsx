import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Menu, Sparkles, Download, CornerDownLeft } from 'lucide-react';
import { NAV_PAGES as PAGES } from '../../lib/navigation';
import { navigate, ROUTES } from '../../lib/router';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');

export default function TopBar({ onOpenMobileNav, onAsk, connection, activeDb, displayName, installPrompt, onInstall }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = (q ? PAGES.filter((p) => p.label.toLowerCase().includes(q)) : PAGES.slice(0, 5))
      .map((p) => ({ kind: 'page', ...p }));
    return q ? [{ kind: 'ask', label: query.trim() }, ...pages] : pages;
  }, [query]);

  const choose = (opt) => {
    if (!opt) return;
    if (opt.kind === 'ask') onAsk(opt.label);
    else navigate(opt.to);
    setQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHighlight((h) => Math.min(h + 1, options.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(options[highlight]); }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur(); }
  };

  return (
    <header className="ag-topbar">
      <button className="ag-icon-btn ag-only-mobile" onClick={onOpenMobileNav} aria-label="Open navigation">
        <Menu size={18} />
      </button>

      <div className="ag-search" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
        <Search size={15} className="ag-search-icon" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setHighlight(0); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search database, queries or commands..."
          aria-label="Search database, queries or commands"
          role="combobox"
          aria-expanded={open}
          aria-controls="ag-search-list"
        />
        <kbd className="ag-kbd">{isMac ? '⌘' : 'Ctrl'} K</kbd>
        {open && options.length > 0 && (
          <ul className="ag-search-menu" id="ag-search-list" role="listbox">
            {options.map((opt, i) => {
              const Icon = opt.kind === 'ask' ? Sparkles : opt.icon;
              return (
                <li key={opt.kind + opt.label} role="option" aria-selected={i === highlight}>
                  <button
                    type="button"
                    className={i === highlight ? 'is-active' : ''}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => choose(opt)}
                  >
                    <Icon size={14} />
                    {opt.kind === 'ask'
                      ? <span className="ag-search-ask">Ask AgentDB: <b>{opt.label}</b></span>
                      : <span>Go to {opt.label}</span>}
                    {i === highlight && <CornerDownLeft size={12} className="ag-search-enter" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="ag-topbar-right">
        {installPrompt && (
          <button className="ag-btn ag-btn-ghost" onClick={onInstall}>
            <Download size={14} /><span>Install</span>
          </button>
        )}
        <span className={`ag-pill-status ag-conn-${connection}`} title={connection === 'online' ? `Connected to ${activeDb}` : 'Backend unreachable'}>
          <span className="ag-conn-dot" />
          <span className="ag-pill-status-text">{connection === 'online' ? activeDb : connection === 'offline' ? 'Offline' : 'Connecting…'}</span>
        </span>
        <button
          className="ag-avatar"
          onClick={() => navigate(ROUTES.settings)}
          aria-label={displayName ? `${displayName} — settings` : 'Workspace settings'}
          title={displayName || 'Set your name in Settings'}
        >
          {(displayName || 'A').trim().charAt(0).toUpperCase()}
        </button>
      </div>
    </header>
  );
}
