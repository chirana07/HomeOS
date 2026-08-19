import os
import time
import uuid
import functools
from typing import Callable, Any, Dict, Optional
from langsmith import traceable, Client
from observability.config import settings
from observability.cost_engine import cost_engine
from observability.database.repository import ObservabilityRepository

def init_langsmith_tracing():
    """
    Export environment variables immediately for native LangSmith auto-tracing.
    """
    if settings.LANGCHAIN_API_KEY:
        os.environ["LANGCHAIN_TRACING_V2"] = "true"
        os.environ["LANGCHAIN_API_KEY"] = settings.LANGCHAIN_API_KEY
        os.environ["LANGCHAIN_PROJECT"] = settings.LANGCHAIN_PROJECT
        os.environ["LANGSMITH_ENDPOINT"] = settings.LANGSMITH_ENDPOINT
    else:
        os.environ["LANGCHAIN_TRACING_V2"] = "false"

# Run initialization immediately on import
init_langsmith_tracing()

def get_trace_url(run_id: str) -> str:
    """
    Generates a direct clickable LangSmith UI trace link.
    """
    project = settings.LANGCHAIN_PROJECT
    return f"https://smith.langchain.com/o/default/projects/p/{project}/r/{run_id}"

def trace_agent_node(agent_name: str):
    """
    Decorator for LangGraph agent nodes creating a child span in LangSmith and persisting internal metrics.
    """
    def decorator(func: Callable):
        @functools.wraps(func)
        def wrapper(state: Dict[str, Any], *args, **kwargs):
            t_start = time.time()
            run_id = state.get("run_id") or str(uuid.uuid4())
            status = "SUCCESS"
            error_msg = ""
            result = None

            try:
                result = func(state, *args, **kwargs)
            except Exception as e:
                status = "FAILED"
                error_msg = str(e)
                raise e
            finally:
                duration_ms = int((time.time() - t_start) * 1000)
                
                # Estimate node tokens & cost
                tokens_used = 250
                _, _, _, cost_usd = cost_engine.calculate_cost(
                    provider="google",
                    model=settings.MODEL_VERSION,
                    prompt_tokens=200,
                    completion_tokens=50
                )
                
                try:
                    ObservabilityRepository.record_agent_metric({
                        "run_id": run_id,
                        "agent_name": agent_name,
                        "duration_ms": duration_ms,
                        "status": status,
                        "tokens_used": tokens_used,
                        "cost_usd": cost_usd
                    })
                except Exception:
                    pass

            return result

        if settings.LANGCHAIN_API_KEY:
            return traceable(name=f"Agent: {agent_name.capitalize()}", run_type="chain")(wrapper)
        return wrapper
    return decorator
