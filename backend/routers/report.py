import json
import statistics
import logging
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/generate")
async def generate_report():
    from tools.db_tools import get_schema as _get_schema, execute_query as _execute_query

    schema = json.loads(_get_schema())
    if "error" in schema:
        raise HTTPException(status_code=500, detail="Could not read schema")

    report = {"databases": {}}

    for db_name, tables in schema.items():
        db_report = {}
        for table_name, columns in tables.items():
            num_cols = [c["name"] for c in columns if c["type"].upper() in
                        ("INTEGER", "REAL", "NUMERIC", "FLOAT", "DOUBLE", "INT", "BIGINT")]
            prefix = "" if db_name == "main" else f"[{db_name}]."

            count_res = json.loads(_execute_query(f"SELECT COUNT(*) as cnt FROM {prefix}{table_name}"))
            row_count = count_res[0]["cnt"] if isinstance(count_res, list) and count_res else 0

            sample_res = json.loads(_execute_query(f"SELECT * FROM {prefix}{table_name} LIMIT 5"))
            sample = sample_res if isinstance(sample_res, list) else []

            stats = {}
            for nc in num_cols[:3]:
                try:
                    vals_res = json.loads(_execute_query(
                        f"SELECT {nc} FROM {prefix}{table_name} WHERE {nc} IS NOT NULL LIMIT 1000"
                    ))
                    vals = [r[nc] for r in vals_res if r[nc] is not None]
                    if vals:
                        stats[nc] = {
                            "min": min(vals), "max": max(vals),
                            "avg": round(sum(vals) / len(vals), 2),
                            "total": round(sum(vals), 2)
                        }
                        if len(vals) > 2:
                            mean = sum(vals) / len(vals)
                            stdev = statistics.stdev(vals)
                            anomalies = [v for v in vals if abs(v - mean) > 2 * stdev]
                            if anomalies:
                                stats[nc]["anomalies"] = len(anomalies)
                except Exception:
                    pass

            db_report[table_name] = {
                "columns": columns,
                "row_count": row_count,
                "sample": sample,
                "stats": stats
            }
        report["databases"][db_name] = db_report

    return report
