import sqlite3
import json
import os

# Primary DB path
DB_PATH = "ecommerce.db"

# Attached DBs: {alias: path}  e.g. {"sakila": "/path/to/sakila.db"}
_attached: dict = {}

_schema_cache_key = None  # invalidate when DBs change

def set_db_path(path: str):
    global DB_PATH, _schema_cache_key
    DB_PATH = path
    _schema_cache_key = None  # invalidate

def attach_db(alias: str, path: str):
    global _schema_cache_key
    _attached[alias] = path
    _schema_cache_key = None

def detach_db(alias: str):
    global _schema_cache_key
    _attached.pop(alias, None)
    _schema_cache_key = None

def get_attached() -> dict:
    return dict(_attached)

def get_db_connection():
    """Open primary DB and attach all secondary DBs."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    for alias, path in _attached.items():
        conn.execute(f"ATTACH DATABASE ? AS [{alias}]", (path,))
    return conn

_schema_cache: dict = {}

def get_schema() -> str:
    """
    Retrieve schema from primary DB and all attached DBs.
    Returns JSON: { "main": {...tables}, "alias": {...tables}, ... }
    """
    cache_key = DB_PATH + "|" + ",".join(f"{k}={v}" for k, v in sorted(_attached.items()))
    if _schema_cache.get("key") == cache_key:
        return _schema_cache["value"]

    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Collect schemas from all databases (main + attached)
        db_names = ["main"] + list(_attached.keys())
        full_schema = {}

        for db_name in db_names:
            prefix = "" if db_name == "main" else f"[{db_name}]."
            try:
                cursor.execute(f"SELECT name FROM {prefix}sqlite_master WHERE type='table';")
                tables = cursor.fetchall()
            except Exception:
                continue

            db_schema = {}
            for table in tables:
                table_name = table["name"]
                if table_name.startswith("sqlite_"):
                    continue
                try:
                    cursor.execute(f"PRAGMA {prefix}table_info({table_name});")
                    cols = cursor.fetchall()
                    db_schema[table_name] = [
                        {"name": c["name"], "type": c["type"],
                         "notnull": bool(c["notnull"]), "pk": bool(c["pk"])}
                        for c in cols
                    ]
                except Exception:
                    pass

            if db_schema:
                label = "main" if db_name == "main" else db_name
                full_schema[label] = db_schema

        conn.close()
        result = json.dumps(full_schema, indent=2)
        _schema_cache["key"] = cache_key
        _schema_cache["value"] = result
        return result
    except Exception as e:
        return json.dumps({"error": f"Failed to retrieve schema: {str(e)}"})


def execute_query(sql_query: str) -> str:
    """Execute a read-only SELECT query. Supports cross-DB queries via alias.tablename syntax."""
    upper = sql_query.upper()
    if any(kw in upper for kw in ("DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "CREATE")):
        return json.dumps({"error": "Only SELECT queries are allowed."})
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(sql_query)
        rows = cursor.fetchall()
        columns = [d[0] for d in cursor.description]
        results = [dict(zip(columns, row)) for row in rows]
        conn.close()
        return json.dumps(results)
    except Exception as e:
        return json.dumps({"error": f"Failed to execute query: {str(e)}"})
