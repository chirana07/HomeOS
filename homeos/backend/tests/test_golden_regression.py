import sys
import os
import unittest

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from observability.cost_engine import cost_engine
from observability.evaluator import evaluator

class TestGoldenRegression(unittest.TestCase):
    def test_cost_engine_calculation(self):
        input_cost, output_cost, cached_cost, total_cost = cost_engine.calculate_cost(
            provider="google",
            model="gemini-2.5-flash",
            prompt_tokens=1000,
            completion_tokens=200,
            cached_tokens=200
        )
        self.assertGreaterThan(total_cost, 0.0)
        self.assertLessThan(total_cost, 0.01)
        self.assertAlmostEqual(input_cost + cached_cost + output_cost, total_cost, places=5)

    def test_arbitrage_savings(self):
        savings = cost_engine.calculate_arbitrage_savings(
            actual_model="gemini-2.5-flash",
            prompt_tokens=2000,
            completion_tokens=500
        )
        self.assertGreaterThan(savings, 0.0)

    def test_llm_judge_evaluator(self):
        scores = evaluator.evaluate_run(
            run_id="test_run_1",
            state={"urgent_foods": ["milk"]},
            estimated_cost=25.0,
            budget=30.0
        )
        self.assertEqual(scores["budget_compliance"], 1.0)
        self.assertGreaterThan(scores["waste_reduction_score"], 0.8)
        self.assertGreaterThan(scores["rag_relevance"], 0.8)

    def assertGreaterThan(self, a, b):
        self.assertTrue(a > b, f"{a} is not greater than {b}")

    def assertLessThan(self, a, b):
        self.assertTrue(a < b, f"{a} is not less than {b}")

if __name__ == "__main__":
    unittest.main()
