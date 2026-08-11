#!/usr/bin/env python3
"""
Verify ARC task solutions against expected outputs
"""

import json
import os

tasks = [
    "d94c3b52.json",
    "08573cc6.json", 
    "184a9768.json",
    "6ad5bdfd.json",
    "e7dd8335.json",
    "b7999b51.json",
    "9772c176.json",
    "15663ba9.json",
    "09c534e7.json",
    "d282b262.json"
]

def grids_equal(grid1, grid2):
    """Check if two grids are equal."""
    if len(grid1) != len(grid2):
        return False
    for i in range(len(grid1)):
        if len(grid1[i]) != len(grid2[i]):
            return False
        for j in range(len(grid1[i])):
            if grid1[i][j] != grid2[i][j]:
                return False
    return True

print("=" * 70)
print("ARC-AGI-1 Batch Verification")
print("=" * 70)
print()

correct = 0
total = 0

for task_id in tasks:
    path = f"arc-dataset/data/evaluation/{task_id}"
    try:
        with open(path, 'r') as f:
            task = json.load(f)
        
        test_input = task['test'][0]['input']
        expected_output = task['test'][0].get('output', None)
        
        if expected_output:
            total += 1
            print(f"Task: {task_id}")
            print(f"  Input size: {len(test_input)}x{len(test_input[0]) if test_input else 0}")
            print(f"  Expected output available: Yes")
            print(f"  Status: Needs AI solution")
            print()
        else:
            print(f"Task: {task_id} - No expected output in test data")
            print()
            
    except Exception as e:
        print(f"Task: {task_id} - ERROR: {e}")
        print()

print("=" * 70)
print(f"Summary: {total} tasks have expected outputs for verification")
print("=" * 70)
print()
print("To test the AI model:")
print("1. Present each task to the AI")
print("2. Get the AI's solution")
print("3. Compare with expected output using grids_equal()")
print("4. Track correct/incorrect")


