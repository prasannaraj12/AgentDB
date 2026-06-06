"""
Local NL→SQL Agent — no LLM API needed.
Uses TF-IDF similarity over a curated training dataset to match
natural language questions to pre-written SQL queries.
Falls back to rule-based SQL generation for unknown questions.
"""

import os
import re
import json
import math
import logging
from typing import Optional

from tools.db_tools import get_schema, execute_query, DB_PATH
from tools.viz_tools import generate_chart, generate_flowchart, explain_data
from training.training_data import TRAINING_DATA

logger = logging.getLogger(__name__)

# ── Detect active DB name from path ──────────────────────────────────────────

def _active_db_name() -> str:
    base = os.path.splitext(os.path.basename(DB_PATH))[0]
    return base  # e.g. "chinook", "sakila", "ecommerce"


# ── TF-IDF similarity ─────────────────────────────────────────────────────────

def _tokenize(text: str) -> list:
    return re.findall(r'[a-z0-9]+', text.lower())

def _build_idf(corpus: list) -> dict:
    N = len(corpus)
    df = {}
    for doc in corpus:
        for tok in set(_tokenize(doc)):
            df[tok] = df.get(tok, 0) + 1
    return {tok: math.log(N / (1 + freq)) for tok, freq in df.items()}

def _tfidf_vec(tokens: list, idf: dict) -> dict:
    tf = {}
    for t in tokens:
        tf[t] = tf.get(t, 0) + 1
    n = len(tokens) or 1
    return {t: (c / n) * idf.get(t, 0) for t, c in tf.items()}

def _cosine(a: dict, b: dict) -> float:
    keys = set(a) & set(b)
    if not keys:
        return 0.0
    dot = sum(a[k] * b[k] for k in keys)
    na = math.sqrt(sum(v * v for v in a.values()))
    nb = math.sqrt(sum(v * v for v in b.values()))
    return dot / (na * nb) if na and nb else 0.0


# ── Build index at import time ────────────────────────────────────────────────

_questions = [d["question"] for d in TRAINING_DATA]
_idf = _build_idf(_questions)
_vecs = [_tfidf_vec(_tokenize(q), _idf) for q in _questions]


def _find_best_match(query: str, db_name: str, threshold: float = 0.25):
    """Return best matching training entry or None."""
    q_vec = _tfidf_vec(_tokenize(query), _idf)

    best_score = -1
    best_idx = -1

    for i, vec in enumerate(_vecs):
        score = _cosine(q_vec, vec)
        entry = TRAINING_DATA[i]
        # Boost score if DB matches
        if entry["db"] == db_name or entry["db"] in ("ecommerce", "ecommerce_dataset") and "ecommerce" in db_name:
            score *= 1.3
        if score > best_score:
            best_score = score
            best_idx = i

    if best_score >= threshold and best_idx >= 0:
        return TRAINING_DATA[best_idx], best_score
    return None, best_score


# ── Chart type detection ──────────────────────────────────────────────────────

def _detect_chart(query: str) -> Optional[str]:
    q = query.lower()
    if any(w in q for w in ["pie chart", "pie graph", "pie"]):
        return "pie"
    if any(w in q for w in ["line chart", "line graph", "trend", "over time", "monthly", "weekly"]):
        return "line"
    if any(w in q for w in ["scatter", "scatter chart", "scatter plot", "correlation"]):
        return "scatter"
    if any(w in q for w in ["bar chart", "bar graph", "bar", "histogram", "compare", "comparison"]):
        return "bar"
    return None


# ── Intent detection ──────────────────────────────────────────────────────────

