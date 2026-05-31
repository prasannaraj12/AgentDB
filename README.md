# AgentDB — Intelligent AI Database Agent

> Talk to your database in plain English. Get SQL, charts, diagrams, and insights instantly.

Built for the **iTech AI Innovation Hackathon 2026**.

---

## Quick Start (Any Computer)

### Prerequisites

- **Python 3.9+** → [python.org](https://www.python.org/downloads/)
- **Node.js 18+** → [nodejs.org](https://nodejs.org/)
- **Git** → [git-scm.com](https://git-scm.com/)

---

### 1. Clone the repo

```bash
git clone https://github.com/prasannaraj12/AgentDB.git
cd AgentDB
```

---

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy env file
cp .env.example .env
```

> **Optional:** Add a Gemini API key to `backend/.env` if you want AI mode.
> The app works fully offline without one using the built-in local agent.

```
GEMINI_API_KEY=your_key_here   # optional
```

```bash
# Start the backend
python -m uvicorn main:app --reload --port 8000
```

Backend runs at → **http://localhost:8000**

---

### 3. Frontend Setup

Open a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at → **http://localhost:5173**

> To use a different port: `npm run dev -- --port 8001`

---

### 4. Open in browser

Go to **http://localhost:5173** (or your chosen port).

---

## Two Modes

| Mode | Requires | How it works |
|---|---|---|
| **Local Agent** (default) | Nothing — fully offline | TF-IDF similarity over 80+ curated NL→SQL pairs for all 4 built-in databases |
| **Gemini AI** | `GEMINI_API_KEY` in `.env` | LangGraph ReAct agent powered by Gemini 2.0 Flash |

The app auto-detects which mode to use based on whether a valid API key is present.

---

## Built-in Databases

All 4 databases are included — no setup needed:

| Database | Tables | Description |
|---|---|---|
| `ecommerce.db` | customers, products, orders, order_items | Small e-commerce store |
| `ecommerce_dataset.db` | customers, products, inventory, orders, order_items | Larger dataset (5000 orders) |
| `chinook.db` | artists, albums, tracks, genres, invoices, customers | Music store |
| `sakila.db` | film, actor, customer, rental, payment, category | Video rental store |

---

## Sample Queries to Try

```
show top 10 customers by spending
bar chart of sales by category
monthly revenue trend
pie chart of order status
show ER diagram
top 10 artists by number of tracks
films by rating
who are the top customers
```

---

## Features

| Feature | Description |
|---|---|
| Natural Language → SQL | Plain English converted to SQL automatically |
| Interactive Charts | Bar, line, pie, scatter via Recharts |
| ER Diagrams | Auto-generated from schema via Mermaid.js |
| AI Insights | Bullet-point analysis on every query |
| Local Agent | Works 100% offline — no API key needed |
| Multi-Database | Switch between 4 built-in databases |
| Upload Database | Upload your own `.db`, `.csv`, `.json` files |
| Voice Input | Speak your query |
| CSV Export | Download any result as CSV |
| Shareable Dashboard | Pin charts, share with a public link |
| Query History | Every query saved in the sidebar |
| DB Report | Auto-generated stats report per table |

---

## Project Structure

```
AgentDB/
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── agent.py                 # LangGraph ReAct agent (Gemini mode)
│   ├── local_agent.py           # Offline TF-IDF agent (no API needed)
│   ├── routers/
│   │   ├── chat.py              # /chat and /chat/stream endpoints
│   │   ├── databases.py         # Upload, select, attach, detach DBs
│   │   ├── export.py            # CSV export
│   │   ├── share.py             # Shareable dashboard links
│   │   ├── report.py            # Auto DB report
│   │   └── suggestions.py       # Smart query suggestions
│   ├── tools/
│   │   ├── db_tools.py          # Schema introspection + query execution
│   │   └── viz_tools.py         # Chart / diagram / insight formatters
│   ├── training/
│   │   └── training_data.py     # 80+ curated NL→SQL pairs (all 4 DBs)
│   ├── database/
│   │   └── setup_db.py          # Sample DB generator
│   ├── databases/               # Built-in DB files live here
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── LandingPage.jsx      # Interactive landing page
│   │   │   ├── ChatMessage.jsx      # Message renderer
│   │   │   ├── ChartRenderer.jsx    # Recharts visualizations
│   │   │   ├── MermaidDiagram.jsx   # ER + flowcharts
│   │   │   ├── DataTable.jsx        # Paginated results table
│   │   │   ├── Dashboard.jsx        # Pinned charts grid
│   │   │   ├── ReportModal.jsx      # DB report modal
│   │   │   └── SharedDashboard.jsx  # Public share view
│   │   └── hooks/
│   │       ├── useChat.js           # SSE streaming + message state
│   │       ├── useDatabase.js       # DB management
│   │       └── useVoiceInput.js     # Speech recognition
│   └── package.json
│
├── docker-compose.yml           # One-command Docker setup
└── README.md
```

---

## Docker (Alternative Setup)

If you have Docker installed:

```bash
docker-compose up --build
```

- Frontend → http://localhost:5173
- Backend → http://localhost:8000

---

## Tech Stack

**Backend:** FastAPI · LangGraph · LangChain · SQLite · Python 3.9+

**Frontend:** React · Vite · Recharts · Mermaid.js · Lucide React

**AI:** Gemini 2.0 Flash (optional) · Local TF-IDF agent (built-in)

---

## License

MIT · Built for iTech AI Innovation Hackathon 2026
