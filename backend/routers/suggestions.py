import json
import logging
from fastapi import APIRouter

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("")
async def get_suggestions():
    from tools.db_tools import get_schema as _get_schema
    schema = json.loads(_get_schema())
    if "error" in schema:
        return {"suggestions": []}

    tables = list(schema.keys())
    suggestions = []
    for t in tables[:6]:
        cols = [c["name"] for c in schema[t]]
        num_cols = [c["name"] for c in schema[t]
                    if c["type"].upper() in ("INTEGER", "REAL", "NUMERIC", "FLOAT", "DOUBLE")]
        suggestions.append(f"Show me all records from {t}")
        if num_cols:
            suggestions.append(f"What is the total {num_cols[0]} in {t}?")
        if len(cols) > 1:
            suggestions.append(f"Show a bar chart of {t} by {cols[1]}")

    if len(tables) >= 2:
        suggestions.append(f"Show the relationship between {tables[0]} and {tables[1]}")
        suggestions.append(f"Give me insights about the {tables[0]} data")

    seen, final = set(), []
    for s in suggestions:
        if s not in seen:
            seen.add(s)
            final.append(s)
        if len(final) == 6:
            break

    return {"suggestions": final}
