// Standalone HTML export of the database report (moved from ReportModal).
const esc = (v) => String(v ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function buildReportHtml(report) {
  const tables = Object.entries(report.databases).flatMap(([dbName, tbls]) =>
    Object.entries(tbls).map(([tName, info]) => ({ dbName, tName, info })),
  );

  const tableRows = tables.map(({ dbName, tName, info }) => `
    <div class="card">
      <div class="card-header">
        <span class="db-badge">${esc(dbName)}</span>
        <span class="table-name">${esc(tName)}</span>
        <span class="row-count">${info.row_count.toLocaleString()} rows</span>
      </div>
      <div class="cols">${info.columns.map((c) =>
        `<span class="col-pill${c.pk ? ' pk' : ''}">${esc(c.name)} <em>${esc(c.type || 'TEXT')}${c.pk ? ' · PK' : ''}</em></span>`,
      ).join('')}</div>
      ${Object.keys(info.stats).length ? `
      <div class="stats">
        ${Object.entries(info.stats).map(([col, s]) => `
          <div class="stat-row">
            <b>${esc(col)}</b>
            <span>min: ${esc(s.min)}</span><span>max: ${esc(s.max)}</span>
            <span>avg: ${esc(s.avg)}</span><span>total: ${esc(s.total?.toLocaleString())}</span>
            ${s.anomalies ? `<span class="anomaly">${esc(s.anomalies)} outliers</span>` : ''}
          </div>`).join('')}
      </div>` : ''}
      ${info.sample?.length ? `
      <table><thead><tr>${Object.keys(info.sample[0]).map((k) => `<th>${esc(k)}</th>`).join('')}</tr></thead>
      <tbody>${info.sample.map((row) => `<tr>${Object.values(row).map((v) => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>` : ''}
    </div>`).join('');

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>AgentDB Report — ${new Date().toLocaleDateString()}</title>
<style>
  body{font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f2ef;color:#202124;margin:0;padding:32px}
  h1{font-size:1.6rem;margin:0 0 4px}p.sub{color:#777780;margin:0 0 28px}
  .card{background:#fff;border:1px solid #ebe9e6;border-radius:16px;padding:18px 22px;margin-bottom:16px}
  .card-header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
  .db-badge{background:#e9e5ff;color:#5a4bd1;font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:999px;text-transform:uppercase}
  .table-name{font-size:1rem;font-weight:700}.row-count{color:#777780;font-size:0.8rem;margin-left:auto}
  .cols{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px}
  .col-pill{background:#f4f3f1;border-radius:999px;padding:3px 10px;font-size:0.75rem}
  .col-pill.pk{background:#fbe8cc}
  .col-pill em{color:#777780;font-style:normal;margin-left:4px}
  .stats{background:#faf9f7;border-radius:10px;padding:8px 14px;margin-bottom:12px}
  .stat-row{display:flex;gap:16px;font-size:0.8rem;padding:4px 0;border-bottom:1px solid #f0eeeb}
  .stat-row b{min-width:110px}.anomaly{color:#c25e17;font-weight:600}
  table{width:100%;border-collapse:collapse;font-size:0.78rem}
  th{background:#f4f3f1;padding:6px 10px;text-align:left;font-weight:600}
  td{padding:5px 10px;border-bottom:1px solid #f0eeeb}
  tr:last-child td{border:none}
</style></head><body>
<h1>AgentDB Report</h1>
<p class="sub">Generated on ${new Date().toLocaleString()} · ${tables.length} tables analyzed</p>
${tableRows}
</body></html>`;
}

export function downloadReportHtml(report) {
  const blob = new Blob([buildReportHtml(report)], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AgentDB_Report_${new Date().toISOString().slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