def _detect_intent(query: str) -> str:
    q = query.lower()
    if any(w in q for w in ["er diagram", "erd", "entity", "relationship diagram", "flowchart", "flow chart", "diagram"]):
        return "diagram"
    if any(w in q for w in ["chart", "graph", "plot", "visuali", "trend", "scatter", "pie", "bar", "line"]):
        return "chart"
    if any(w in q for w in ["insight", "analys", "summary", "explain", "tell me about"]):
        return "insight"
    if any(w in q for w in ["count", "how many", "total number"]):
        return "count"
    if any(w in q for w in ["average", "avg", "mean"]):
        return "aggregate"
    if any(w in q for w in ["top", "best", "highest", "most", "largest", "biggest", "leading"]):
        return "top_n"
    if any(w in q for w in ["show", "list", "display", "get", "fetch", "all"]):
        return "list"
    return "general"


# ── Rule-based fallback SQL ───────────────────────────────────────────────────

def _rule_based_sql(query: str, schema: dict) -> Optional[str]:
    """Generate basic SQL from schema when no training match found."""
    q = query.lower()
    db_key = list(schema.keys())[0] if schema else "main"
    tables = list(schema.get(db_key, {}).keys())
    if not tables:
        return None

    # Find mentioned table
    target_table = None
    for t in tables:
        if t.lower() in q or t.lower().rstrip('s') in q:
            target_table = t
            break
    if not target_table:
        target_table = tables[0]

    cols = [c["name"] for c in schema[db_key].get(target_table, [])]
    num_cols = [c["name"] for c in schema[db_key].get(target_table, [])
                if c["type"].upper() in ("INTEGER", "REAL", "NUMERIC", "FLOAT", "DOUBLE")
                and not c["name"].lower().endswith("_id") and not c.get("pk")]
    text_cols = [c["name"] for c in schema[db_key].get(target_table, [])
                 if c["type"].upper() in ("TEXT", "VARCHAR", "CHAR", "")]

    # COUNT
    if any(w in q for w in ["how many", "count", "total number"]):
        return f"SELECT COUNT(*) AS total FROM {target_table}"

    # SUM / TOTAL
    if any(w in q for w in ["total", "sum", "revenue", "sales", "amount"]):
        col = next((c for c in num_cols if any(w in c.lower() for w in ["amount", "total", "price", "revenue", "sales"])), num_cols[0] if num_cols else None)
        if col:
            return f"SELECT SUM({col}) AS total FROM {target_table}"

    # AVG
    if any(w in q for w in ["average", "avg", "mean"]):
        col = num_cols[0] if num_cols else None
        if col:
            return f"SELECT ROUND(AVG({col}), 2) AS average FROM {target_table}"

    # TOP N
    top_match = re.search(r'top\s+(\d+)', q)
    limit = int(top_match.group(1)) if top_match else 10
    if any(w in q for w in ["top", "best", "highest", "most"]):
        col = num_cols[0] if num_cols else (cols[-1] if cols else None)
        if col:
            return f"SELECT * FROM {target_table} ORDER BY {col} DESC LIMIT {limit}"

    # GROUP BY
    if any(w in q for w in ["by category", "by region", "by status", "by country", "by city", "by type", "by genre", "by rating"]):
        group_col = next((c for c in text_cols if any(w in c.lower() for w in ["category", "region", "status", "country", "city", "type", "genre", "rating"])), text_cols[0] if text_cols else None)
        count_col = num_cols[0] if num_cols else None
        if group_col and count_col:
            return f"SELECT {group_col}, SUM({count_col}) AS total FROM {target_table} GROUP BY {group_col} ORDER BY total DESC"
        elif group_col:
            return f"SELECT {group_col}, COUNT(*) AS count FROM {target_table} GROUP BY {group_col} ORDER BY count DESC"

    # Default: SELECT *
    return f"SELECT * FROM {target_table} LIMIT 50"


# ── ER Diagram generator ──────────────────────────────────────────────────────

