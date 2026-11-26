"""Tests for keeping LLM context small: compact schema, row previews, artifacts, slim history."""
import json
import os
import sqlite3
import sys
import tempfile

import pytest
from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
from langchain_core.messages import AIMessage, ToolMessage

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import agent
from agent import (
    SchemaRAG, compact_schema_lines, preview_rows_for_llm,
    tool_execute_query, tool_generate_chart, tool_generate_flowchart,
    LLM_PREVIEW_MAX_ROWS,
)
from routers.chat import collect_rich_blobs, extract_trace, history_entry
from tools.db_tools import set_db_path

N_ROWS = 120


@pytest.fixture
def sales_db():
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
        path = f.name
    conn = sqlite3.connect(path)
    conn.execute("CREATE TABLE sales (id INTEGER PRIMARY KEY, region TEXT, amount REAL)")
    conn.executemany("INSERT INTO sales VALUES (?, ?, ?)",
                     [(i, f"region_{i % 4}", float(i)) for i in range(1, N_ROWS + 1)])
    conn.commit()
    conn.close()
    set_db_path(path)
    yield path
    try:
        os.unlink(path)
    except PermissionError:
        pass


def call(tool, **args):
    """Invoke a tool the way LangGraph's ToolNode does, returning the ToolMessage."""
    return tool.invoke({"type": "tool_call", "id": "call_1", "name": tool.name, "args": args})


# ── Schema formatting ────────────────────────────────────────────────────────

def test_compact_schema_lines_format():
    schema = {"main": {"products": [
        {"name": "id", "type": "INTEGER", "pk": True},
        {"name": "name", "type": "TEXT", "pk": False},
        {"name": "misc", "type": "", "pk": False},
    ]}, "sakila": {"actor": [{"name": "actor_id", "type": "INTEGER", "pk": True}]}}
    assert compact_schema_lines(json.dumps(schema)) == [
        "products(id INTEGER PK, name TEXT, misc ANY)",
        "[sakila].actor(actor_id INTEGER PK)",
    ]


def test_compact_schema_is_much_smaller_than_json(sales_db):
    from tools.db_tools import get_schema
    raw = get_schema()
    assert len("\n".join(compact_schema_lines(raw))) < len(raw) / 3


def test_compact_schema_reports_errors():
    lines = compact_schema_lines(json.dumps({"error": "boom"}))
    assert lines == ["Schema unavailable: boom"]


def test_small_schema_is_inlined_and_skips_rag():
    rag = SchemaRAG()
    rag.build(json.dumps({"main": {"t": [{"name": "a", "type": "INT", "pk": False}]}}), "k1")
    assert rag.inline is True


def test_large_schema_uses_rag_retrieval():
    tables = {f"table_{i}": [{"name": f"column_{j}", "type": "TEXT", "pk": False} for j in range(20)]
              for i in range(40)}
    tables["invoices"] = [{"name": "invoice_total", "type": "REAL", "pk": False}]
    rag = SchemaRAG()
    rag.build(json.dumps({"main": tables}), "k2")
    assert rag.inline is False
    assert rag.retrieve("total of invoices", k=3).splitlines()[0].startswith("invoices(")


# ── Row previews ─────────────────────────────────────────────────────────────

def test_small_result_passes_through_unchanged():
    raw = json.dumps([{"a": 1}, {"a": 2}])
    assert preview_rows_for_llm(raw) == raw


def test_large_result_is_previewed_with_row_count():
    raw = json.dumps([{"id": i, "v": "x" * 10} for i in range(500)])
    out = json.loads(preview_rows_for_llm(raw))
    assert out["row_count"] == 500
    assert 0 < len(out["preview_rows"]) <= LLM_PREVIEW_MAX_ROWS
    assert out["preview_rows"][0] == {"id": 0, "v": "xxxxxxxxxx"}


def test_wide_rows_respect_char_budget():
    raw = json.dumps([{"blob": "y" * 1000} for _ in range(10)])
    out = json.loads(preview_rows_for_llm(raw))
    assert out["row_count"] == 10
    assert len(out["preview_rows"]) < 10


def test_errors_pass_through_unchanged():
    raw = json.dumps({"error": "no such table"})
    assert preview_rows_for_llm(raw) == raw


# ── Tools: short content for the LLM, full artifact for the UI ───────────────

def test_execute_query_previews_for_llm_but_keeps_all_rows(sales_db):
    msg = call(tool_execute_query, sql_query="SELECT * FROM sales")
    assert json.loads(msg.content)["row_count"] == N_ROWS
    assert len(json.loads(msg.artifact)) == N_ROWS


def test_generate_chart_reruns_sql_and_hides_data_from_llm(sales_db):
    sql = "SELECT region, SUM(amount) AS total FROM sales GROUP BY region"
    msg = call(tool_generate_chart, chart_type="bar", title="By region",
               x_axis="region", y_axis="total", sql_query=sql)
    assert "region_0" not in msg.content           # no data rows sent back to the LLM
    assert "bar chart" in msg.content
    blob = json.loads(msg.artifact)
    assert blob["type"] == "chart"
    assert len(blob["data"]) == 4 and blob["x_axis"] == "region"


