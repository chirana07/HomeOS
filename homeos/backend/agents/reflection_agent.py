# reflection_agent.py
import os
import sys
import json
from graph.state import AgentState

# Add parent path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from llm import generate_text

def reflection_agent(state: AgentState):
    """
    Reflection Agent calls gemini-2.5-flash with a strict JSON format constraint.
    """
    prompt_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    prompt_path = os.path.join(prompt_dir, 'prompts', 'reflection.txt')
    system_prompt = "You are the Reflection Agent for HomeOS."
    if os.path.exists(prompt_path):
        with open(prompt_path, 'r', encoding='utf-8') as f:
            system_prompt = f.read()

    budget = state.get("budget", 10000.0)
    estimated_cost = state.get("estimated_cost", 0.0)
    weekly_plan = state.get("weekly_plan", {})
    urgent_foods = state.get("urgent_foods", [])
    retry_count = state.get("retry_count", 0)

    user_content = json.dumps({
        "budget": budget,
        "estimated_cost": estimated_cost,
        "weekly_plan": weekly_plan,
        "urgent_foods": urgent_foods
    }, indent=2)

    # Call Gemini Flash with JSON mode enabled
    decision = generate_text(system_prompt, user_content, temperature=0.1, json_mode=True)
    
    # Strip markdown ticks if returned
    cleaned_decision = decision
    if "```" in decision:
        cleaned_decision = decision.split("```")[1]
        if cleaned_decision.startswith("json"):
            cleaned_decision = cleaned_decision[4:]
        cleaned_decision = cleaned_decision.strip()

    reflection_result = {"status": "FAIL", "score": 50, "reason": "Failed to parse reflection output."}
    parsed = False
    
    try:
        reflection_result = json.loads(cleaned_decision)
        parsed = True
    except Exception as e:
        print(f"Error parsing reflection JSON in agent: {e}")
        # Deterministic Python fallback evaluation in case of API/parsing issues
        cost_ok = estimated_cost <= budget
        urgent_ok = True
        if urgent_foods:
            used_early = False
            for d in ["day_1", "day_2"]:
                day_meals = weekly_plan.get(d, {})
                for meal in day_meals.values():
                    ingredients = [i.lower() for i in meal.get("ingredients_used", [])]
                    if any(u.lower() in ingredients for u in urgent_foods):
                        used_early = True
                        break
            urgent_ok = used_early
            
        status = "PASS" if (cost_ok and urgent_ok) else "FAIL"
        score = 95 if status == "PASS" else 60
        reason = "Python Fallback: plan passes all budget and perishable constraints." if status == "PASS" else "Python Fallback: plan failed budget or perishable timing."
        reflection_result = {"status": status, "score": score, "reason": reason}

    # Safety rule: force PASS if max retries (1) is reached
    if retry_count >= 1:
        reflection_result["status"] = "PASS"
        reflection_result["reason"] = f"Forced PASS (retry limit {retry_count} reached)."

    trace_entry = {
        "agent": "Reflection Agent",
        "input": f"Budget: LKR {budget} | Estimated Cost: LKR {estimated_cost}",
        "decision": cleaned_decision if parsed else f"Python Fallback: {reflection_result}",
        "output": f"Status: {reflection_result.get('status')} | Score: {reflection_result.get('score')} | Reason: {reflection_result.get('reason')}"
    }

    return {
        "reflection_result": reflection_result,
        "retry_count": retry_count + 1 if reflection_result.get("status") == "FAIL" else retry_count,
        "agent_trace": [trace_entry]
    }
