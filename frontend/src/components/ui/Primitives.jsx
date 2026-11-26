import { ArrowUpRight, LoaderCircle } from 'lucide-react';

export function Panel({ title, subtitle, actions, className = '', children, as: Tag = 'section', ...rest }) {
  return (
    <Tag className={`ag-panel ${className}`} {...rest}>
      {(title || actions) && (
        <header className="ag-panel-head">
          <div>
            {title && <h2 className="ag-panel-title">{title}</h2>}
            {subtitle && <p className="ag-panel-sub">{subtitle}</p>}
          </div>
          {actions && <div className="ag-panel-actions">{actions}</div>}
        </header>
      )}
      {children}
    </Tag>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="ag-page-head">
      <div>
        <h1 className="ag-page-title">{title}</h1>
        {subtitle && <p className="ag-page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="ag-page-actions">{actions}</div>}
    </div>
  );
}

export function RoundAction({ onClick, label, dark = true, size = 30 }) {
  return (
    <button
      type="button"
      className={`ag-round-btn ${dark ? 'is-dark' : ''}`}
      style={{ width: size, height: size }}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <ArrowUpRight size={Math.round(size * 0.5)} strokeWidth={2.2} />
    </button>
  );
}

const STATUS_LABEL = { success: 'Success', failed: 'Failed', running: 'Running' };

export function StatusDot({ status }) {
  const key = STATUS_LABEL[status] ? status : 'unknown';
  return (
    <span className={`ag-status ag-status-${key}`} title={STATUS_LABEL[status] ? undefined : 'Outcome not recorded (saved before status tracking)'}>
      <span className="ag-status-dot" />
      {STATUS_LABEL[status] || 'Unknown'}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="ag-empty">
      {Icon && <span className="ag-empty-icon"><Icon size={18} /></span>}
      <p className="ag-empty-title">{title}</p>
      {children && <p className="ag-empty-text">{children}</p>}
      {action}
    </div>
  );
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="ag-loading" role="status">
      <LoaderCircle size={16} className="ag-spin" />
      <span>{label}</span>
    </div>
  );
}

export function Button({ variant = 'ghost', icon: Icon, children, className = '', ...rest }) {
  return (
    <button type="button" className={`ag-btn ag-btn-${variant} ${className}`} {...rest}>
      {Icon && <Icon size={14} />}
      {children && <span>{children}</span>}
    </button>
  );
}

export function Segmented({ options, value, onChange, label }) {
  return (
    <div className="ag-segmented" role="tablist" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? 'is-active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
