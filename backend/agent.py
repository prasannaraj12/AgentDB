import os
import json
import re
import numpy as np
import faiss
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import tool
from typing import List, Dict, Any

from tools.db_tools import get_schema, execute_query
from tools.viz_tools import generate_chart, generate_flowchart, explain_data

# ── Schema RAG (TF-IDF keyword retrieval — no embedding API needed) ──────────

class SchemaRAG:
    def __init__(self):
        self.table_docs: List[str] = []
        self.table_tokens: List[set] = []   # tokenized table doc for BM25-style match
        self.schema_key: str = ""

    def _tokenize(self, text: str) -> set:
        return set(re.findall(r'[a-z0-9]+', text.lower()))

    def build(self, schema_json: str, key: str):
        if self.schema_key == key:
            return
        schema = json.loads(schema_json)
        docs = []
        for db_name, tables in schema.items():
            for table_name, columns in tables.items():
                col_str = ", ".join(
                    f"{c['name']} ({c['type']}{'  PK' if c.get('pk') else ''})"
                    for c in columns
                )
                prefix = "" if db_name == "main" else f"{db_name}."
                docs.append(f"Table: {prefix}{table_name}\nColumns: {col_str}")
        self.table_docs = docs
        self.table_tokens = [self._tokenize(d) for d in docs]
        self.schema_key = key

    def retrieve(self, query: str, k: int = 6) -> str:
        if not self.table_docs:
            return ""
        q_tokens = self._tokenize(query)
        # Score = number of overlapping tokens
        scores = [len(q_tokens & t) for t in self.table_tokens]
        # Always include at least top-k even if score is 0
        top_k = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)[:k]
        return "\n\n".join(self.table_docs[i] for i in top_k)


_schema_rag = SchemaRAG()

@tool
def tool_get_schema() -> str:
    """Retrieve the database schema including tables, columns, and types. Returns a JSON string representation."""
    return get_schema()

@tool
def tool_execute_query(sql_query: str) -> str:
    """Execute a strict read-only SQL SELECT query against the database. Returns query results as a JSON string."""
    return execute_query(sql_query)

@tool
def tool_generate_chart(chart_type: str, title: str, x_axis: str, y_axis: str, data: str) -> str:
    """
    Generate a chart from query results.
    chart_type: 'bar', 'line', 'pie', or 'scatter'
    x_axis: exact column name for X axis (must match a key in the data rows)
    y_axis: exact column name for Y axis (must match a key in the data rows)
    data: the COMPLETE JSON string from tool_execute_query — do NOT truncate or summarize it
    """
    if isinstance(data, str):
        try:
            parsed_data = json.loads(data)
        except:
            parsed_data = []
    else:
        parsed_data = data

    if not parsed_data:
        return json.dumps({"error": "No data provided to generate chart."})

    print(f"[chart] type={chart_type} x={x_axis} y={y_axis} rows={len(parsed_data)}")
    return generate_chart(chart_type, title, x_axis, y_axis, parsed_data)

@tool
def tool_generate_flowchart(mermaid_string: str) -> str:
    """
    Validates and formats a Mermaid.js string for diagram generation.
    Supports flowcharts, ER diagrams, and process flows.
    """
    return generate_flowchart(mermaid_string)

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
1. `tool_get_schema`: Get all table schemas. Call this ONLY if you don't already know the schema.
2. `tool_execute_query`: Run a SQLite SELECT query. Returns JSON rows.
3. `tool_generate_chart`: Render a chart (bar/line/pie/scatter) from query results.
4. `tool_generate_flowchart`: Render ER diagrams or process flows (Mermaid.js). Never use () inside node labels.
5. `tool_explain_data`: Package 3-5 bullet insights about the data as a styled card.

MANDATORY WORKFLOWS — follow these exactly:

When user asks for a CHART (bar, line, pie, scatter, plot, graph, visualization):
  Step 1: Call tool_execute_query to get the data
  Step 2: YOU MUST call tool_generate_chart immediately after — pass the COMPLETE raw JSON string from step 1 as `data`. NEVER skip this step.
  Step 3: Call tool_explain_data with 3-5 bullet insights
  Step 4: Return a short summary sentence only. No raw JSON in text.

When user asks for DATA / TABLE (show me, list, count, total, average):
  Step 1: Call tool_execute_query
  Step 2: Call tool_explain_data with 3-5 bullet insights
  Step 3: Return a short summary sentence.

When user asks for a DIAGRAM / RELATIONSHIP / ER diagram:
  Step 1: Call tool_generate_flowchart with Mermaid syntax
  Step 2: Call tool_explain_data with insights
  Step 3: Return a short summary sentence.

For generic/conversational questions: answer directly, NO tool calls.

CRITICAL RULES:
- "scatter", "scatter plot", "scatter chart" → chart_type MUST be "scatter"
- "bar chart", "bar graph" → chart_type MUST be "bar"
- "line chart", "line graph" → chart_type MUST be "line"
- "pie chart" → chart_type MUST be "pie"
- ANY mention of "chart", "plot", "graph", "visualization" → YOU MUST call tool_generate_chart. This is non-negotiable.
- Pass the FULL unmodified JSON string from tool_execute_query into tool_generate_chart data parameter.
- x_axis and y_axis must be exact column names from the query result.
- Do NOT output raw JSON blobs in your final text response.
- Cross-DB queries: prefix with alias e.g. SELECT * FROM [sakila].customer
"""

# Singleton — created once, reused across all requests
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

    api_key = os.getenv("GEMINI_API_KEY", "dummy")

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0,
        google_api_key=api_key,
        thinking_budget=1024,
    )

    # Build RAG index from current schema
    schema_str = get_schema()
    _schema_rag.build(schema_str, current_key)

    # Inject full schema into base prompt (RAG retrieval happens per-query in main.py)
    full_prompt = system_prompt + f"\n\nFull database schema for reference:\n{schema_str}"

    _agent_executor = create_react_agent(llm, tools, prompt=full_prompt)
    _agent_schema_key = current_key
    return _agent_executor


def get_rag_context(query: str) -> str:
    """Retrieve the most relevant table schemas for a given user query via RAG."""
    current_key = _get_schema_key()
    # Ensure index is built
    if _schema_rag.schema_key != current_key:
        schema_str = get_schema()
        _schema_rag.build(schema_str, current_key)
    return _schema_rag.retrieve(query, k=6)
