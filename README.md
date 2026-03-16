# AgentDB — Intelligent AI Database Agent

> Talk to your database in plain English. Get charts, diagrams, and insights — instantly.

Built for the **iTech AI Innovation Hackathon 2026** using a LangGraph ReAct agent powered by Google Gemini 2.5 Flash.

---

## Overview

iTech AI Database Agent bridges the gap between natural language and structured databases. Ask a question, get a SQL query executed, a chart rendered, and AI-generated insights — all in one response.

No SQL knowledge required.

---

## Features

| Feature | Description |
|---|---|
| Natural Language → SQL | Converts plain English questions into SQL queries automatically |
| Interactive Charts | Bar, line, pie, and scatter charts rendered via Recharts |
| ER & Flow Diagrams | Database schemas and process flows via Mermaid.js |
| AI Insights | Bullet-point analysis generated after every query |
| Agent Trace | Execution timeline showing every step the agent took |
| Multi-Database | Upload and switch between multiple SQLite databases |
| Query History | Persistent sidebar history — survives page refreshes |
| Dashboard | Pin charts and compare them in a grid view |

---

## Tech Stack

### Backend
- **FastAPI** — REST API server
- **LangGraph** — ReAct agent loop (`create_react_agent`)
- **LangChain** — Tool definitions and model integration
- **LangChain Google GenAI** — Gemini 2.5 Flash connector
- **SQLite** — Database engine

### Frontend
- **React + Vite** — UI framework
- **Recharts** — Interactive data visualizations
- **Mermaid.js** — ER diagrams and flowcharts
- **Lucide React** — Icons

---

## Architecture

```
User Message
     │
     ▼
FastAPI /chat endpoint
     │
     ▼
LangGraph ReAct Agent (Gemini 2.5 Flash)
     │
     ├── tool_get_schema       → reads DB structure
     ├── tool_execute_query    → runs SELECT queries
     ├── tool_generate_chart   → formats chart JSON
     ├── tool_generate_flowchart → formats Mermaid syntax
     └── tool_explain_data     → generates insights
     │
     ▼
JSON response → React frontend
     │
     ├── Recharts (charts)
     ├── Mermaid.js (diagrams)
     └── InsightCard (insights)
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Google Gemini API key → [Get one here](https://aistudio.google.com/app/apikey)

---

### 1. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
.\venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Add your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env

# Generate the sample database
python database/setup_db.py

# Start the server
python main.py
```

Backend runs on `http://localhost:8000`

---

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

---

## Sample Questions to Try

**Data Queries**
- "Who are the top 5 customers by total spending?"
- "Which product category generates the most revenue?"
- "Show all cancelled orders from the last 30 days"

**Charts**
- "Show a bar chart of sales by product category"
- "Give me a line chart of monthly revenue"
- "Pie chart of orders by status"

**Diagrams**
- "Draw the ER diagram of this database"
- "Create a flowchart of the order fulfillment process"

---

## Project Structure

```
├── backend/
│   ├── main.py                  # App entry point — wires routers + middleware
│   ├── agent.py                 # LangGraph ReAct agent + Schema RAG
│   ├── routers/
│   │   ├── chat.py              # /chat and /chat/stream (SSE) endpoints
│   │   ├── databases.py         # Upload, select, attach, detach DBs
│   │   ├── export.py            # CSV export
│   │   ├── share.py             # Shareable dashboard links
│   │   ├── report.py            # Auto-generated DB report
│   │   └── suggestions.py       # Smart query suggestions
│   ├── tools/
│   │   ├── db_tools.py          # Schema introspection + query execution
│   │   └── viz_tools.py         # Chart + diagram + insight formatters
│   ├── database/
│   │   └── setup_db.py          # Sample DB generator
│   ├── tests/
│   │   ├── test_db_tools.py     # Unit tests for DB tools
│   │   └── test_viz_tools.py    # Unit tests for viz tools
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Root layout + orchestration
│   │   ├── hooks/
│   │   │   ├── useChat.js       # SSE streaming + message state
│   │   │   ├── useDatabase.js   # DB select / attach / upload logic
│   │   │   └── useVoiceInput.js # Speech recognition hook
│   │   └── components/
│   │       ├── ChatMessage.jsx  # Message renderer (text + rich blobs)
│   │       ├── ChartRenderer.jsx    # Recharts bar/line/pie/scatter
│   │       ├── MermaidDiagram.jsx   # Mermaid.js ER + flowcharts
│   │       ├── DataTable.jsx        # Paginated query results table
│   │       ├── Dashboard.jsx        # Pinned charts grid
│   │       ├── ReportModal.jsx      # Auto-generated DB report modal
│   │       └── SharedDashboard.jsx  # Public shareable dashboard view
│   └── package.json
│
└── docker-compose.yml           # One-command Docker setup
```

---

## License

MIT
