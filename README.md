# HomeOS: Autonomous Household Inventory & Economic Intelligence System

HomeOS is an autonomous household inventory management, meal planning, and financial optimization platform. It combines deterministic data processing (inventory tracking, multi-factor replenishment scoring, recipe scaling, SQLite state synchronization) with generative AI (LangGraph multi-agent planning, Gemini 2.5 Flash, Qdrant vector retrieval RAG, RapidOCR receipt extraction) and an observability suite.

---

## Problem Statement

Household management suffers from systemic economic and operational inefficiencies:
- **Food Waste**: Financial loss from unmonitored expiration dates and misaligned meal schedules.
- **Budget Disconnect**: Grocery purchasing disconnected from active pantry stock, leading to over-purchasing.
- **Manual Overhead**: Friction in manual stock updates, ingredient unit conversions, and receipt logging.
- **Opacity in Automated Planning**: Lack of explainability, cost metrics, and quality validation in AI recommendations.

---

## Core Objectives

- **Spoilage Reduction**: Prioritize near-expiry inventory in meal selection algorithms.
- **Budget Control**: Enforce pre-commit cost limits against market prices before plan finalization.
- **System Observability**: Telemetry tracking, cost estimation per workflow step, and LLM-as-a-Judge evaluations.
- **Frictionless Inventory Ingestion**: Automated receipt parsing using OCR with structured JSON extraction.

---

## Key Features

### 1. Multi-Agent Meal Planning (LangGraph)
An 8-node state machine orchestrating data retrieval, spoilage analysis, vector recipe matching, budget calculations, reflection loops, and output compilation:
- **Coordinator Agent**: Fetches historical meal patterns to prevent repetitive meal planning.
- **Inventory Agent**: Audits active stock levels from SQLite.
- **Waste Agent**: Identifies near-expiry ingredients based on target dates.
- **Recipe Agent**: Queries Qdrant vector database for semantically matched recipes.
- **Meal Planner Agent**: Synthesizes 3-day meal plans matching family size and dietary requirements.
- **Budget Agent**: Calculates replenishment costs using current market price tables.
- **Reflection Agent**: Evaluates plan compliance against budget boundaries and perishable usage.
- **Reporting Agent**: Compiles final execution reports and updates stored plan metrics.

### 2. Semantic Recipe Search & RAG (Qdrant)
- Uses local Qdrant vector database storing 768-dimensional embeddings generated via `gemini-embedding-2`.
- Real-time indexing for user-created recipes with instant vector persistence.
- RAG pipeline prevents hallucinated ingredient quantities by constraining planning candidates to verified recipes.

### 3. Household Shopping Intelligence Engine
- Multi-factor priority scoring algorithm evaluating:
  - Depletion percentage relative to original capacities.
  - High-turnover Sri Lankan household staple weights (rice, oil, spices, eggs, milk).
  - Expiration urgency windows.
  - Replenishment cost calculation based on market unit prices (`prices.csv`).
- Generates categorized priority lists (`Critical`, `Essential`, `Low`) and total estimated replenishment budgets.

### 4. Two-Stage Receipt Parsing (RapidOCR + Gemini)
- Extracts text from scanned receipt images using RapidOCR.
- Falls back to Gemini vision processing when OCR confidence falls below operational thresholds.
- Normalizes unit measurements (e.g., `500g` -> `0.5 kg`, `1L` -> `1000 ml`).
- Web and mobile two-stage confirmation modal for line-item verification before committing to SQLite.

### 5. Mobile Companion & Voice Assistant
- React Native / Expo cross-platform mobile application.
- Voice assistant module (`useVoiceAssistant` hook, modal, and floating control) supporting voice-driven inventory queries, meal completions, and pantry updates.
- Interactive recipe library displaying AI-learned recipe shelves alongside pre-seeded system recipes.

### 6. AI Observability & Telemetry Suite
- Native integration with LangSmith for distributed trace generation.
- Local execution metrics repository tracking latency, retry iterations, and token consumption.
- Cost engine calculating model execution costs.
- Automated LLM-as-a-Judge evaluation evaluating plan feasibility and budget adherence.
- REST endpoints and ReportLab PDF exporter (`/api/v1/observability/cost-report-pdf`).

---

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                             Client Layer                               │
│  ┌───────────────────────────┐          ┌───────────────────────────┐  │
│  │   React / Vite Web App    │          │  React Native / Expo App  │  │
│  └─────────────┬─────────────┘          └─────────────┬─────────────┘  │
└────────────────┼──────────────────────────────────────┼────────────────┘
                 │                                      │
                 └──────────────────┬───────────────────┘
                                    │ HTTP / REST
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            Backend Layer                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    FastAPI Web Application                       │  │
│  │  (/api/plan, /api/receipts, /api/recipes, /api/observability)    │  │
│  └────────────────────────────────┬─────────────────────────────────┘  │
│                                   │                                    │
│        ┌──────────────────────────┴──────────────────────────┐         │
│        ▼                                                     ▼         │
│  ┌───────────────────────────┐             ┌────────────────────────┐  │
│  │  LangGraph StateGraph     │             │  RapidOCR / OCR Engine │  │
│  │  (8-Node Agent Workflow)  │             └────────────────────────┘  │
│  └─────────────┬─────────────┘                                         │
└────────────────┼───────────────────────────────────────────────────────┘
                 │
        ┌────────┴──────────────────────────┬──────────────────────────┐
        ▼                                   ▼                          ▼
