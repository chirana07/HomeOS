import os
import json
from typing import Dict, Any, Tuple

PRICING_CATALOG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "pricing_catalog.json")

class CostEngine:
    def __init__(self, catalog_path: str = PRICING_CATALOG_PATH):
        self.catalog_path = catalog_path
        self.catalog = self._load_catalog()

    def _load_catalog(self) -> Dict[str, Any]:
        if os.path.exists(self.catalog_path):
            try:
                with open(self.catalog_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Warning: Failed to load pricing catalog: {e}")
        
        # Fallback pricing matrix
        return {
            "version": "2026.07.1-fallback",
            "providers": {
                "google": {
                    "gemini-2.5-flash": {"input_per_1k": 0.000075, "output_per_1k": 0.000300, "cached_input_per_1k": 0.00001875},
                    "gemini-embedding-2": {"input_per_1k": 0.000020, "output_per_1k": 0.0, "cached_input_per_1k": 0.0}
                },
                "openai": {
                    "gpt-4o-mini": {"input_per_1k": 0.000150, "output_per_1k": 0.000600, "cached_input_per_1k": 0.000075},
                    "gpt-4o": {"input_per_1k": 0.002500, "output_per_1k": 0.010000, "cached_input_per_1k": 0.001250}
                }
            }
        }

    def calculate_cost(
        self,
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        cached_tokens: int = 0
    ) -> Tuple[float, float, float, float]:
        """
        Calculates input_cost, output_cost, cached_cost, and total_cost in USD.
        Returns: (input_cost, output_cost, cached_cost, total_cost)
        """
        provider_data = self.catalog.get("providers", {}).get(provider.lower(), {})
        model_rates = provider_data.get(model.lower(), {})

        if not model_rates:
            # Default rate if model is unknown
            model_rates = {"input_per_1k": 0.000100, "output_per_1k": 0.000400, "cached_input_per_1k": 0.000025}

        input_rate = model_rates.get("input_per_1k", 0.000100) / 1000.0
        output_rate = model_rates.get("output_per_1k", 0.000400) / 1000.0
        cached_rate = model_rates.get("cached_input_per_1k", input_rate * 0.25) / 1000.0

        uncached_prompt_tokens = max(0, prompt_tokens - cached_tokens)

        input_cost = uncached_prompt_tokens * input_rate
        cached_cost = cached_tokens * cached_rate
        output_cost = completion_tokens * output_rate
        total_cost = input_cost + cached_cost + output_cost

        return round(input_cost, 6), round(output_cost, 6), round(cached_cost, 6), round(total_cost, 6)

    def calculate_arbitrage_savings(
        self,
        actual_model: str,
        prompt_tokens: int,
        completion_tokens: int,
        cached_tokens: int = 0
    ) -> float:
        """
        Calculates savings comparing actual model cost against baseline high-cost model (gpt-4o).
        """
        _, _, _, actual_cost = self.calculate_cost("google" if "gemini" in actual_model else "openai", actual_model, prompt_tokens, completion_tokens, cached_tokens)
        _, _, _, gpt4o_cost = self.calculate_cost("openai", "gpt-4o", prompt_tokens, completion_tokens, cached_tokens)
        
        savings = max(0.0, gpt4o_cost - actual_cost)
        return round(savings, 6)

cost_engine = CostEngine()
