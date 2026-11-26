import os
import json
import re
import logging
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import tool
from typing import List, Optional, Tuple

from tools.db_tools import get_schema, execute_query
from tools.viz_tools import generate_chart, generate_flowchart, explain_data

# ── Token budget knobs ───────────────────────────────────────────────────────
# Inline the whole schema in the system prompt when it is this small; larger
# schemas get a table list in the prompt plus per-query SchemaRAG retrieval.
SCHEMA_INLINE_MAX_CHARS = 6000
# Query results shown to the LLM are capped; the UI still receives every row.
LLM_PREVIEW_MAX_ROWS = 25
LLM_PREVIEW_MAX_CHARS = 3000


def compact_schema_lines(schema_json: str) -> List[str]:
    """Render the schema JSON as one compact line per table: `table(col TYPE PK, ...)`."""
    schema = json.loads(schema_json)
    if "error" in schema:
        return [f"Schema unavailable: {schema['error']}"]
    lines = []
    for db_name, tables in schema.items():
        prefix = "" if db_name == "main" else f"[{db_name}]."
        for table_name, columns in tables.items():
            cols = ", ".join(
                f"{c['name']} {c.get('type') or 'ANY'}{' PK' if c.get('pk') else ''}"
                for c in columns
            )
            lines.append(f"{prefix}{table_name}({cols})")
    return lines


def preview_rows_for_llm(raw_result: str) -> str:
    """Shrink a tool_execute_query JSON result to what the LLM needs to reason about.

    Small results pass through unchanged. Large ones become a row count plus the
    first rows that fit the budget. Errors pass through unchanged.
    """
    try:
        rows = json.loads(raw_result)
    except (TypeError, ValueError):
        return raw_result
    if not isinstance(rows, list):
        return raw_result
    if len(rows) <= LLM_PREVIEW_MAX_ROWS and len(raw_result) <= LLM_PREVIEW_MAX_CHARS:
        return raw_result
    preview, used = [], 0
    for row in rows[:LLM_PREVIEW_MAX_ROWS]:
        row_json = json.dumps(row, default=str)
        if preview and used + len(row_json) > LLM_PREVIEW_MAX_CHARS:
            break
        preview.append(row)
        used += len(row_json)
    return json.dumps({
        "row_count": len(rows),
        "preview_rows": preview,
        "note": f"Showing the first {len(preview)} of {len(rows)} rows. "
                "The user sees all rows in a table; use SQL aggregates for exact totals.",
    }, default=str)


# ── Schema RAG (keyword-overlap retrieval — no embedding API needed) ─────────

class SchemaRAG:
    def __init__(self):
        self.table_docs: List[str] = []
        self.table_tokens: List[set] = []
        self.schema_key: str = ""
        self.inline: bool = True   # True → whole schema fits in the system prompt

    def _tokenize(self, text: str) -> set:
        return set(re.findall(r'[a-z0-9]+', text.lower()))

    def build(self, schema_json: str, key: str):
        if self.schema_key == key:
            return
        docs = compact_schema_lines(schema_json)
        self.table_docs = docs
        self.table_tokens = [self._tokenize(d) for d in docs]
        self.inline = len("\n".join(docs)) <= SCHEMA_INLINE_MAX_CHARS
        self.schema_key = key

    def retrieve(self, query: str, k: int = 6) -> str:
        if not self.table_docs:
            return ""
        q_tokens = self._tokenize(query)
        # Score = number of overlapping tokens
        scores = [len(q_tokens & t) for t in self.table_tokens]
        # Always include at least top-k even if score is 0
        top_k = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:k]
        return "\n".join(self.table_docs[i] for i in top_k)


_schema_rag = SchemaRAG()
logger = logging.getLogger(__name__)


def _split_blob(blob: str, summary: str) -> Tuple[str, Optional[str]]:
    """Return (short content for the LLM, full blob for the UI) — or the error for both."""
    try:
        parsed = json.loads(blob)
    except ValueError:
        return blob, None
    if isinstance(parsed, dict) and "error" in parsed:
        return blob, None
    return summary, blob


@tool
def tool_get_schema() -> str:
    """Retrieve every table in the database as `table(column TYPE, ...)` lines."""
    return "\n".join(compact_schema_lines(get_schema()))

