#!/usr/bin/env python3
"""
Systematically analyze 10 ARC tasks and verify solutions
"""

import json
import os
import copy

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

def load_task(task_id):
    path = f"arc-dataset/data/evaluation/{task_id}"
    with open(path, 'r') as f:
        return json.load(f)

results = []

print("=" * 70)
print("ARC-AGI-1 Batch Analysis - 10 Tasks")
print("=" * 70)
print()

for i, task_id in enumerate(tasks, 1):
    print(f"\n{'='*70}")
    print(f"TASK {i}/10: {task_id}")
    print(f"{'='*70}")
    
    try:
        task = load_task(task_id)
        test_input = task['test'][0]['input']
        expected_output = task['test'][0].get('output', None)
        
        print(f"Input size: {len(test_input)}x{len(test_input[0]) if test_input else 0}")
        print(f"Training examples: {len(task['train'])}")
        
        if expected_output:
            print(f"Expected output available: Yes")
            print(f"\nPattern Analysis Needed:")
            print(f"  - Review training examples to identify pattern")
            print(f"  - Apply pattern to test input")
            print(f"  - Verify against expected output")
        else:
            print(f"Expected output: Not in test data")
        
        results.append({
            'task': task_id,
            'has_expected': expected_output is not None,
            'status': 'needs_analysis'
        })
        
    except Exception as e:
        print(f"ERROR: {e}")
        results.append({
            'task': task_id,
            'error': str(e)
        })

print(f"\n{'='*70}")
print("Summary")
print(f"{'='*70}")
print(f"Total tasks: {len(tasks)}")
print(f"Tasks with expected outputs: {sum(1 for r in results if r.get('has_expected', False))}")
print(f"\nNext: Analyze each task's pattern and provide solutions")


