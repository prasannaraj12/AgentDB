import json
from typing import Dict, Any, List

def generate_chart(chart_type: str, title: str, x_axis: str, y_axis: str, data: List[Dict[str, Any]]) -> str:
    valid_types = ['bar', 'line', 'pie', 'scatter']
    if chart_type.lower() not in valid_types:
        return json.dumps({"error": f"Invalid chart type. Must be one of {valid_types}."})

    if not data:
        return json.dumps({"error": "No data provided to generate chart."})

    # Auto-correct axis names if they don't match actual columns
    actual_cols = list(data[0].keys())

    def best_match(name: str, cols: List[str]) -> str:
        if name in cols:
            return name
        # Try case-insensitive match
        lower = name.lower()
        for c in cols:
            if c.lower() == lower:
                return c
        # Try partial match (e.g. "price" matches "product_price")
        for c in cols:
            if lower in c.lower() or c.lower() in lower:
                return c
        # Fallback: return original (frontend will show no-data message)
        return name

    x_axis = best_match(x_axis, actual_cols)
    y_axis = best_match(y_axis, actual_cols)

    return json.dumps({
        "type": "chart",
        "chart_type": chart_type.lower(),
        "title": title,
        "x_axis": x_axis,
        "y_axis": y_axis,
        "data": data
    })

def generate_flowchart(mermaid_string: str) -> str:
    """
    Validates and formats a Mermaid.js string for diagram generation.
    Supports flowcharts, ER diagrams, and process flows.
    
    Args:
        mermaid_string (str): The raw Mermaid.js syntax block describing the diagram.
        
    Returns:
        str: JSON string containing the diagram configuration
    """
    if not mermaid_string or len(mermaid_string.strip()) == 0:
        return json.dumps({"error": "Empty mermaid string provided."})
        
    # We pass the raw string back to the frontend to render, wrapped in an execution JSON.
    diagram_config = {
        "type": "mermaid",
        "content": mermaid_string.strip()
    }
    
    return json.dumps(diagram_config)

def explain_data(insights: str) -> str:
    """
    Function meant to format natural language summaries or explanations of data trends.
    The LLM formulates the insights, and this tool just packages it as structured output
    to signal the UI to style it as a distinct 'data explanation' card.
    
    Args:
        insights (str): Natural language summary of data patterns or results.
        
    Returns:
        str: JSON string with the explanation
    """
    # Normalize: if insights is already a JSON string containing "content", unwrap it
    if isinstance(insights, str):
        try:
            parsed = json.loads(insights)
            if isinstance(parsed, dict) and "content" in parsed:
                insights = parsed["content"]
        except Exception:
            pass
    # Ensure insights is a plain string
    if not isinstance(insights, str):
        insights = str(insights)
    return json.dumps({
        "type": "explanation",
        "content": insights
    }, ensure_ascii=False)
