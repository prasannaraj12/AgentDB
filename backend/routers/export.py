import io
import csv
import json
import logging
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class ExportRequest(BaseModel):
    sql_query: str


@router.post("/csv")
async def export_csv(request: ExportRequest):
    from tools.db_tools import execute_query as raw_execute_query
    raw = raw_execute_query(request.sql_query)
    data = json.loads(raw)
    if not data or "error" in data:
        raise HTTPException(status_code=400, detail=str(data))
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=export.csv"}
    )
