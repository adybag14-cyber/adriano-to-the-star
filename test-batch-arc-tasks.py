#!/usr/bin/env python3
"""
Test a batch of ARC tasks and verify solutions
"""

import json
import os

# The 10 tasks to test
tasks_to_test = [
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

def load_task(task_id):
    """Load a task from the evaluation set."""
    path = f"arc-dataset/data/evaluation/{task_id}"
    with open(path, 'r') as f:
        return json.load(f)

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

def format_grid_for_display(grid, max_rows=5, max_cols=15):
    """Format grid for display."""
    lines = []
    for i, row in enumerate(grid[:max_rows]):
        row_str = str(row[:max_cols])
        if len(row) > max_cols:
            row_str += "..."
        lines.append(f"  Row {i}: {row_str}")
    if len(grid) > max_rows:
        lines.append(f"  ... ({len(grid)} total rows)")
    return "\n".join(lines)

print("=" * 70)
print("ARC-AGI-1 Batch Test - 10 Tasks")
print("=" * 70)
print()

results = []

for task_id in tasks_to_test:
    print(f"\n{'='*70}")
    print(f"Task: {task_id}")
    print(f"{'='*70}")
    
    try:
        task = load_task(task_id)
        
        # Show training examples
        print(f"\nTraining Examples: {len(task['train'])}")
        for i, example in enumerate(task['train'][:2]):  # Show first 2
            print(f"\nExample {i+1}:")
            print("  Input:")
            print(format_grid_for_display(example['input']))
            print("  Output:")
            print(format_grid_for_display(example['output']))
        
        # Show test input
        test_input = task['test'][0]['input']
        test_expected = task['test'][0].get('output', None)
        
        print(f"\nTest Input:")
        print(format_grid_for_display(test_input))
        
        if test_expected:
            print(f"\nExpected Output (for verification):")
            print(format_grid_for_display(test_expected))
        
        print(f"\n{'─'*70}")
        print("AI Analysis Needed - Present this task to the AI model")
        print(f"{'─'*70}")
        
        results.append({
            'task': task_id,
            'has_expected': test_expected is not None,
            'input_size': (len(test_input), len(test_input[0]) if test_input else 0)
        })
        
    except Exception as e:
        print(f"ERROR loading task: {e}")
        results.append({
            'task': task_id,
            'error': str(e)
        })

print(f"\n{'='*70}")
print("Batch Summary")
print(f"{'='*70}")
print(f"Total tasks: {len(tasks_to_test)}")
print(f"Successfully loaded: {sum(1 for r in results if 'error' not in r)}")
print(f"Tasks with expected outputs: {sum(1 for r in results if r.get('has_expected', False))}")


