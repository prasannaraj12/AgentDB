import pytest
import json
import os
import sys
import tempfile
import sqlite3

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from tools.db_tools import set_db_path, get_schema, execute_query

@pytest.fixture
def temp_db():
    """Create a temporary SQLite DB for testing."""
    with tempfile.NamedTemporaryFile(suffix='.db', delete=False) as f:
        db_path = f.name
    conn = sqlite3.connect(db_path)
    conn.execute("CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL)")
    conn.execute("INSERT INTO products VALUES (1, 'Apple', 1.5)")
    conn.execute("INSERT INTO products VALUES (2, 'Banana', 0.75)")
    conn.commit()
    conn.close()
    set_db_path(db_path)
    yield db_path
    try:
        os.unlink(db_path)
    except PermissionError:
        pass  # Windows file lock — temp file will be cleaned up on reboot

def test_get_schema_returns_tables(temp_db):
    result = json.loads(get_schema())
    assert "main" in result
    assert "products" in result["main"]

def test_get_schema_returns_columns(temp_db):
    result = json.loads(get_schema())
    cols = [c["name"] for c in result["main"]["products"]]
    assert "id" in cols
    assert "name" in cols
    assert "price" in cols

def test_execute_query_select(temp_db):
    result = json.loads(execute_query("SELECT * FROM products"))
    assert isinstance(result, list)
    assert len(result) == 2
    assert result[0]["name"] == "Apple"

def test_execute_query_blocks_delete(temp_db):
    result = json.loads(execute_query("DELETE FROM products"))
    assert "error" in result

def test_execute_query_blocks_drop(temp_db):
    result = json.loads(execute_query("DROP TABLE products"))
    assert "error" in result

def test_execute_query_blocks_insert(temp_db):
    result = json.loads(execute_query("INSERT INTO products VALUES (3, 'Cherry', 2.0)"))
    assert "error" in result

def test_execute_query_invalid_sql(temp_db):
    result = json.loads(execute_query("SELECT * FROM nonexistent_table"))
    assert "error" in result