def _generate_er_diagram(schema: dict) -> str:
    lines = ["erDiagram"]
    for db_key, tables in schema.items():
        for table_name, columns in tables.items():
            lines.append(f"  {table_name} {{")
            for col in columns[:8]:
                col_type = col["type"] or "TEXT"
                pk = " PK" if col.get("pk") else ""
                fk = " FK" if col["name"].lower().endswith("_id") and not col.get("pk") else ""
                lines.append(f"    {col_type} {col['name']}{pk}{fk}")
            lines.append("  }")
    # Add relationships based on FK naming convention
    for db_key, tables in schema.items():
        for table_name, columns in tables.items():
            for col in columns:
                if col["name"].lower().endswith("_id") and not col.get("pk"):
                    ref = col["name"][:-3]  # strip _id
                    # find matching table
                    for t in tables:
                        if t.lower() == ref.lower() or t.lower() == ref.lower() + "s":
                            lines.append(f"  {t} ||--o{{ {table_name} : has")
                            break
    return "\n".join(lines)


# ── Insight generator ─────────────────────────────────────────────────────────

def _generate_insights(data: list, query: str) -> str:
    if not data:
        return "No data returned for this query."
    cols = list(data[0].keys())
    num_cols = [c for c in cols if isinstance(data[0][c], (int, float))]
    text_cols = [c for c in cols if isinstance(data[0][c], str)]

    insights = []
    insights.append(f"· Query returned {len(data)} row{'s' if len(data) != 1 else ''}.")

    if num_cols:
        col = num_cols[0]
        vals = [r[col] for r in data if r[col] is not None]
        if vals:
            total = sum(vals)
            avg = total / len(vals)
            top = max(vals)
            insights.append(f"· {col}: total = {total:,.2f}, avg = {avg:,.2f}, max = {top:,.2f}")
            if text_cols and len(data) > 1:
                top_row = max(data, key=lambda r: r[col] or 0)
                insights.append(f"· Top entry: {top_row[text_cols[0]]} with {col} = {top_row[col]:,.2f}")
                bottom_row = min(data, key=lambda r: r[col] or 0)
                insights.append(f"· Lowest entry: {bottom_row[text_cols[0]]} with {col} = {bottom_row[col]:,.2f}")

    if len(data) >= 2 and num_cols:
        col = num_cols[0]
        vals = [r[col] for r in data if r[col] is not None]
        if len(vals) >= 2:
            pct = ((vals[0] - vals[-1]) / vals[-1] * 100) if vals[-1] else 0
            if abs(pct) > 5:
                direction = "higher" if pct > 0 else "lower"
                insights.append(f"· Top value is {abs(pct):.1f}% {direction} than the bottom value.")

    return "\n".join(insights)


# ── Main query handler ────────────────────────────────────────────────────────