def test_generate_chart_returns_sql_errors_to_llm(sales_db):
    msg = call(tool_generate_chart, chart_type="bar", title="t", x_axis="a", y_axis="b",
               sql_query="SELECT * FROM missing_table")
    assert "error" in json.loads(msg.content)
    assert msg.artifact is None


def test_generate_chart_rejects_empty_results(sales_db):
    msg = call(tool_generate_chart, chart_type="bar", title="t", x_axis="region", y_axis="amount",
               sql_query="SELECT region, amount FROM sales WHERE amount < 0")
    assert "no rows" in json.loads(msg.content)["error"]


def test_generate_chart_invalid_type_is_error(sales_db):
    msg = call(tool_generate_chart, chart_type="donut", title="t", x_axis="region",
               y_axis="amount", sql_query="SELECT region, amount FROM sales")
    assert "error" in json.loads(msg.content)
    assert msg.artifact is None


def test_flowchart_summary_for_llm_full_diagram_for_ui():
    msg = call(tool_generate_flowchart, mermaid_string="erDiagram\n  A ||--o{ B : has")
    assert msg.content == "Diagram rendered for the user."
    assert json.loads(msg.artifact)["type"] == "mermaid"


# ── chat.py: UI gets artifacts, history stays slim ───────────────────────────

def _chart_turn(sales_db):
    sql = "SELECT region, SUM(amount) AS total FROM sales GROUP BY region"
    q = call(tool_execute_query, sql_query=sql)
    c = call(tool_generate_chart, chart_type="pie", title="Share", x_axis="region",
             y_axis="total", sql_query=sql)
    ai = AIMessage(content="", tool_calls=[
        {"name": "tool_execute_query", "args": {"sql_query": sql}, "id": "1"},
        {"name": "tool_generate_chart", "args": {"chart_type": "pie", "x_axis": "region",
                                                 "y_axis": "total", "sql_query": sql}, "id": "2"},
    ])
    return sql, [ai, q, c]


def test_trace_and_rich_blobs_use_full_artifacts(sales_db):
    _, messages = _chart_turn(sales_db)
    trace = extract_trace(messages)
    query_result = next(s for s in trace if s["step"] == "tool_result" and s["tool"] == "tool_execute_query")
    assert len(json.loads(query_result["output"])) == 4
    blobs = collect_rich_blobs(messages)
    assert len(json.loads(blobs["chart"])["data"]) == 4


def test_history_entry_has_context_but_no_data(sales_db):
    sql, messages = _chart_turn(sales_db)
    entry = history_entry("Here is the pie chart.", messages)
    assert entry.startswith("Here is the pie chart.")
    assert sql in entry and "pie chart" in entry
    assert '"data"' not in entry and "region_0" not in entry


def test_history_entry_plain_reply_unchanged():
    assert history_entry("Hello!", [AIMessage(content="Hello!")]) == "Hello!"


# ── End to end through LangGraph with a scripted model ───────────────────────

class ScriptedChatModel(GenericFakeChatModel):
    """Fake chat model that replays fixed messages and records what it was sent."""
    seen: list = []

    def bind_tools(self, tools, **kwargs):
        return self

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        self.seen.append(list(messages))
        return super()._generate(messages, stop=stop, run_manager=run_manager, **kwargs)


def test_agent_loop_never_sends_chart_rows_to_llm(sales_db, monkeypatch):
    sql = "SELECT id, amount FROM sales"
    script = iter([
        AIMessage(content="", tool_calls=[{"name": "tool_execute_query", "args": {"sql_query": sql}, "id": "a"}]),
        AIMessage(content="", tool_calls=[{"name": "tool_generate_chart", "id": "b", "args": {
            "chart_type": "line", "title": "Amounts", "x_axis": "id", "y_axis": "amount", "sql_query": sql}}]),
        AIMessage(content="Amounts rise steadily."),
    ])
    model = ScriptedChatModel(messages=script)
    model.seen.clear()
    monkeypatch.setattr(agent, "build_llm", lambda: model)
    monkeypatch.setattr(agent, "_agent_executor", None)

    result = agent.get_agent_executor().invoke({"messages": [("user", "line chart of amounts")]})
    msgs = result["messages"]

    # The UI still gets the complete chart (all rows) ...
    chart = json.loads(collect_rich_blobs(msgs)["chart"])
    assert len(chart["data"]) == N_ROWS
    # ... but the final LLM call saw only the preview and the chart summary.
    last_prompt = " ".join(str(m.content) for m in model.seen[-1])
    assert '"id": 100' not in last_prompt
    assert "Chart rendered for the user" in last_prompt
    # The system prompt carries the compact schema, not indented JSON.
    system_text = str(model.seen[0][0].content)
    assert "sales(id INTEGER PK, region TEXT, amount REAL)" in system_text
    assert '"notnull"' not in system_text
    monkeypatch.setattr(agent, "_agent_executor", None)
