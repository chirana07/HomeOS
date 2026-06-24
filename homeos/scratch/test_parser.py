import sys
import os

# Add backend to path so we can import tools
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from tools.receipt_parser import parse_receipt_text

test_text = """
2 buns - 100
2 kg rice - 500
buns 2 - 100
fish 500g - 1200
discount coupon - 50
"""

items, warnings = parse_receipt_text(test_text)
print("Items:")
for i in items:
    print(f"  {i}")
print("Warnings:")
for w in warnings:
    print(f"  {w}")
