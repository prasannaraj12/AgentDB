import React from 'react';
import { Clock, Trash2, RotateCcw } from 'lucide-react';

export default function Sidebar({ history, onReplay, onClear, open }) {
  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="sidebar-header">
        <Clock size={15} />
        <span>Query History</span>
        {history.length > 0 && (
          <button className="sidebar-clear" onClick={onClear} title="Clear history">
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <div className="sidebar-list">
        {history.length === 0 && (
          <p className="sidebar-empty">No queries yet</p>
        )}
        {history.map((item, i) => (
          <div key={i} className="sidebar-item" onClick={() => onReplay(item.query)}>
            <span className="sidebar-item-text">{item.query}</span>
            <RotateCcw size={12} className="sidebar-replay-icon" />
          </div>
        ))}
      </div>
    </aside>
  );
}
