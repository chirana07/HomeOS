-- 1. Trace Runs Summary Table
CREATE TABLE IF NOT EXISTS obs_trace_runs (
    run_id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL,
    user_id VARCHAR(64) DEFAULT 'default_user',
    workflow_name VARCHAR(64) NOT NULL,
    status VARCHAR(20) NOT NULL,
    total_tokens INT DEFAULT 0,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    cached_tokens INT DEFAULT 0,
    total_cost_usd DECIMAL(10, 6) DEFAULT 0.000000,
    estimated_total_cost_usd DECIMAL(10, 6) DEFAULT 0.000000,
    estimated_input_cost_usd DECIMAL(10, 6) DEFAULT 0.000000,
    estimated_output_cost_usd DECIMAL(10, 6) DEFAULT 0.000000,
    provider VARCHAR(32) DEFAULT 'google',
    model VARCHAR(64) DEFAULT 'gemini-2.5-flash',
    pricing_version VARCHAR(32) DEFAULT '2026.07.1',
    calculation_method VARCHAR(64) DEFAULT 'FinOps_Pricing_Engine_Estimate',
    duration_ms INT DEFAULT 0,
    retry_count INT DEFAULT 0,
    langsmith_trace_url TEXT,
    error_message TEXT,
    metadata_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Agent Node Metrics Table
CREATE TABLE IF NOT EXISTS obs_agent_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id VARCHAR(64) NOT NULL,
    agent_name VARCHAR(64) NOT NULL,
    provider VARCHAR(32) DEFAULT 'google',
    model VARCHAR(64) DEFAULT 'gemini-2.5-flash',
    duration_ms INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    prompt_tokens INT DEFAULT 0,
    completion_tokens INT DEFAULT 0,
    tokens_used INT DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0.000000,
    calculation_method VARCHAR(64) DEFAULT 'FinOps_Engine_Telemetry',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(run_id) REFERENCES obs_trace_runs(run_id) ON DELETE CASCADE
);

-- 3. LLM Quality & RAG Evaluation Table
CREATE TABLE IF NOT EXISTS obs_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id VARCHAR(64) NOT NULL,
    eval_name VARCHAR(64) NOT NULL,
    score DECIMAL(4, 2) NOT NULL,
    reason TEXT,
    evaluator_type VARCHAR(32) DEFAULT 'llm_as_a_judge',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(run_id) REFERENCES obs_trace_runs(run_id) ON DELETE CASCADE
);

-- 4. Errors & Exception Log Table
CREATE TABLE IF NOT EXISTS obs_error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id VARCHAR(64),
    component VARCHAR(64) NOT NULL,
    error_type VARCHAR(64) NOT NULL,
    message TEXT NOT NULL,
    stack_trace TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_obs_trace_runs_created ON obs_trace_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_obs_trace_runs_user ON obs_trace_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_obs_agent_metrics_run ON obs_agent_metrics(run_id);
CREATE INDEX IF NOT EXISTS idx_obs_evaluations_run ON obs_evaluations(run_id);
