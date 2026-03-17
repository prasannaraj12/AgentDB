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

    # Schema is nested: { "main": { "table": [cols] }, "alias": { ... } }
    # Flatten to a single { "table": [cols] } dict
    flat: dict = {}
    for db_tables in schema.values():
        if isinstance(db_tables, dict):
            flat.update(db_tables)

    tables = list(flat.keys())
    suggestions = []
    for t in tables[:6]:
        cols = [c["name"] for c in flat[t]]
        # Skip ID/PK columns for numeric suggestions
        num_cols = [
            c["name"] for c in flat[t]
            if c["type"].upper() in ("INTEGER", "REAL", "NUMERIC", "FLOAT", "DOUBLE")
            and not c["name"].lower().endswith("_id")
            and c["name"].lower() not in ("id", "pk")
            and not c.get("pk")
        ]
        # Pick a good label column (non-numeric, non-id)
        label_cols = [
            c["name"] for c in flat[t]
            if c["type"].upper() in ("TEXT", "VARCHAR", "CHAR", "STRING", "")
            and not c["name"].lower().endswith("_id")
            and c["name"].lower() != "id"
        ]
        suggestions.append(f"Show me the top 10 records from {t}")
        if num_cols:
            suggestions.append(f"What is the total {num_cols[0]} in {t}?")
        if num_cols and label_cols:
            suggestions.append(f"Show a bar chart of {label_cols[0]} vs {num_cols[0]} in {t}")

    if len(tables) >= 2:
        suggestions.append(f"Show the ER diagram of this database")
        suggestions.append(f"Give me insights about the {tables[0]} data")

    seen, final = set(), []
    for s in suggestions:
        if s not in seen:
            seen.add(s)
            final.append(s)
        if len(final) == 6:
            break

    return {"suggestions": final}
