# 🏠 HomeOS – Autonomous Household Economic Intelligence Platform

HomeOS is an agentic AI-powered household planning system designed to maximize pantry food utilization, reduce waste, improve nutritional balance, and minimize grocery spending. 

Instead of simple static tracking, HomeOS functions as a smart multi-agent platform utilizing **LangGraph** to coordinate planning, budget validation, and self-correction loops.

---

## 🤖 Agent Workflow Architecture

The platform uses a stateful multi-agent system composed of 8 specialized agents coordinating over a shared state schema:

```
            User Parameters (Budget, Family Size, Inventory)
                                   ↓
                           Coordinator Agent
                                   ↓
                            Inventory Agent
                                   ↓
                              Waste Agent
                                   ↓
                         Recipe Retrieval Agent
                                   ↓
                         ┌→ Meal Planner Agent
                         │         ↓
                         │    Budget Agent
                         │         ↓
                         │  Reflection Agent 
                         │         ├──────────────┐
                         │   FAIL  │  (max 2x)    │ PASS
                         └─────────┘              ▼
                                            Reporting Agent
                                                  ↓
                                                 END
```

1. **Coordinator Agent:** Establishes the primary weekly meal planning objective and parses constraints.
2. **Inventory Agent:** Matches stock list against the SQLite database to retrieve shelf-life metadata and tag expiring items.
3. **Waste Agent:** Evaluates historical waste patterns to label high-risk items.
4. **Recipe Retrieval Agent:** Executes cosine similarity RAG search on the local Qdrant collection to retrieve candidate recipes.
5. **Meal Planner Agent:** Computes recipe scores (40% Inventory + 25% Waste + 20% Nutrition + 15% Cost) and generates a 7-day breakfast/lunch/dinner plan.
6. **Budget Agent:** Resolves pricing for any missing ingredients from `prices.csv` and builds an aggregated shopping list.
7. **Reflection Agent:** Critically audits the plan's budget limits and perishable timing, issuing a `PASS` or `FAIL`.
8. **Reporting Agent:** Compiles execution metrics, formats trace steps, and exports the final plan report to `meal_plan.json`.

---

## 🛠 Tech Stack

* **Backend:** FastAPI, Python, LangGraph, OpenAI (GPT models), SQLite (Local Pantry), Qdrant (Local In-Memory Vector DB).
* **Frontend:** React, TailwindCSS, Vite.

---

## 🚀 Running Locally

Follow these instructions to start the backend and frontend services on your system.

### Prerequisites
* Python 3.12+ (dependencies are compatible up to Python 3.14)
* Node.js (v18+)

### 1. Setup Backend Server

1. Open your terminal and navigate to the project directory:
   ```bash
   cd homeos/backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy the environment variables template and configure your API key:
   ```bash
   cp .env.example .env
   # Open the .env file and set your OPENAI_API_KEY:
   # OPENAI_API_KEY=sk-...
   ```
5. Start the FastAPI application:
   ```bash
   uvicorn app:app --reload
   ```
   The backend API will start running at `http://localhost:8000`. On startup, it will automatically initialize the local SQLite database and index recipes into the local Qdrant vector database.

### 2. Setup React Frontend Client

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd homeos/frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Run the Vite dev server:
   ```bash
   npm run dev
   ```
   The application will start running at `http://localhost:5173`.

### 3. Generate Plans & Inspect Trace
* Open your browser and navigate to `http://localhost:5173`.
* Enter your household budget, family size, and pantry inventory (e.g. `Rice, Carrots, Eggs, Soy Sauce`).
* Click **Generate Economic Plan** to trigger the LangGraph orchestration.
* Check the **Weekly Meal Schedule** and click any Day Card to view detailed meal ingredients, cost, and nutrition.
* Go to the **Agent Trace** page in the sidebar to inspect the inputs, decisions, and output payloads for each of the 8 agents in the pipeline.
