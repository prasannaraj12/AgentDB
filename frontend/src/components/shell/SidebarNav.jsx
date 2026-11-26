import { PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import Logo from './Logo';
import { navigate, ROUTES } from '../../lib/router';
import { NAV_SECTIONS } from '../../lib/navigation';

export default function SidebarNav({ path, collapsed, onToggleCollapse, mobileOpen, onCloseMobile, connection, activeDb, attachedCount }) {
  const go = (to) => (e) => {
    e.preventDefault();
    navigate(to);
    onCloseMobile?.();
  };

  return (
    <>
      <div className={`ag-scrim ${mobileOpen ? 'is-open' : ''}`} onClick={onCloseMobile} aria-hidden="true" />
      <aside className={`ag-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'is-mobile-open' : ''}`} aria-label="Main navigation">
        <div className="ag-sidebar-brand">
          <a href={ROUTES.workspace} onClick={go(ROUTES.workspace)} className="ag-brand-link" aria-label="AgentDB home (AI Workspace)">
            <Logo collapsed={collapsed} />
          </a>
          <button className="ag-icon-btn ag-only-mobile" onClick={onCloseMobile} aria-label="Close navigation">
            <X size={16} />
          </button>
        </div>
        <div className="ag-divider" />

        <nav className="ag-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="ag-nav-section">
              <p className="ag-nav-label">{section.label}</p>
              {section.items.map(({ to, label, icon: Icon }) => {
                const active = path === to;
                return (
                  <a
                    key={to}
                    href={to}
                    onClick={go(to)}
                    className={`ag-nav-item ${active ? 'is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? label : undefined}
                  >
                    <Icon size={16} strokeWidth={1.8} />
                    <span className="ag-nav-text">{label}</span>
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="ag-sidebar-foot">
          <div className={`ag-conn ag-conn-${connection}`} title={connection === 'online' ? `Connected to ${activeDb}` : 'Backend unreachable'}>
            <span className="ag-conn-dot" />
            <div className="ag-conn-text">
              <span className="ag-conn-db">{activeDb}</span>
              <span className="ag-conn-meta">
                {connection === 'online' ? 'Connected' : connection === 'offline' ? 'Offline' : 'Connecting…'}
                {attachedCount > 0 && ` · +${attachedCount} attached`}
              </span>
            </div>
          </div>
          <button className="ag-icon-btn ag-collapse-btn" onClick={onToggleCollapse} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </aside>
    </>
  );
}
