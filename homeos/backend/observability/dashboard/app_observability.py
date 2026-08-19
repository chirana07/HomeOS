import os
import sys
import requests
import streamlit as st
import pandas as pd
from typing import Any, List, Optional

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from observability.config import settings
from observability.report_generator import report_generator

st.set_page_config(
    page_title="HomeOS AI Platform Observability & FinOps Suite",
    page_icon="🛡️",
    layout="wide"
)

# ==========================================
# DEFENSIVE HELPER UTILITIES
# ==========================================

def safe_dataframe(data: Any, expected_columns: List[str]) -> pd.DataFrame:
    """
    Creates a guaranteed valid DataFrame with expected columns explicitly defined,
    even if the input data is None, empty list [], or empty dict {}.
    """
    if data is None:
        return pd.DataFrame(columns=expected_columns)
    
    try:
        if isinstance(data, pd.DataFrame):
            df = data.copy()
        elif isinstance(data, (list, dict)):
            if not data:
                return pd.DataFrame(columns=expected_columns)
            df = pd.DataFrame(data)
        else:
            return pd.DataFrame(columns=expected_columns)
    except Exception:
        return pd.DataFrame(columns=expected_columns)

    # Ensure all expected columns exist
    for col in expected_columns:
        if col not in df.columns:
            df[col] = None

    return df[expected_columns]

def has_columns(df: pd.DataFrame, required_columns: List[str]) -> bool:
    """
    Checks if a DataFrame is non-empty and contains all required columns.
    """
    if df is None or df.empty:
        return False
    return all(col in df.columns for col in required_columns)

def empty_chart(message: str = "No telemetry data available yet. Execute a HomeOS workflow to populate metrics."):
    """
    Renders a friendly info banner instead of attempting to draw a blank or broken chart.
    """
    st.info(f"📊 {message}")

def safe_metric(label: str, value: Any, format_str: str = "{}"):
    """
    Renders a Streamlit metric cleanly without throwing formatting exceptions on None/NaN.
    """
    if value is None or (isinstance(value, float) and (pd.isna(value) or str(value) == 'nan')):
        formatted_val = "N/A"
    else:
        try:
            formatted_val = format_str.format(value)
        except Exception:
            formatted_val = str(value)
    st.metric(label, formatted_val)

# API Fetcher
API_BASE_URL = os.getenv("OBS_API_URL", "http://localhost:8000/api/v1/observability")

def fetch_api(endpoint: str) -> Optional[dict]:
    try:
        res = requests.get(f"{API_BASE_URL}/{endpoint}", timeout=3.0)
        if res.status_code == 200:
            data = res.json()
            if isinstance(data, dict):
                return data
    except Exception:
        pass
    return None

# App Header
st.title("🛡️ HomeOS Enterprise AI Platform Observability & FinOps Suite")
st.caption(f"Environment: **{settings.ENVIRONMENT.upper()}** | Workflow: **{settings.WORKFLOW_VERSION}** | Model: **{settings.MODEL_VERSION}** | Commit: **{settings.GIT_COMMIT}**")

# Fetch data defensively from API or Database Repository direct fallback
exec_data = fetch_api("summary")
eng_data = fetch_api("engineering")
fin_data = fetch_api("finops")
gov_data = fetch_api("governance")

# Fallback direct call if FastAPI server is offline
if not exec_data:
    try:
        from observability.database.repository import ObservabilityRepository
        exec_data = ObservabilityRepository.get_executive_summary()
        eng_data = ObservabilityRepository.get_engineering_metrics()
        fin_data = ObservabilityRepository.get_finops_metrics()
        gov_data = ObservabilityRepository.get_governance_metrics()
    except Exception:
        exec_data = {
            "today_requests": 0, "today_cost_usd": 0.0, "avg_latency_ms": 0.0,
            "success_rate_pct": 100.0, "monthly_projected_usd": 0.0,
            "top_model": settings.MODEL_VERSION, "top_agent": "Coordinator",
            "cost_per_workflow_usd": 0.0, "daily_trajectory": []
        }
        eng_data = {"agent_nodes": [], "recent_runs": [], "total_retries": 0}
        fin_data = {"total_spend_usd": 0.0, "agent_costs": [], "cache_efficiency_pct": 0.0, "cost_per_10k_requests_usd": 0.0, "model_spend": []}
        gov_data = {"Prompt Version": settings.PROMPT_VERSION, "Model Version": settings.MODEL_VERSION, "Workflow Version": settings.WORKFLOW_VERSION, "Git Commit": settings.GIT_COMMIT, "evaluation_scores": {}}

# FIRST-RUN UX BANNER
total_reqs = exec_data.get("today_requests", 0) if exec_data else 0
if total_reqs == 0:
    st.markdown("""
> [!NOTE]
> ### 🚀 Welcome to HomeOS Enterprise AI Observability
> 
> No workflow telemetry has been collected yet.
> 
> **To populate this dashboard:**
> 1. Start the FastAPI backend (`python homeos/backend/app.py`)
> 2. Generate a meal plan (`POST /api/plan/generate`)
> 3. Upload a receipt or trigger assistant audio
> 4. Execute any LangGraph workflow
> 
> *After the first execution, the Executive, Engineering, FinOps, and Governance dashboards will populate automatically.*
""")

