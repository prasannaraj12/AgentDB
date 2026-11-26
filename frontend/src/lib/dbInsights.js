// Facts derived from the real /report/generate payload — never invented numbers.

/** Flatten report.databases into [{ db, table, info }]. */
export function listTables(report) {
  if (!report?.databases) return [];
  return Object.entries(report.databases).flatMap(([db, tables]) =>
    Object.entries(tables).map(([table, info]) => ({ db, table, info })),
  );
}

export function databaseTotals(report) {
  const tables = listTables(report);
  const totalRecords = tables.reduce((sum, t) => sum + (t.info.row_count || 0), 0);
  const largest = tables.reduce((best, t) => (!best || t.info.row_count > best.info.row_count ? t : best), null);
  const columns = tables.reduce((sum, t) => sum + (t.info.columns?.length || 0), 0);
  return { tableCount: tables.length, totalRecords, columns, largest };
}

/** Numeric columns with values more than 2 standard deviations from the mean (computed by the backend). */
export function anomalyFindings(report) {
  const findings = [];
  for (const { db, table, info } of listTables(report)) {
    for (const [column, s] of Object.entries(info.stats || {})) {
      if (s.anomalies) findings.push({ db, table, column, count: s.anomalies, min: s.min, max: s.max, avg: s.avg });
    }
  }
  return findings.sort((a, b) => b.count - a.count);
}

export function qualifiedName(db, table) {
  return db === 'main' ? table : `${db}.${table}`;
}

function singular(name) {
  const n = name.toLowerCase();
  if (n.endsWith('ies')) return n.slice(0, -3) + 'y';
  if (n.endsWith('ses')) return n.slice(0, -2);
  if (n.endsWith('s')) return n.slice(0, -1);
  return n;
}

/**
 * Relationships inferred from naming: a non-PK column `<x>_id` (or `<x>id`) in table A that matches
 * the primary key name of table B. The backend does not expose foreign keys, so these are inferences.
 */
export function inferRelationships(report) {
  const tables = listTables(report);
  const pkOwners = new Map(); // pk column name -> table entry
  for (const t of tables) {
    for (const c of t.info.columns || []) {
      if (c.pk && /id$/i.test(c.name)) pkOwners.set(`${t.db}|${c.name.toLowerCase()}`, t);
    }
  }
  const rels = [];
  for (const t of tables) {
    for (const c of t.info.columns || []) {
      if (c.pk) continue;
      const owner = pkOwners.get(`${t.db}|${c.name.toLowerCase()}`);
      if (owner && owner !== t) {
        rels.push({ from: owner, to: t, column: c.name });
        continue;
      }
      // Fallback: `customer_id` → table named customer/customers with an `id` PK
      const m = c.name.toLowerCase().match(/^(.+?)_?id$/);
      if (!m || !m[1]) continue;
      const target = tables.find((o) => o !== t && o.db === t.db && singular(o.table) === m[1]
        && (o.info.columns || []).some((oc) => oc.pk));
      if (target) rels.push({ from: target, to: t, column: c.name });
    }
  }
  return rels;
}

function mermaidId(db, table) {
  return `${db === 'main' ? '' : `${db}__`}${table}`.replace(/[^A-Za-z0-9_]/g, '_');
}

function mermaidType(type) {
  const cleaned = (type || 'ANY').replace(/[^A-Za-z0-9_]/g, '_');
  return cleaned || 'ANY';
}

/** Mermaid erDiagram for the real schema plus inferred relationships. */
export function buildErDiagram(report) {
  const tables = listTables(report);
  if (!tables.length) return '';
  const lines = ['erDiagram'];
  for (const { db, table, info } of tables) {
    lines.push(`  ${mermaidId(db, table)} {`);
    for (const c of info.columns || []) {
      const name = c.name.replace(/[^A-Za-z0-9_]/g, '_');
      lines.push(`    ${mermaidType(c.type)} ${name}${c.pk ? ' PK' : ''}`);
    }
    lines.push('  }');
  }
  for (const r of inferRelationships(report)) {
    lines.push(`  ${mermaidId(r.from.db, r.from.table)} ||--o{ ${mermaidId(r.to.db, r.to.table)} : "${r.column}"`);
  }
  return lines.join('\n');
}

export const numberFmt = new Intl.NumberFormat();

export function formatDuration(ms) {
  if (typeof ms !== 'number') return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

export function formatRelative(ts, now = Date.now()) {
  if (!ts) return '—';
  const s = Math.round((now - ts) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function formatDate(ts, now = Date.now()) {
  if (!ts) return '—';
  const d = new Date(ts);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleDateString(undefined, sameYear ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' });
}
