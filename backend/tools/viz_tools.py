import json
from typing import Dict, Any, List

def generate_chart(chart_type: str, title: str, x_axis: str, y_axis: str, data: List[Dict[str, Any]]) -> str:
    """
    Generate the structured JSON configuration for a data visualization chart.
    This output will be parsed by the frontend to render Recharts components.
    
    Args:
        chart_type (str): The type of chart: 'bar', 'line', 'pie', 'scatter'
        title (str): Title of the chart
        x_axis (str): The data key for the x-axis labels
        y_axis (str): The data key for the y-axis values
        data (List[Dict[str, Any]]): The raw tabular data rows (typically from execute_query)
        
    Returns:
        str: JSON string containing the chart configuration
    """
    valid_types = ['bar', 'line', 'pie', 'scatter']
    if chart_type.lower() not in valid_types:
        return json.dumps({"error": f"Invalid chart type. Must be one of {valid_types}."})
        
    chart_config = {
        "type": "chart",
        "chart_type": chart_type.lower(),
        "title": title,
        "x_axis": x_axis,
        "y_axis": y_axis,
        "data": data
    }
    
    return json.dumps(chart_config)

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
