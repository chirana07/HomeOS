import os
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(dotenv_path=dotenv_path)

class ObservabilitySettings:
    def __init__(self):
        # LangSmith Config
        api_key = os.getenv("LANGCHAIN_API_KEY", "")
        self.LANGCHAIN_API_KEY: str = api_key
        self.LANGCHAIN_TRACING_V2: str = os.getenv("LANGCHAIN_TRACING_V2", "true") if api_key else "false"
        self.LANGCHAIN_PROJECT: str = os.getenv("LANGCHAIN_PROJECT", "homeos-economic-intelligence")
        self.LANGSMITH_ENDPOINT: str = os.getenv("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")

        # Governance & Metadata
        self.ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
        self.WORKFLOW_VERSION: str = "v1.0.0"
        self.PROMPT_VERSION: str = "v1.2.0"
        self.MODEL_VERSION: str = os.getenv("MODEL_VERSION", "gemini-2.5-flash")
        self.GIT_COMMIT: str = os.getenv("GIT_COMMIT", "b8f3a9e")
        self.DATASET_VERSION: str = "golden_v1.0"

        # Financial & Guardrails
        self.DAILY_BUDGET_CAP_USD: float = float(os.getenv("DAILY_BUDGET_CAP_USD", "5.00"))
        
        # Database Config
        self.OBS_DB_PATH: str = os.getenv("OBS_DB_PATH", os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "homeos.db"))

        # Export to os.environ only if API key exists
        os.environ["LANGCHAIN_TRACING_V2"] = self.LANGCHAIN_TRACING_V2
        if self.LANGCHAIN_API_KEY:
            os.environ["LANGCHAIN_API_KEY"] = self.LANGCHAIN_API_KEY
            os.environ["LANGCHAIN_PROJECT"] = self.LANGCHAIN_PROJECT
            os.environ["LANGSMITH_ENDPOINT"] = self.LANGSMITH_ENDPOINT
        else:
            os.environ["LANGCHAIN_TRACING_V2"] = "false"

settings = ObservabilitySettings()
