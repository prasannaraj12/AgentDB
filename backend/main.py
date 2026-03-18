import os
import shutil
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)

has_api_key = os.getenv("GEMINI_API_KEY") is not None
if has_api_key:
    from agent import get_agent_executor  # noqa: F401 — warm up import

from tools.db_tools import set_db_path

DATABASES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "databases")
os.makedirs(DATABASES_DIR, exist_ok=True)

_default_db_src = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ecommerce.db")
_default_db_dst = os.path.join(DATABASES_DIR, "ecommerce.db")
if os.path.exists(_default_db_src) and not os.path.exists(_default_db_dst):
    shutil.copy2(_default_db_src, _default_db_dst)

set_db_path(_default_db_dst)

app = FastAPI(title="AgentDB API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        os.getenv("FRONTEND_URL", "*"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
from routers.chat import router as chat_router
from routers.databases import router as databases_router
from routers.export import router as export_router
from routers.share import router as share_router
from routers.report import router as report_router
from routers.suggestions import router as suggestions_router

app.include_router(chat_router, prefix="/chat")
app.include_router(databases_router, prefix="/databases")
app.include_router(export_router, prefix="/export")
app.include_router(share_router, prefix="/share")
app.include_router(report_router, prefix="/report")
app.include_router(suggestions_router, prefix="/suggestions")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting AgentDB on http://0.0.0.0:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
