import os
import shutil
import csv
import io
import json
import re
import logging
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()

DATABASES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "databases")


class SelectDBRequest(BaseModel):
    filename: str


class AttachDBRequest(BaseModel):
    filename: str
    alias: str = ""


@router.get("")
async def list_databases():
    files = [f for f in os.listdir(DATABASES_DIR) if f.endswith(".db")]
    return {"databases": files}


@router.post("/upload")
async def upload_database(file: UploadFile = File(...)):
    name = file.filename or "uploaded"
    ext = os.path.splitext(name)[1].lower()
    base = os.path.splitext(name)[0]

    SQLITE_EXTS = (".db", ".sqlite", ".sqlite3")
    CONVERT_EXTS = (".csv", ".tsv", ".json")

    if ext not in SQLITE_EXTS and ext not in CONVERT_EXTS and ext != "":
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'.")

    if ext in SQLITE_EXTS or ext == "":
        save_name = base + ".db"
        dest = os.path.join(DATABASES_DIR, save_name)
        with open(dest, "wb") as f:
            shutil.copyfileobj(file.file, f)
        return {"message": f"Uploaded as {save_name}", "filename": save_name}

    import sqlite3 as _sqlite3
    content = await file.read()
    save_name = base + ".db"
    dest = os.path.join(DATABASES_DIR, save_name)
    table_name = re.sub(r'[^a-zA-Z0-9_]', '_', base)

    try:
        conn = _sqlite3.connect(dest)
        cur = conn.cursor()

        if ext in (".csv", ".tsv"):
            delimiter = "\t" if ext == ".tsv" else ","
            text = content.decode("utf-8-sig", errors="replace")
            reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
            rows = list(reader)
            if not rows:
                raise HTTPException(status_code=400, detail="File is empty.")
            cols = list(rows[0].keys())
            col_defs = ", ".join(f'"{c}" TEXT' for c in cols)
            cur.execute(f'CREATE TABLE IF NOT EXISTS "{table_name}" ({col_defs})')
            placeholders = ", ".join("?" for _ in cols)
            for row in rows:
                cur.execute(f'INSERT INTO "{table_name}" VALUES ({placeholders})', [row.get(c, "") for c in cols])

        elif ext == ".json":
            text = content.decode("utf-8", errors="replace")
            data = json.loads(text)
            if isinstance(data, dict):
                data = next((v for v in data.values() if isinstance(v, list)), [data])
            if not isinstance(data, list) or not data:
                raise HTTPException(status_code=400, detail="JSON must be an array of objects.")
            cols = list(data[0].keys())
            col_defs = ", ".join(f'"{c}" TEXT' for c in cols)
            cur.execute(f'CREATE TABLE IF NOT EXISTS "{table_name}" ({col_defs})')
            placeholders = ", ".join("?" for _ in cols)
            for row in data:
                cur.execute(f'INSERT INTO "{table_name}" VALUES ({placeholders})', [str(row.get(c, "")) for c in cols])

        conn.commit()
        conn.close()
        return {"message": f"Converted {name} → {save_name}", "filename": save_name}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")


@router.post("/select")
async def select_database(request: SelectDBRequest):
    from tools.db_tools import set_db_path
    path = os.path.join(DATABASES_DIR, request.filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Database not found.")
    set_db_path(path)
    import agent as _agent_mod
    _agent_mod._agent_executor = None
    return {"message": f"Switched to {request.filename}"}


@router.post("/attach")
async def attach_database(request: AttachDBRequest):
    from tools.db_tools import attach_db
    path = os.path.join(DATABASES_DIR, request.filename)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Database not found.")
    alias = request.alias or os.path.splitext(request.filename)[0].replace("-", "_").replace(" ", "_")
    attach_db(alias, path)
    return {"message": f"Attached {request.filename} as [{alias}]", "alias": alias}


@router.post("/detach")
async def detach_database(request: AttachDBRequest):
    from tools.db_tools import detach_db
    detach_db(request.alias)
    return {"message": f"Detached [{request.alias}]"}


@router.get("/attached")
async def list_attached():
    from tools.db_tools import get_attached
    return {"attached": get_attached()}
