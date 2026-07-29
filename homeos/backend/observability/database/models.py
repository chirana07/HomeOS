from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class TraceRunModel(Base):
    __tablename__ = "obs_trace_runs"

    run_id = Column(String(64), primary_key=True)
    session_id = Column(String(64), nullable=False)
    user_id = Column(String(64), default="default_user")
    workflow_name = Column(String(64), nullable=False)
    status = Column(String(20), nullable=False)
    total_tokens = Column(Integer, default=0)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    cached_tokens = Column(Integer, default=0)
    total_cost_usd = Column(Float, default=0.0)
    estimated_total_cost_usd = Column(Float, default=0.0)
    estimated_input_cost_usd = Column(Float, default=0.0)
    estimated_output_cost_usd = Column(Float, default=0.0)
    provider = Column(String(32), default="google")
    model = Column(String(64), default="gemini-2.5-flash")
    pricing_version = Column(String(32), default="2026.07.1")
    calculation_method = Column(String(64), default="FinOps_Pricing_Engine_Estimate")
    duration_ms = Column(Integer, default=0)
    retry_count = Column(Integer, default=0)
    langsmith_trace_url = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AgentMetricModel(Base):
    __tablename__ = "obs_agent_metrics"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(64), ForeignKey("obs_trace_runs.run_id", ondelete="CASCADE"), nullable=False)
    agent_name = Column(String(64), nullable=False)
    provider = Column(String(32), default="google")
    model = Column(String(64), default="gemini-2.5-flash")
    duration_ms = Column(Integer, nullable=False)
    status = Column(String(20), nullable=False)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    tokens_used = Column(Integer, default=0)
    cost_usd = Column(Float, default=0.0)
    calculation_method = Column(String(64), default="FinOps_Engine_Telemetry")
    created_at = Column(DateTime, default=datetime.utcnow)

class EvaluationModel(Base):
    __tablename__ = "obs_evaluations"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(64), ForeignKey("obs_trace_runs.run_id", ondelete="CASCADE"), nullable=False)
    eval_name = Column(String(64), nullable=False)
    score = Column(Float, nullable=False)
    reason = Column(Text, nullable=True)
    evaluator_type = Column(String(32), default="llm_as_a_judge")
    created_at = Column(DateTime, default=datetime.utcnow)

class ErrorLogModel(Base):
    __tablename__ = "obs_error_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    run_id = Column(String(64), nullable=True)
    component = Column(String(64), nullable=False)
    error_type = Column(String(64), nullable=False)
    message = Column(Text, nullable=False)
    stack_trace = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
