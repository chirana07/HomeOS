# logger.py
import json
import time
import uuid
import traceback
from datetime import datetime

def get_correlation_id() -> str:
    return f"corr_{uuid.uuid4().hex[:8]}"

def log_structured_json(event_name: str, level: str = "INFO", correlation_id: str = None, **kwargs):
    log_payload = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "level": level.upper(),
        "correlation_id": correlation_id or get_correlation_id(),
        "event": event_name
    }
    log_payload.update(kwargs)
    print(f"[JSON_LOG] {json.dumps(log_payload)}")

def log_request_start(method: str, route: str, detail: str = None):
    """
    Logs incoming HTTP request initialization.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print("\n====================================================")
    print("[REQUEST]")
    print(f"{method.upper()} {route}")
    print(f"Timestamp: {timestamp}")
    if detail:
        print(f"Detail: {detail}")
    print("----------------------------------------")
    log_structured_json("http_request_start", method=method, route=route, detail=detail)

def log_workflow_step(step_name: str, result: str, details: list = None):
    """
    Logs an intermediate step milestone during agent/database processing.
    """
    print(f"{step_name}")
    print(f"✓ {result}")
    if details:
        for d in details:
            print(f"  • {d}")
    print("----------------------------------------")
    log_structured_json("workflow_step", step_name=step_name, result=result, details=details)

def log_request_success(execution_time: float, items_updated: int = None, status: str = "SUCCESS"):
    """
    Logs request completion metrics.
    """
    print("Execution Time")
    print(f"{execution_time:.2f} sec\n")
    if items_updated is not None:
        print("Records Updated")
        print(f"{items_updated}\n")
    print("STATUS")
    print(status.upper())
    print("====================================================\n")
    log_structured_json("http_request_success", execution_time_sec=round(execution_time, 3), status=status)

def log_api_request(method: str, route: str, steps: list = None, execution_time: float = 0.0, status: str = "SUCCESS"):
    """
    Backwards-compatible wrapper function for log_api_request.
    """
    log_request_start(method, route)
    if steps:
        for step in steps:
            if isinstance(step, (list, tuple)) and len(step) >= 2:
                log_workflow_step(str(step[0]), str(step[1]))
            else:
                log_workflow_step("Workflow Step", str(step))
    log_request_success(execution_time, status=status)

def log_api_error(method: str, route: str, error: Exception, affected_module: str = "Backend Router", suggested_action: str = None):
    """
    Prints descriptive diagnostics when exceptions occur.
    """
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print("\n====================================================")
    print("[ERROR]")
    print(f"Route: {method.upper()} {route}")
    print(f"Timestamp: {timestamp}")
    print(f"Affected Module: {affected_module}")
    print(f"Exception Details: {str(error)}")
    print("----------------------------------------")
    if suggested_action:
        print(f"• {suggested_action}")
    else:
        print("• Ensure FastAPI backend and SQLite database are accessible.")
        print("• Check environment variables (GEMINI_API_KEY, GROQ_API_KEY).")
    print("====================================================\n")
    log_structured_json("http_request_error", level="ERROR", route=f"{method} {route}", error=str(error), affected_module=affected_module)