# Tabs Layout
tab1, tab2, tab3, tab4 = st.tabs([
    "📊 Executive Overview",
    "⚡ Engineering & Traces",
    "💰 FinOps & Cost Report",
    "🏛️ AI Governance & Lineage"
])

# ==========================================
# TAB 1: EXECUTIVE OVERVIEW
# ==========================================
with tab1:
    st.header("Executive Dashboard")

    col1, col2, col3, col4 = st.columns(4)
    with col1:
        safe_metric("Today's Workflows", exec_data.get("today_requests", 0))
    with col2:
        safe_metric("Today's Spend (USD)", exec_data.get("today_cost_usd", 0.0), "${:.4f}")
    with col3:
        safe_metric("Avg Latency", exec_data.get("avg_latency_ms", 0.0), "{:.1f} ms")
    with col4:
        safe_metric("Success Rate", exec_data.get("success_rate_pct", 100.0), "{:.1f}%")

    st.markdown("---")
    ec1, ec2, ec3 = st.columns(3)
    with ec1:
        safe_metric("Projected Monthly Spend", exec_data.get("monthly_projected_usd", 0.0), "${:.2f}")
    with ec2:
        top_ag = exec_data.get("top_agent", "Coordinator")
        safe_metric("Top Utilized Agent", top_ag if isinstance(top_ag, str) else "N/A")
    with ec3:
        safe_metric("Unit Cost / Workflow", exec_data.get("cost_per_workflow_usd", 0.0), "${:.6f}")

    st.subheader("Daily Request & Cost Trajectory")
    daily_traj = exec_data.get("daily_trajectory", [])
    df_exec = safe_dataframe(daily_traj, ["Date", "Spend (USD)", "Requests", "Success Rate"])

    if has_columns(df_exec, ["Date", "Requests", "Spend (USD)"]) and not df_exec.empty and (df_exec["Requests"].sum() > 0 or df_exec["Spend (USD)"].sum() > 0):
        try:
            st.line_chart(df_exec.set_index("Date")[["Requests", "Spend (USD)"]])
        except Exception as e:
            empty_chart(f"Could not render daily trajectory chart: {e}")
    else:
        empty_chart("No daily request or spend telemetry collected yet.")

# ==========================================
# TAB 2: ENGINEERING & TRACES
# ==========================================
with tab2:
    st.header("Engineering & LangGraph Node Execution Traces")

    st.subheader("Agent Node Execution Latency (ms)")
    agent_nodes = eng_data.get("agent_nodes", []) if eng_data else []
    df_nodes = safe_dataframe(agent_nodes, ["Agent Node", "Latency (ms)", "Status", "Cost (USD)", "Tokens"])

    if has_columns(df_nodes, ["Agent Node", "Latency (ms)"]) and not df_nodes.empty:
        try:
            st.bar_chart(df_nodes.set_index("Agent Node")["Latency (ms)"])
        except Exception as e:
            empty_chart(f"Could not render node latency chart: {e}")
    else:
        empty_chart("No agent node latency telemetry recorded yet.")

    st.subheader("Reflection Retry Loops")
    retries = eng_data.get("total_retries", 0) if eng_data else 0
    st.info(f"🔄 Reflection Self-Correction Retries Triggered: **{retries}**")

    st.subheader("Recent Workflow Traces & LangSmith Direct Links")
    recent_runs = eng_data.get("recent_runs", []) if eng_data else []
    df_runs = safe_dataframe(recent_runs, ["Run ID", "Workflow Name", "Status", "Tokens", "Cost (USD)", "Duration (ms)", "Retries", "LangSmith Trace", "Created At"])

    if has_columns(df_runs, ["Run ID", "Status"]) and not df_runs.empty:
        try:
            st.dataframe(
                df_runs,
                column_config={
                    "LangSmith Trace": st.column_config.LinkColumn("LangSmith Trace")
                },
                use_container_width=True
            )
        except Exception:
            st.dataframe(df_runs, use_container_width=True)
    else:
        st.info("No workflow traces recorded yet.")

