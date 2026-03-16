import React, { useState, useEffect } from 'react';
import { X, Download, FileText, AlertTriangle, BarChart2, Table } from 'lucide-react';

export default function ReportModal({ onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/report/generate')
      .then(r => r.json())
      .then(data => { setReport(data); setLoading(false); })
      .catch(() => { setError('Failed to generate report.'); setLoading(false); });
  }, []);

  const handleDownload = () => {
    const html = buildHTML(report);
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `AgentDB_Report_${new Date().toISOString().slice(0,10)}.html`;
    a.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={e => e.stopPropagation()}>
        <div className="report-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileText size={16} color="#007aff" />
            <span className="report-title">Database Report</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {report && (
              <button className="mac-btn" onClick={handleDownload}>
                <Download size={13} /> Download HTML
              </button>
            )}
            <button className="mac-btn" onClick={onClose}><X size={13} /></button>
          </div>
        </div>

        <div className="report-body">
          {loading && (
            <div className="report-loading">
              <div className="typing-indicator" style={{ justifyContent: 'center' }}>
                <div className="dot" /><div className="dot" /><div className="dot" />
              </div>
              <p>Analyzing your database...</p>
            </div>
          )}
          {error && <p style={{ color: '#ff453a', padding: 24 }}>{error}</p>}
          {report && Object.entries(report.databases).map(([dbName, tables]) => (
            <div key={dbName} className="report-db-section">
              <div className="report-db-title">
                <span className="nlsql-label nlsql-label-sql">{dbName}</span>
                <span style={{ fontSize: '0.78rem', color: '#6e6e73', marginLeft: 8 }}>
                  {Object.keys(tables).length} tables
                </span>
              </div>

              {Object.entries(tables).map(([tableName, info]) => (
                <div key={tableName} className="report-table-card">
                  <div className="report-table-header">
                    <Table size={13} color="#007aff" />
                    <span className="report-table-name">{tableName}</span>
                    <span className="report-row-count">{info.row_count.toLocaleString()} rows</span>
                  </div>

                  {/* Columns */}
                  <div className="report-cols">
                    {info.columns.map(c => (
                      <span key={c.name} className={`report-col-pill ${c.pk ? 'pk' : ''}`}>
                        {c.pk ? '🔑 ' : ''}{c.name}
                        <span className="report-col-type">{c.type || 'TEXT'}</span>
                      </span>
                    ))}
                  </div>

                  {/* Numeric stats */}
                  {Object.keys(info.stats).length > 0 && (
                    <div className="report-stats">
                      {Object.entries(info.stats).map(([col, s]) => (
                        <div key={col} className="report-stat-row">
                          <BarChart2 size={11} color="#007aff" />
                          <span className="report-stat-col">{col}</span>
                          <span className="report-stat-val">min <b>{s.min}</b></span>
                          <span className="report-stat-val">max <b>{s.max}</b></span>
                          <span className="report-stat-val">avg <b>{s.avg}</b></span>
                          <span className="report-stat-val">total <b>{s.total?.toLocaleString()}</b></span>
                          {s.anomalies && (
                            <span className="report-anomaly">
                              <AlertTriangle size={10} /> {s.anomalies} anomalies
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Sample data */}
                  {info.sample?.length > 0 && (
                    <div className="report-sample">
                      <p className="report-sample-label">Sample rows</p>
                      <div style={{ overflowX: 'auto' }}>
                        <table className="report-sample-table">
                          <thead>
                            <tr>{Object.keys(info.sample[0]).map(k => <th key={k}>{k}</th>)}</tr>
                          </thead>
                          <tbody>
                            {info.sample.map((row, i) => (
                              <tr key={i}>{Object.values(row).map((v, j) => <td key={j}>{String(v ?? '')}</td>)}</tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildHTML(report) {
  const tables = Object.entries(report.databases).flatMap(([dbName, tbls]) =>
    Object.entries(tbls).map(([tName, info]) => ({ dbName, tName, info }))
  );

  const tableRows = tables.map(({ dbName, tName, info }) => `
    <div class="card">
      <div class="card-header">
        <span class="db-badge">${dbName}</span>
        <span class="table-name">${tName}</span>
        <span class="row-count">${info.row_count.toLocaleString()} rows</span>
      </div>
      <div class="cols">${info.columns.map(c =>
        `<span class="col-pill${c.pk ? ' pk' : ''}">${c.pk ? '🔑 ' : ''}${c.name} <em>${c.type || 'TEXT'}</em></span>`
      ).join('')}</div>
      ${Object.keys(info.stats).length ? `
      <div class="stats">
        ${Object.entries(info.stats).map(([col, s]) => `
          <div class="stat-row">
            <b>${col}</b>
            <span>min: ${s.min}</span><span>max: ${s.max}</span>
            <span>avg: ${s.avg}</span><span>total: ${s.total?.toLocaleString()}</span>
            ${s.anomalies ? `<span class="anomaly">⚠️ ${s.anomalies} anomalies</span>` : ''}
          </div>`).join('')}
      </div>` : ''}
      ${info.sample?.length ? `
      <table><thead><tr>${Object.keys(info.sample[0]).map(k => `<th>${k}</th>`).join('')}</tr></thead>
      <tbody>${info.sample.map(row => `<tr>${Object.values(row).map(v => `<td>${v ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>` : ''}
    </div>`).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>AgentDB Report — ${new Date().toLocaleDateString()}</title>
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;color:#1d1d1f;margin:0;padding:32px}
  h1{font-size:1.8rem;margin-bottom:4px}p.sub{color:#6e6e73;margin-bottom:32px}
  .card{background:#fff;border-radius:14px;padding:20px 24px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.06)}
  .card-header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
  .db-badge{background:#e6f9f0;color:#0a7c42;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:4px;text-transform:uppercase}
  .table-name{font-size:1rem;font-weight:600}.row-count{color:#6e6e73;font-size:0.8rem;margin-left:auto}
  .cols{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
  .col-pill{background:#f3f4f6;border-radius:6px;padding:3px 10px;font-size:0.75rem}
  .col-pill.pk{background:#fff3cd;border:1px solid #ffc107}
  .col-pill em{color:#6e6e73;font-style:normal;margin-left:4px}
  .stats{background:#f9fafb;border-radius:8px;padding:10px 14px;margin-bottom:12px}
  .stat-row{display:flex;gap:16px;font-size:0.8rem;padding:4px 0;border-bottom:1px solid #f0f0f0}
  .stat-row b{min-width:100px}.anomaly{color:#e67e22;font-weight:600}
  table{width:100%;border-collapse:collapse;font-size:0.78rem}
  th{background:#f3f4f6;padding:6px 10px;text-align:left;font-weight:600}
  td{padding:5px 10px;border-bottom:1px solid #f5f5f7}
  tr:last-child td{border:none}
</style></head><body>
<h1>📊 AgentDB Report</h1>
<p class="sub">Generated on ${new Date().toLocaleString()} · ${tables.length} tables analyzed</p>
${tableRows}
</body></html>`;
}
