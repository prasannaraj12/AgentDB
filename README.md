# iTech AI Database Agent

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
│   ├── main.py              # FastAPI app + endpoints
│   ├── agent.py             # LangGraph ReAct agent
│   ├── tools/
│   │   ├── db_tools.py      # Schema + query execution
│   │   └── viz_tools.py     # Chart + diagram formatters
│   ├── database/
│   │   └── setup_db.py      # Sample DB generator
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── App.jsx           # Main layout + state
    │   └── components/
    │       ├── ChatMessage.jsx   # Message + chart renderer
    │       ├── Sidebar.jsx       # History + DB selector
    │       ├── Dashboard.jsx     # Pinned charts grid
    │       └── DataTable.jsx     # Paginated results table
    └── package.json
```

---

## License

MIT
