import { navigate } from '../../lib/router';

export function InsightList({ items }) {
  return (
    <div className="ag-insight-list">
      {items.map(({ id, tone, icon: Icon, title, text, to }, i) => (
        <article key={id} className="ag-insight" style={{ animationDelay: `${80 + i * 60}ms` }}>
          <header className="ag-insight-head">
            <span className={`ag-insight-icon tone-${tone}`}><Icon size={12} strokeWidth={2.2} /></span>
            <h3>{title}</h3>
          </header>
          <p>{text}</p>
          <a href={to} onClick={(e) => { e.preventDefault(); navigate(to); }} className="ag-link">View Details</a>
        </article>
      ))}
    </div>
  );
}