@tool(response_format="content_and_artifact")
def tool_execute_query(sql_query: str) -> Tuple[str, str]:
    """Execute a strict read-only SQL SELECT query against the database. Returns query results as JSON (large results are previewed)."""
    raw = execute_query(sql_query)
    return preview_rows_for_llm(raw), raw

@tool(response_format="content_and_artifact")
def tool_generate_chart(chart_type: str, title: str, x_axis: str, y_axis: str, sql_query: str) -> Tuple[str, Optional[str]]:
    """
    Generate a chart from a SELECT query's results.
    chart_type: 'bar', 'line', 'pie', or 'scatter'
    x_axis: exact column name for X axis (must match a column in the query result)
    y_axis: exact column name for Y axis (must match a column in the query result)
    sql_query: the same SELECT query you ran with tool_execute_query; it is re-run to get every row
    """
    raw = execute_query(sql_query)
    rows = json.loads(raw)
    if isinstance(rows, dict):
        return raw, None
    if not rows:
        return json.dumps({"error": "The query returned no rows, so there is nothing to chart."}), None
    logger.info("[chart] type=%s x=%s y=%s rows=%d", chart_type, x_axis, y_axis, len(rows))
    blob = generate_chart(chart_type, title, x_axis, y_axis, rows)
    try:
        cfg = json.loads(blob)
        summary = (f"Chart rendered for the user: {cfg['chart_type']} chart '{cfg['title']}' "
                   f"with {len(rows)} points (x={cfg['x_axis']}, y={cfg['y_axis']}).")
    except (ValueError, KeyError):
        summary = "Chart rendered for the user."
    return _split_blob(blob, summary)

@tool(response_format="content_and_artifact")
def tool_generate_flowchart(mermaid_string: str) -> Tuple[str, Optional[str]]:
    """
    Validates and formats a Mermaid.js string for diagram generation.
    Supports flowcharts, ER diagrams, and process flows.
    """
    return _split_blob(generate_flowchart(mermaid_string), "Diagram rendered for the user.")

@tool
def tool_explain_data(insights: str) -> str:
    """Package data insights as a styled card for the frontend."""
    return explain_data(insights)

tools = [
    tool_get_schema,
    tool_execute_query,
    tool_generate_chart,
    tool_generate_flowchart,
    tool_explain_data
]

system_prompt = """You are AgentDB — an Intelligent AI Agent for database interaction and data visualization.
You translate natural language into SQL, retrieve results, and present them visually.

Tools available:
1. `tool_get_schema`: List all tables and columns. Call this ONLY if a table you need is not listed below.
2. `tool_execute_query`: Run a SQLite SELECT query. Returns JSON rows (large results are previewed; the user sees all rows).
3. `tool_generate_chart`: Render a chart (bar/line/pie/scatter) for the user from a SELECT query.
4. `tool_generate_flowchart`: Render ER diagrams or process flows (Mermaid.js). Never use () inside node labels.
5. `tool_explain_data`: Package 3-5 bullet insights about the data as a styled card.

MANDATORY WORKFLOWS — you MUST follow these exactly, no exceptions:

CHART REQUEST (any of: bar, line, pie, scatter, plot, graph, visualization, chart):
  Step 1: tool_execute_query → get data
  Step 2: tool_generate_chart → YOU MUST DO THIS. Pass the SAME SQL from step 1 as `sql_query`. NEVER skip.
  Step 3: tool_explain_data → 3-5 bullet insights
  Step 4: Reply with one short sentence summary. No JSON in text.

DATA / TABLE REQUEST (show, list, count, total, average, top, who, which):
  Step 1: tool_execute_query
  Step 2: tool_explain_data → 3-5 bullet insights
  Step 3: Reply with one short sentence summary.

DIAGRAM REQUEST (ER diagram, relationship, flowchart, process):
  Step 1: tool_generate_flowchart
  Step 2: tool_explain_data
  Step 3: Reply with one short sentence summary.

CONVERSATIONAL (greetings, how-to questions): answer directly, no tools.

STRICT RULES — violating these is an error:
- If the user says "scatter", "scatter plot", "scatter chart" → chart_type = "scatter"
- If the user says "bar chart" or "bar graph" → chart_type = "bar"
- If the user says "line chart" or "line graph" → chart_type = "line"
- If the user says "pie chart" → chart_type = "pie"
- If the query contains ANY of: chart, plot, graph, visualization, scatter, bar, line, pie → you MUST call tool_generate_chart after tool_execute_query. No exceptions.
- After tool_execute_query, if a chart was requested, your VERY NEXT action must be tool_generate_chart.
- x_axis and y_axis must exactly match column names in the query result (e.g. "price", "total_revenue").
- Never output raw JSON blobs in your text response.
- Cross-DB queries: use alias prefix e.g. SELECT * FROM [sakila].customer
"""

