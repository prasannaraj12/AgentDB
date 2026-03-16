import React, { useState } from 'react';
import { Download } from 'lucide-react';

export default function DataTable({ data, sqlQuery }) {
  const [page, setPage] = useState(0);
  const pageSize = 10;

  if (!data || data.length === 0) return null;

  const columns = Object.keys(data[0]);
  const totalPages = Math.ceil(data.length / pageSize);
  const pageData = data.slice(page * pageSize, (page + 1) * pageSize);

  const handleExport = async () => {
    if (!sqlQuery) return;
    const res = await fetch('/export/csv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql_query: sqlQuery })
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="data-table-wrapper">
      <div className="data-table-header">
        <span className="data-table-count">{data.length} rows</span>
        {sqlQuery && (
          <button className="export-btn" onClick={handleExport} title="Export CSV">
            <Download size={13} /> CSV
          </button>
        )}
      </div>
      <div className="data-table-scroll">
        <table className="data-table">
          <thead>
            <tr>{columns.map(c => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {pageData.map((row, i) => (
              <tr key={i}>
                {columns.map(c => <td key={c}>{String(row[c] ?? '')}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="data-table-pagination">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
          <span>{page + 1} / {totalPages}</span>
          <button disabled={page === totalPages - 1} onClick={() => setPage(p => p + 1)}>›</button>
        </div>
      )}
    </div>
  );
}
