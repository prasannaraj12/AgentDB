import { useState } from 'react';
import { Copy, Check, ChevronDown } from 'lucide-react';
import { formatSql, highlightSql } from '../../lib/sqlHighlight';

const COLLAPSE_LINES = 7;

/** Generated SQL with highlighting, copy, expand/collapse and its execution status. */
export default function SqlBlock({ sql, status, label = 'Generated SQL' }) {
  const [copied, setCopied] = useState(false);
  const formatted = formatSql(sql);
  const lineCount = formatted.split('\n').length;
  const collapsible = lineCount > COLLAPSE_LINES;
  const [expanded, setExpanded] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(sql);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className="ag-sql">
      <div className="ag-sql-head">
        <span className="ag-sql-lang">SQL</span>
        <span className="ag-sql-label">{label}</span>
        {status && (
          <span className={`ag-sql-status is-${status.kind}`} title={status.title}>
            <span className="ag-status-dot" />{status.text}
          </span>
        )}
        <div className="ag-sql-actions">
          {collapsible && (
            <button type="button" className="ag-mini-btn" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
              <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none' }} />
              {expanded ? 'Collapse' : `Expand (${lineCount} lines)`}
            </button>
          )}
          <button type="button" className="ag-mini-btn" onClick={copy} aria-label="Copy SQL">
            {copied ? <Check size={12} /> : <Copy size={12} />}{copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>
      <pre className={`ag-sql-code ${collapsible && !expanded ? 'is-collapsed' : ''}`}>
        <code>{highlightSql(formatted)}</code>
      </pre>
    </div>
  );
}
