// Tiny SQL syntax highlighter (no dependency). Produces React spans.
const KEYWORDS = new Set(`select from where group by order having limit offset join left right inner outer full
cross on as and or not in is null like between case when then else end distinct union all insert update delete
into values set create table drop alter with asc desc exists cast over partition`.split(/\s+/));
const FUNCTIONS = new Set(`count sum avg min max round strftime date datetime coalesce ifnull lower upper length
substr abs total group_concat julianday printf trim replace`.split(/\s+/));

const TOKEN = /(--[^\n]*)|('(?:[^']|'')*')|("(?:[^"])*"|\[[^\]]*\])|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([^\sA-Za-z0-9_])/g;

export function highlightSql(sql) {
  const out = [];
  let m;
  let i = 0;
  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(sql)) !== null) {
    const [text, comment, str, ident, num, word] = m;
    let cls = null;
    if (comment) cls = 'sql-comment';
    else if (str) cls = 'sql-string';
    else if (ident) cls = 'sql-ident';
    else if (num) cls = 'sql-number';
    else if (word) {
      const lower = word.toLowerCase();
      if (KEYWORDS.has(lower)) cls = 'sql-keyword';
      else if (FUNCTIONS.has(lower) && sql[TOKEN.lastIndex] === '(') cls = 'sql-function';
    }
    out.push(cls ? <span key={i++} className={cls}>{text}</span> : text);
  }
  return out;
}

/** Light formatting: newline before major clauses, for single-line SQL from the model. */
export function formatSql(sql) {
  if (!sql || sql.includes('\n')) return sql;
  return sql
    .replace(/\s+(FROM|WHERE|GROUP BY|ORDER BY|HAVING|LIMIT|(?:LEFT |RIGHT |INNER |FULL |CROSS )?JOIN|UNION)\b/gi, '\n$1')
    .trim();
}
