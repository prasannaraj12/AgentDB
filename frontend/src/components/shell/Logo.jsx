/** AgentDB mark: a database cylinder with a spark, drawn inline (no external asset). */
export default function Logo({ collapsed = false }) {
  return (
    <span className="ag-logo">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect width="26" height="26" rx="8" fill="#7565E8" />
        <ellipse cx="11.5" cy="8.2" rx="5.5" ry="2.2" stroke="#fff" strokeWidth="1.7" />
        <path d="M6 8.2v9.3c0 1.2 2.5 2.2 5.5 2.2 1 0 2-.1 2.8-.4M17 8.2v3.6" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M6 12.9c0 1.2 2.5 2.2 5.5 2.2.6 0 1.2 0 1.8-.1" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M19.2 13.2l.75 1.9 1.9.75-1.9.75-.75 1.9-.75-1.9-1.9-.75 1.9-.75z" fill="#fff" />
      </svg>
      {!collapsed && <span className="ag-logo-word">AgentDB</span>}
    </span>
  );
}
