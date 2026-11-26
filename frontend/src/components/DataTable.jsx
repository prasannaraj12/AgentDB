import { useState } from 'react';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 10;

const isNumeric = (v) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v)) && /^-?[\d.,]+$/.test(v.trim()));

function formatCell(v) {
  if (v === null || v === undefined) return <span className="ag-null">NULL</span>;
  if (typeof v === 'number') return Number.isInteger(v) ? v.toLocaleString() : v.toLocaleString(undefined, { maximumFractionDigits: 4 });
  return String(v);
}

/** Query results table: row count, numeric alignment, pagination, horizontal scroll, CSV export. */
export default function DataTable({ data, sqlQuery, compact = false }) {
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  const numericCols = new Set(columns.filter((c) => data.slice(0, 50).every((r) => r[c] === null || r[c] === undefined || isNumeric(r[c]))));
  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const current = Math.min(page, totalPages - 1);
  const pageData = data.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const handleExport = async () => {
    if (!sqlQuery) return;
    setExporting(true);
    try {
      const res = await fetch('/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql_query: sqlQuery }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agentdb-export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={`ag-dt ${compact ? 'is-compact' : ''}`}>
      <div className="ag-dt-head">
        <span className="ag-dt-count">
          {data.length.toLocaleString()} {data.length === 1 ? 'row' : 'rows'} · {columns.length} {columns.length === 1 ? 'column' : 'columns'}
        </span>
        {sqlQuery && (
          <button type="button" className="ag-mini-btn" onClick={handleExport} disabled={exporting} title="Export results as CSV">
            <Download size={12} /> {exporting ? 'Exporting…' : 'CSV'}
          </button>
        )}
      </div>
      <div className="ag-table-scroll">
        <table className="ag-table ag-dt-table">
          <thead>
            <tr>{columns.map((c) => <th key={c} className={numericCols.has(c) ? 'num' : ''}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => <td key={c} className={numericCols.has(c) ? 'num' : ''}>{formatCell(row[c])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="ag-dt-pager">
          <span>Rows {(current * PAGE_SIZE + 1).toLocaleString()}–{Math.min((current + 1) * PAGE_SIZE, data.length).toLocaleString()}</span>
          <div>
            <button type="button" className="ag-icon-btn" disabled={current === 0} onClick={() => setPage(current - 1)} aria-label="Previous page"><ChevronLeft size={14} /></button>
            <span className="ag-dt-page">{current + 1} / {totalPages}</span>
            <button type="button" className="ag-icon-btn" disabled={current === totalPages - 1} onClick={() => setPage(current + 1)} aria-label="Next page"><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
