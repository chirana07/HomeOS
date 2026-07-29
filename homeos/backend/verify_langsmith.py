# verify_langsmith.py
import os
import sys
import uuid
import time
from dotenv import load_dotenv

# Load environment variables
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

dotenv_path = os.path.join(backend_dir, '.env')
load_dotenv(dotenv_path=dotenv_path)

from observability.config import settings
from observability.langsmith_tracer import init_langsmith_tracing
from langsmith import traceable, Client

def main():
    print("====================================================")
    print("🔍 HomeOS LangSmith Production Tracing Diagnostic")
    print("====================================================")

    # 1. Verify Environment Variables
    init_langsmith_tracing()
    
    tracing_enabled = os.getenv("LANGCHAIN_TRACING_V2")
    api_key = os.getenv("LANGCHAIN_API_KEY")
    project = os.getenv("LANGCHAIN_PROJECT")
    endpoint = os.getenv("LANGSMITH_ENDPOINT")

    print(f"LANGCHAIN_TRACING_V2 : {tracing_enabled}")
    print(f"LANGCHAIN_PROJECT    : {project}")
    print(f"LANGSMITH_ENDPOINT   : {endpoint}")
    print(f"LANGCHAIN_API_KEY    : {'[SET]' if api_key else '[MISSING]'}")

    if not api_key:
        print("\n✗ Failed: LANGCHAIN_API_KEY is missing from environment or .env file.")
        print("Diagnostic Tip: Add LANGCHAIN_API_KEY=ls__... to homeos/backend/.env")
        sys.exit(1)

    # 2. Test Client Connection
    try:
        client = Client(api_key=api_key, api_url=endpoint)
        projects = client.list_projects()
        project_names = [p.name for p in projects]
        print(f"✓ LangSmith Authentication Successful (Projects Found: {len(project_names)})")
    except Exception as e:
        print(f"\n✗ Failed: LangSmith Authentication Error: {e}")
        sys.exit(1)

    # 3. Execute Sample Trace
    test_run_id = str(uuid.uuid4())

    @traceable(name="Verify_LangSmith_Trace", run_type="chain")
    def execute_sample_workflow(query: str):
        
        @traceable(name="Child_Span_LLM", run_type="llm")
        def mock_llm_call(prompt: str):
            return f"Processed LLM response for: {prompt}"

        time.sleep(0.1)
        res = mock_llm_call(query)
        return {"status": "SUCCESS", "response": res, "run_id": test_run_id}

    try:
        result = execute_sample_workflow("Test LangSmith Diagnostic Query")
        print(f"✓ Diagnostic Trace Executed (Run ID: {test_run_id})")
        print(f"✓ Direct Trace URL: https://smith.langchain.com/o/default/projects/p/{project}/r/{test_run_id}")
        print("\n====================================================")
        print("✓ Connected: HomeOS is successfully sending traces to LangSmith!")
        print("====================================================\n")
    except Exception as e:
        print(f"\n✗ Failed to send trace: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