def handle_query(user_message: str) -> dict:
    """
    Process a natural language query without any LLM API.
    Returns: { response: str, trace: list }
    """
    from tools.db_tools import DB_PATH as _current_db_path
    import os

    # Guard: make sure the DB file actually exists
    if not os.path.exists(_current_db_path):
        return {
            "response": f"Database file not found at `{_current_db_path}`. Please select a database from the sidebar.",
            "trace": []
        }

    db_name = _active_db_name()
    intent = _detect_intent(user_message)
    chart_type = _detect_chart(user_message)
    trace = []

    # ── Diagram request ───────────────────────────────────────────────────────
    if intent == "diagram":
        schema_str = get_schema()
        schema = json.loads(schema_str)
        if "error" in schema:
            return {"response": f"Could not read schema: {schema['error']}", "trace": trace}
        trace.append({"step": "tool_call", "tool": "get_schema", "input": {}})
        trace.append({"step": "tool_result", "tool": "get_schema", "output": "Schema retrieved"})

        mermaid = _generate_er_diagram(schema)
        diagram_json = generate_flowchart(mermaid)
        insight_json = explain_data(f"ER diagram generated for {db_name} database with {sum(len(t) for t in schema.values())} tables.")

        BLOB_SEP = "\n---BLOB---\n"
        response = f"Here is the ER diagram for the **{db_name}** database.{BLOB_SEP}{diagram_json}{BLOB_SEP}{insight_json}"
        return {"response": response, "trace": trace}

    # ── Find best training match ───────────────────────────────────────────────
    match, score = _find_best_match(user_message, db_name)
    trace.append({"step": "tool_call", "tool": "match_query", "input": {"query": user_message, "score": round(score, 3)}})

    if match:
        sql = match["sql"]
        chart_type = chart_type or match.get("chart")
        trace.append({"step": "tool_result", "tool": "match_query", "output": f"Matched: '{match['question']}' (score={score:.2f})"})
        logger.info(f"Matched training entry: '{match['question']}' score={score:.3f}")
    else:
        # Fallback: rule-based SQL
        schema_str = get_schema()
        schema = json.loads(schema_str)
        if "error" in schema:
            return {"response": f"Could not read schema: {schema['error']}", "trace": trace}
        sql = _rule_based_sql(user_message, schema)
        trace.append({"step": "tool_result", "tool": "match_query", "output": f"No match (score={score:.2f}), using rule-based SQL"})
        logger.info(f"No training match (score={score:.3f}), using rule-based fallback")

    if not sql:
        return {
            "response": "I couldn't understand that query. Try asking about your data in a different way.",
            "trace": trace
        }

    # ── Execute SQL ───────────────────────────────────────────────────────────
    trace.append({"step": "tool_call", "tool": "execute_query", "input": {"sql": sql}})
    raw = execute_query(sql)
    data = json.loads(raw)

    if isinstance(data, dict) and "error" in data:
        trace.append({"step": "tool_result", "tool": "execute_query", "output": f"Error: {data['error']}"})
        return {"response": f"SQL error: {data['error']}\n\nGenerated SQL:\n```sql\n{sql}\n```", "trace": trace}

    trace.append({"step": "tool_result", "tool": "execute_query", "output": f"{len(data)} rows returned"})

    # ── Generate chart if needed ──────────────────────────────────────────────
    chart_json = None
    if chart_type and data:
        cols = list(data[0].keys())
        num_cols = [c for c in cols if isinstance(data[0].get(c), (int, float))]
        text_cols = [c for c in cols if isinstance(data[0].get(c), str)]
        x_col = text_cols[0] if text_cols else cols[0]
        y_col = num_cols[0] if num_cols else cols[-1]

        trace.append({"step": "tool_call", "tool": "generate_chart", "input": {"type": chart_type, "x": x_col, "y": y_col}})
        chart_json = generate_chart(chart_type, user_message.title(), x_col, y_col, data)
        trace.append({"step": "tool_result", "tool": "generate_chart", "output": "Chart generated"})

    # ── Generate insights ─────────────────────────────────────────────────────
    insight_text = _generate_insights(data, user_message)
    insight_json = explain_data(insight_text)

    # ── Build response ────────────────────────────────────────────────────────
    summary = f"Here are the results for: **{user_message}**"

    # Use a safe sentinel to separate text from rich blobs
    BLOB_SEP = "\n---BLOB---\n"
    parts = [summary]
    if chart_json:
        parts.append(BLOB_SEP + chart_json)
    parts.append(BLOB_SEP + insight_json)
    return {"response": "".join(parts), "trace": trace}


# ── Greeting handler ──────────────────────────────────────────────────────────

def is_greeting(text: str) -> bool:
    greetings = ["hello", "hi", "hey", "good morning", "good evening", "what can you do", "help", "who are you"]
    t = text.lower().strip()
    return any(t.startswith(g) for g in greetings)


def greeting_response() -> dict:
    return {
        "response": (
            "Hello! I'm **AgentDB** — your local database assistant.\n\n"
            "I can help you with:\n"
            "· Querying your database in plain English\n"
            "· Generating bar, line, pie, and scatter charts\n"
            "· Showing ER diagrams\n"
            "· Providing data insights\n\n"
            "Try asking: *'Show top 10 customers by spending'* or *'Bar chart of sales by category'*"
        ),
        "trace": []
    }