┌───────────────┐                   ┌───────────────┐          ┌───────────────┐
│ SQLite DB     │                   │ Qdrant Vector │          │ Google Gemini │
│ (homeos.db)   │                   │ (In-Memory)   │          │ (Flash 2.5)   │
└───────────────┘                   └───────────────┘          └───────────────┘
```

---

## Technology Stack

| Component | Technologies Used |
| :--- | :--- |
| **Backend Framework** | Python 3.12, FastAPI, Uvicorn, Pydantic |
| **Agent Orchestration** | LangGraph, LangChain Core |
| **Primary AI Models** | Google Gemini 2.5 Flash (`gemini-2.5-flash`), Gemini Embeddings (`gemini-embedding-2`) |
| **OCR & Computer Vision** | RapidOCR (`rapidocr_onnxruntime`), OpenCV, Pillow |
| **Databases** | SQLite (Relational), Qdrant (Vector DB) |
| **Observability** | LangSmith Client, ReportLab (PDF Generation), Custom Telemetry Engine |
| **Web Frontend** | React 18, Vite, Vanilla CSS |
| **Mobile Frontend** | React Native, Expo (v52), TypeScript, Lucide React Native |

---

## Repository Structure

```text
AGENTRIX26-TEAM39-Neural-Surge/
├── README.md
└── homeos/
    ├── backend/
    │   ├── app.py                      # FastAPI application entry point & route registration
    │   ├── logger.py                   # Centralized application logging module
    │   ├── llm.py                      # Gemini API wrapper with JSON mode handling
    │   ├── requirements.txt            # Python dependencies
    │   ├── verify_ai.py                # System diagnostic & readiness script
    │   ├── agents/                     # LangGraph individual agent nodes
    │   │   ├── coordinator.py
    │   │   ├── inventory_agent.py
    │   │   ├── waste_agent.py
    │   │   ├── recipe_agent.py
    │   │   ├── meal_planner_agent.py
    │   │   ├── budget_agent.py
    │   │   ├── reflection_agent.py
    │   │   └── reporting_agent.py
    │   ├── data/                       # Authoritative database and dataset files
    │   │   ├── homeos.db               # SQLite database (Inventory, Receipts, MealExecution)
    │   │   ├── meal_plan.json          # Active meal plan state
    │   │   ├── recipes.csv             # Structured recipe dataset
    │   │   ├── prices.csv              # Market price reference database
    │   │   └── recipes_with_embeddings.json
    │   ├── graph/                      # LangGraph state definition & compiled workflow
    │   │   ├── state.py
    │   │   └── workflow.py
    │   ├── observability/              # Telemetry, cost engine, evaluation, and reporting
    │   │   ├── config.py
    │   │   ├── cost_engine.py
    │   │   ├── evaluator.py
    │   │   ├── langsmith_tracer.py
    │   │   ├── report_generator.py
    │   │   ├── database/               # Observability SQLite repository & models
    │   │   ├── dashboard/              # Streamlit observability dashboard definition
    │   │   └── routes/                 # Observability REST router
    │   ├── routes/                     # Primary API feature routers
    │   │   ├── assistant.py
    │   │   ├── plan.py
    │   │   ├── receipts.py
    │   │   └── recipes.py
    │   ├── tools/                      # Database connectors, inventory tool, OCR engine
    │   │   ├── db.py
    │   │   ├── inventory_tool.py
    │   │   ├── ocr_engine.py
    │   │   └── receipt_parser.py
    │   └── vector_db/                  # Qdrant client & vector indexing setup
    │       └── qdrant.py
    ├── frontend/                       # React Web Application
    │   ├── package.json
    │   ├── vite.config.js
    │   └── src/
    │       ├── App.jsx
    │       ├── components/             # Sidebar, ReceiptReviewModal, AddRecipeModal, etc.
    │       ├── context/                # AppContext global state provider
    │       ├── pages/                  # Dashboard, Pantry, Recipes, Receipts, AssistantPage
    │       └── services/               # Axios API client
    └── mobile/                         # React Native / Expo Application
        ├── app.json
        ├── package.json
        ├── tsconfig.json
        ├── app/                        # Expo Router pages ((tabs), day/[id], scanner, shopping-list)
        ├── components/                 # VoiceAssistantModal, VoiceFloatingButton, JudgePanel
        ├── hooks/                      # useVoiceAssistant hook
        ├── context/                    # Mobile AppContext provider
        └── services/                   # Mobile API service integration
