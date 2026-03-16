import pytest
import json
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from tools.viz_tools import generate_chart, generate_flowchart, explain_data

SAMPLE_DATA = [{"category": "A", "value": 10}, {"category": "B", "value": 20}]

def test_generate_bar_chart():
    result = json.loads(generate_chart("bar", "Test Chart", "category", "value", SAMPLE_DATA))
    assert result["type"] == "chart"
    assert result["chart_type"] == "bar"
    assert result["data"] == SAMPLE_DATA

def test_generate_line_chart():
    result = json.loads(generate_chart("line", "Line", "category", "value", SAMPLE_DATA))
    assert result["chart_type"] == "line"

def test_generate_pie_chart():
    result = json.loads(generate_chart("pie", "Pie", "category", "value", SAMPLE_DATA))
    assert result["chart_type"] == "pie"

def test_generate_scatter_chart():
    result = json.loads(generate_chart("scatter", "Scatter", "category", "value", SAMPLE_DATA))
    assert result["chart_type"] == "scatter"

def test_generate_chart_invalid_type():
    result = json.loads(generate_chart("donut", "Bad", "x", "y", SAMPLE_DATA))
    assert "error" in result

def test_generate_chart_preserves_title():
    result = json.loads(generate_chart("bar", "My Title", "x", "y", SAMPLE_DATA))
    assert result["title"] == "My Title"

def test_generate_flowchart_valid():
    mermaid = "graph TD\n  A --> B"
    result = json.loads(generate_flowchart(mermaid))
    assert result["type"] == "mermaid"
    assert "A --> B" in result["content"]

def test_generate_flowchart_empty():
    result = json.loads(generate_flowchart(""))
    assert "error" in result

def test_explain_data():
    result = json.loads(explain_data("Sales increased by 20%"))
    assert result["type"] == "explanation"
    assert "Sales increased" in result["content"]