# ==========================================
# TAB 3: FINOPS & COST REPORT
# ==========================================
with tab3:
    st.header("FinOps Engine & AI Cost Estimation Report")

    fc1, fc2, fc3 = st.columns(3)
    with fc1:
        safe_metric("Total Cumulative Spend", fin_data.get("total_spend_usd", 0.0) if fin_data else 0.0, "${:.6f}")
    with fc2:
        safe_metric("Prompt Cache Efficiency", fin_data.get("cache_efficiency_pct", 0.0) if fin_data else 0.0, "{:.1f}%")
    with fc3:
        safe_metric("Projected Cost / 10,000 Requests", fin_data.get("cost_per_10k_requests_usd", 0.0) if fin_data else 0.0, "${:.2f}")

    st.subheader("Cost Breakdown by Agent Node ($)")
    agent_costs = fin_data.get("agent_costs", []) if fin_data else []
    df_fin = safe_dataframe(agent_costs, ["Agent", "Cost (USD)"])

    if has_columns(df_fin, ["Agent", "Cost (USD)"]) and not df_fin.empty:
        try:
            st.bar_chart(df_fin.set_index("Agent")["Cost (USD)"])
        except Exception as e:
            empty_chart(f"Could not render agent cost chart: {e}")
    else:
        empty_chart("No agent cost telemetry recorded yet.")

    st.markdown("---")

    # ==========================================
    # COST ESTIMATION REPORT GENERATOR SECTION
    # ==========================================
    st.subheader("📄 HomeOS AI Cost Estimation Report")

    report_resp = fetch_api("cost-report")
    if report_resp and "report_data" in report_resp:
        report_data = report_resp["report_data"]
    else:
        report_data = report_generator.get_workflow_cost_report()

    # Executive Summary Metrics for Report
    rc1, rc2, rc3, rc4 = st.columns(4)
    with rc1:
        safe_metric("Workflow Total Tokens", f"{report_data.get('total_estimated_tokens', 0):,}")
    with rc2:
        safe_metric("Workflow Estimated Cost", report_data.get("total_estimated_cost_usd", 0.0), "${:.5f}")
    with rc3:
        safe_metric("Top Expensive Agent", report_data.get("most_expensive_agent", "N/A"))
    with rc4:
        safe_metric("Budget Status", report_data.get("budget_status", "✓ Within Daily Budget"))

    # Agent Breakdown Table
    st.markdown("#### Agent Execution Cost Breakdown")
    agents_list = report_data.get("agents_breakdown", [])
    df_report_agents = safe_dataframe(agents_list, ["agent_name", "provider", "model", "prompt_tokens", "completion_tokens", "total_tokens", "estimated_cost_usd", "calculation_method"])

    if not df_report_agents.empty:
        df_report_display = df_report_agents.rename(columns={
            "agent_name": "Agent Node",
            "provider": "Provider",
            "model": "Model",
            "prompt_tokens": "Input Tokens",
            "completion_tokens": "Output Tokens",
            "total_tokens": "Total Tokens",
            "estimated_cost_usd": "Estimated Cost ($)",
            "calculation_method": "Calculation Method"
        })
        st.dataframe(df_report_display, use_container_width=True)

    # PDF Export & Download Button
    st.markdown("#### Export Cost Report PDF")
    try:
        pdf_bytes = report_generator.generate_pdf_report(report_data)
        st.download_button(
            label="📥 Download Production Cost Report (PDF)",
            data=pdf_bytes,
            file_name=f"HomeOS_AI_Cost_Report_{report_data.get('run_id', 'latest')}.pdf",
            mime="application/pdf"
        )
    except Exception as err:
        st.warning(f"PDF generation unavailable: {err}")

    # ASCII Text Report Expander
    with st.expander("🔍 View Raw ASCII FinOps Report Preview"):
        ascii_text = report_generator.generate_ascii_report(report_data)
        st.code(ascii_text, language="text")

    # Mandatory Disclaimer
    st.caption(f"⚠️ **Important Disclaimer**: {report_data.get('disclaimer', '')}")

# ==========================================
# TAB 4: AI GOVERNANCE & LINEAGE
# ==========================================
with tab4:
    st.header("AI Governance, Lineage & Quality Benchmark")

    gc1, gc2, gc3, gc4 = st.columns(4)
    with gc1:
        safe_metric("Prompt Version", gov_data.get("Prompt Version", settings.PROMPT_VERSION) if gov_data else settings.PROMPT_VERSION)
    with gc2:
        safe_metric("Model Version", gov_data.get("Model Version", settings.MODEL_VERSION) if gov_data else settings.MODEL_VERSION)
    with gc3:
        safe_metric("Workflow Version", gov_data.get("Workflow Version", settings.WORKFLOW_VERSION) if gov_data else settings.WORKFLOW_VERSION)
    with gc4:
        safe_metric("Git Commit Hash", gov_data.get("Git Commit", settings.GIT_COMMIT) if gov_data else settings.GIT_COMMIT)

    st.subheader("LLM-as-a-Judge Quality Benchmark Scores")
    scores = gov_data.get("evaluation_scores", {}) if gov_data else {}
    sc1, sc2, sc3 = st.columns(3)
    with sc1:
        safe_metric("Budget Compliance Score", scores.get("budget_compliance", 1.0) * 100.0, "{:.1f}%")
    with sc2:
        safe_metric("Waste Reduction Index", scores.get("waste_reduction_score", 0.95) * 100.0, "{:.1f}%")
    with sc3:
        safe_metric("RAG Precision / Relevance", scores.get("rag_relevance", 0.92) * 100.0, "{:.1f}%")