```

---

## Installation & Setup Instructions

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm
- Active API Key for Google Gemini (`GEMINI_API_KEY` or `GOOGLE_API_KEY`)

### 1. Environment Configuration

Create a `.env` file in `homeos/backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_API_KEY=your_gemini_api_key_here

# Optional LangSmith Tracing Configuration
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=your_langsmith_api_key_here
LANGCHAIN_PROJECT=HomeOS-Production
```

---

### 2. Backend Setup & Launch

```bash
# Navigate to backend directory
cd homeos/backend

# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Install required dependencies
pip install -r requirements.txt

# Start FastAPI server via Uvicorn
uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

- Server Endpoint: `http://127.0.0.1:8000`
- Interactive OpenAPI Documentation: `http://127.0.0.1:8000/docs`

---

### 3. Frontend Web Setup & Launch

```bash
# Navigate to frontend directory
cd homeos/frontend

# Install node dependencies
npm install

# Start Vite development server
npm run dev
```

- Web Dashboard URL: `http://localhost:5173`

---

### 4. Mobile Application Setup & Launch

```bash
# Navigate to mobile directory
cd homeos/mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

- Press `a` to open in Android Emulator, `i` for iOS Simulator, or scan the QR code via Expo Go app.

---

## Database Schema & Data Persistence

### SQLite Database (`homeos/backend/data/homeos.db`)
The application persists structured relational data in SQLite:
- `Inventory`: Current stock (`ingredient`, `quantity`, `original_quantity`, `unit`, `expiry_date`).
- `MealExecution`: Logged meal completions (`day`, `meal_type`, `recipe_name`, `completed_at`).
- `receipts`: Scanned receipt metadata (`store_name`, `date`, `total_amount`, `raw_text`).
- `receipt_items`: Line items parsed from receipts (`receipt_id`, `item_name`, `quantity`, `unit`, `price`).
- `MealHistory`: Historical record of prepared meals for frequency penalties.
- `waste_history`: Recorded item expiration and spoilage occurrences.
- `monthly_expenses`: Aggregated expenditure metrics.

---

## Core API Endpoints

### Meal Planning API (`/api/plan`)
- `GET /api/plan/` - Retrieves active meal plan enriched with dynamic shopping intelligence and completion flags.
- `POST /api/plan/generate` - Clears past execution states and executes the 8-node LangGraph workflow.
- `POST /api/plan/complete-meal` - Records a completed meal, deducts ingredient quantities from SQLite, and updates agent trace logs.
- `POST /api/plan/undo-meal` - Reverts meal completion and restores ingredient quantities.
- `GET /api/plan/day/{id}` - Fetches detailed meal information for a specific day (Days 1–3).
- `GET /api/plan/trace` - Retrieves step-by-step reasoning logs generated during planning execution.

### Recipes API (`/api/recipes`)
- `GET /api/recipes/` - Fetches stored recipe library.
- `POST /api/recipes/` - Inserts a new recipe into SQLite CSV storage and indexes its vector representation into Qdrant.

### Receipts API (`/api/receipts`)
- `POST /api/receipts/` - Uploads a receipt image/text, executes RapidOCR/Gemini parsing, and returns structured candidate items.
- `POST /api/receipts/confirm` - Confirms user-verified receipt line items and updates SQLite inventory.

### Assistant API (`/api/assistant`)
- `POST /api/assistant/chat` - Processes natural language queries concerning inventory levels, recipes, and meal recommendations.

### Observability API (`/api/v1/observability`)
- `GET /api/v1/observability/summary` - Returns executive metrics for dashboard telemetry.
- `GET /api/v1/observability/engineering` - Returns system latency and trace URL references.
- `GET /api/v1/observability/finops` - Returns token expenditure breakdowns.
- `GET /api/v1/observability/governance` - Returns evaluation scores and compliance logs.
- `GET /api/v1/observability/cost-report-pdf` - Downloads generated PDF cost report binary.

---

## Verification & Testing Instructions

### System Diagnostic Script
Run the automated diagnostic suite in the backend directory:

```bash
cd homeos/backend
python verify_ai.py
```

The script verifies:
1. Gemini API connectivity and embedding generation (`gemini-embedding-2`).
2. Qdrant local vector database collection status.
3. SQLite database table schema integrity (`homeos.db`).
4. LangGraph state graph compilation.

### Automated Test Suite & Compilation Verification
```bash
# Python Compilation Check
python -m compileall homeos/backend

# Frontend Production Build Check
cd homeos/frontend
npm run build

# Mobile TypeScript Type Check
cd homeos/mobile
npx tsc --noEmit
```

---

## Assumptions & Limitations

- **API Dependency**: Generative meal planning and vector embedding generation require an active Google Gemini API key. If disconnected, system fallbacks provide deterministic inventory calculations.
- **Single Household Context**: Current database design optimizes for a single-household instance.

---

## License & Team Information

Built by **Team 39** for **Agentrix 2026**.  
Distributed under standard competition and educational usage guidelines.