# ── LLM provider selection ───────────────────────────────────────────────────

SUPPORTED_PROVIDERS = ("groq", "gemini")
DEFAULT_MODELS = {
    "groq": "openai/gpt-oss-120b",
    "gemini": "gemini-2.5-flash",
}


def resolve_provider() -> str:
    """Pick the LLM provider: LLM_PROVIDER if set, else whichever API key is present (Groq first)."""
    explicit = os.getenv("LLM_PROVIDER", "").strip().lower()
    if explicit:
        if explicit not in SUPPORTED_PROVIDERS:
            raise ValueError(
                f"Unsupported LLM_PROVIDER '{explicit}'. Use one of: {', '.join(SUPPORTED_PROVIDERS)}."
            )
        return explicit
    if os.getenv("GROQ_API_KEY"):
        return "groq"
    if os.getenv("GEMINI_API_KEY"):
        return "gemini"
    raise RuntimeError(
        "No LLM API key configured. Set GROQ_API_KEY or GEMINI_API_KEY in backend/.env."
    )


def build_llm():
    """Construct the chat model for the configured provider."""
    provider = resolve_provider()
    if provider == "groq":
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("LLM_PROVIDER is 'groq' but GROQ_API_KEY is not set.")
        from langchain_groq import ChatGroq
        model = os.getenv("GROQ_MODEL") or DEFAULT_MODELS["groq"]
        logger.info("Using Groq model %s", model)
        return ChatGroq(model=model, temperature=0, api_key=api_key)

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("LLM_PROVIDER is 'gemini' but GEMINI_API_KEY is not set.")
    model = os.getenv("GEMINI_MODEL") or DEFAULT_MODELS["gemini"]
    logger.info("Using Gemini model %s", model)
    return ChatGoogleGenerativeAI(
        model=model,
        temperature=0,
        google_api_key=api_key,
        thinking_budget=1024,
    )


# Singleton — created once, reused across requests, reset on DB change
_agent_executor = None
_agent_schema_key: str = ""

def _get_schema_key():
    from tools.db_tools import DB_PATH, _attached
    return DB_PATH + "|" + ",".join(f"{k}={v}" for k, v in sorted(_attached.items()))

def get_agent_executor():
    global _agent_executor, _agent_schema_key

    current_key = _get_schema_key()
    if _agent_executor is not None and _agent_schema_key == current_key:
        return _agent_executor

    llm = build_llm()

    # Build RAG index from current schema
    schema_str = get_schema()
    _schema_rag.build(schema_str, current_key)
    full_prompt = system_prompt + "\n\n" + _schema_prompt_section()

    _agent_executor = create_react_agent(llm, tools, prompt=full_prompt)
    _agent_schema_key = current_key
    logger.info("Agent executor rebuilt for schema key: %s", current_key)
    return _agent_executor


def get_rag_context(query: str) -> str:
    """Retrieve the most relevant table schemas for a given user query via RAG."""
    current_key = _get_schema_key()
    # Ensure index is built
    if _schema_rag.schema_key != current_key:
        schema_str = get_schema()
        _schema_rag.build(schema_str, current_key)
    if _schema_rag.inline:
        return ""  # the whole schema is already in the system prompt
    return _schema_rag.retrieve(query, k=6)


def _schema_prompt_section() -> str:
    """Schema text for the system prompt: everything if small, else just table names."""
    docs = _schema_rag.table_docs
    if _schema_rag.inline:
        return "Database schema, one table per line as table(column TYPE):\n" + "\n".join(docs)
    names = ", ".join(d.split("(", 1)[0] for d in docs)
    return ("Database tables: " + names + "\n"
            "Column definitions for the tables most relevant to each question are given "
            "with the question; call tool_get_schema if you need the others.")
