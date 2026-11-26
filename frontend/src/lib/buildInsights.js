import { Database, Gauge, TriangleAlert, TrendingUp } from 'lucide-react';
import { ROUTES } from './router';
import { anomalyFindings, databaseTotals, formatDuration, listTables, numberFmt, qualifiedName } from './dbInsights';
import { successStats } from './queryHistory';

const pct = (r) => `${Math.round(r * 1000) / 10}%`;

/** Which schema tables the user's SQL touches most often. */
function tableUsage(report, history) {
  const tables = listTables(report).map((t) => t.table);
  if (!tables.length) return null;
  const withSql = history.filter((e) => e.sql);
  if (withSql.length < 3) return null;
  const counts = new Map();
  for (const e of withSql) {
    const sql = e.sql.toLowerCase();
    for (const t of tables) {
      const name = t.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (name && new RegExp(`\\b${name}\\b`).test(sql)) counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
  const [top] = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  return top ? { table: top[0], count: top[1], total: withSql.length } : null;
}

/** Insight cards built only from the real report and the recorded query history. */
export function buildInsights({ report, history, activeDb, includePatterns = false }) {
  const items = [];

  if (report) {
    const t = databaseTotals(report);
    items.push({
      id: 'overview', tone: 'violet', icon: Database, title: 'Data Overview',
      text: t.tableCount
        ? `${activeDb} holds ${numberFmt.format(t.totalRecords)} records across ${t.tableCount} tables and ${t.columns} columns. `
          + `Largest table: ${qualifiedName(t.largest.db, t.largest.table)} (${numberFmt.format(t.largest.info.row_count)} rows).`
        : `${activeDb} has no tables yet. Upload a database or CSV file to get started.`,
      to: t.tableCount ? ROUTES.schema : ROUTES.explorer,
    });
  }

  const sqlHistory = history.filter((e) => e.kind !== 'chat');
  const s = successStats(sqlHistory);
  items.push({
    id: 'performance', tone: 'blue', icon: Gauge, title: 'Query Performance',
    text: s.tracked
      ? `${s.succeeded} of ${s.tracked} tracked queries ran successfully (${pct(s.rate)}).`
        + (s.avgDurationMs !== null ? ` Average response time: ${formatDuration(s.avgDurationMs)}.` : '')
        + (s.failed ? ` ${s.failed} failed — review them in Query History.` : '')
      : 'No database queries tracked yet. Ask a question in the AI Workspace to start measuring performance.',
    to: s.tracked ? ROUTES.history : ROUTES.workspace,
  });

  if (report) {
    const found = anomalyFindings(report);
    const top = found[0];
    items.push({
      id: 'anomalies', tone: 'orange', icon: TriangleAlert, title: 'Risk & Anomaly Alerts',
      text: top
        ? `${top.count} value${top.count === 1 ? '' : 's'} in ${qualifiedName(top.db, top.table)}.${top.column} sit more than 2 standard deviations from the mean `
          + `(avg ${numberFmt.format(top.avg)}, max ${numberFmt.format(top.max)}).`
          + (found.length > 1 ? ` ${found.length - 1} more column${found.length > 2 ? 's have' : ' has'} outliers.` : '')
        : 'No outliers found: no numeric value is more than 2 standard deviations from its column mean.',
      to: ROUTES.reports,
    });
  }

  if (includePatterns && report) {
    const usage = tableUsage(report, history);
    items.push({
      id: 'patterns', tone: 'green', icon: TrendingUp, title: 'Data Patterns',
      text: usage
        ? `Your queries focus on ${usage.table}: it appears in ${usage.count} of your last ${usage.total} SQL queries.`
        : 'Run a few more database queries and AgentDB will show which tables you explore most.',
      to: usage ? ROUTES.history : ROUTES.workspace,
    });
  }
  return items;
}
