#!/usr/bin/env python3
"""
Solve Task 5 (e7dd8335.json) - Bottom half of rectangles become 2
"""

import json
import copy

def find_rectangles(grid):
    """Find all rectangles made of 1s in the grid."""
    rows = len(grid)
    cols = len(grid[0]) if rows > 0 else 0
    
    rectangles = []
    
    # Find all connected components of 1s
    visited = set()
    
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1 and (r, c) not in visited:
                # BFS to find all connected 1s
                component = []
                queue = [(r, c)]
                visited.add((r, c))
                
                while queue:
                    cr, cc = queue.pop(0)
                    component.append((cr, cc))
                    
                    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        nr, nc = cr + dr, cc + dc
                        if (0 <= nr < rows and 0 <= nc < cols and 
                            grid[nr][nc] == 1 and (nr, nc) not in visited):
                            visited.add((nr, nc))
                            queue.append((nr, nc))
                
                if component:
                    # Find bounding box
                    min_r = min(r for r, c in component)
                    max_r = max(r for r, c in component)
                    min_c = min(c for r, c in component)
                    max_c = max(c for r, c in component)
                    
                    # Check if it's a rectangle (all cells in bounding box are 1s or 0s)
                    # For now, let's assume any connected component is a rectangle
                    rectangles.append({
                        'min_r': min_r,
                        'max_r': max_r,
                        'min_c': min_c,
                        'max_c': max_c,
                        'cells': component
                    })
    
    return rectangles

def solve_task5(grid):
    """Apply the pattern: bottom half of rectangles become 2."""
    result = copy.deepcopy(grid)
    rectangles = find_rectangles(grid)
    
    # Merge rectangles that are close together (same shape)
    # For now, process each rectangle separately
    for rect in rectangles:
        top_row = rect['min_r']
        bottom_row = rect['max_r']
        height = bottom_row - top_row + 1
        
        if height < 2:
            continue  # Skip very small rectangles
        
        # Bottom half starts from the middle
        # If height is 6, bottom half is rows 3-5 (0-indexed from rectangle start)
        # So in absolute terms: top_row + height//2 to bottom_row
        bottom_half_start = top_row + (height // 2)
        
        # Replace all 1s in bottom half with 2s
        # Check all cells in the rectangle's bounding box, not just the component
        for r in range(bottom_half_start, bottom_row + 1):
            for c in range(rect['min_c'], rect['max_c'] + 1):
                if result[r][c] == 1:
                    result[r][c] = 2
    
    # Also handle the case where there might be a single large rectangle
    # Let's find the overall bounding box of all 1s
    all_ones = []
    for r in range(len(grid)):
        for c in range(len(grid[r])):
            if grid[r][c] == 1:
                all_ones.append((r, c))
    
    if all_ones:
        min_r = min(r for r, c in all_ones)
        max_r = max(r for r, c in all_ones)
        height = max_r - min_r + 1
        
        if height >= 2:
            bottom_half_start = min_r + (height // 2)
            # Replace all 1s in bottom half
            for r in range(bottom_half_start, max_r + 1):
                for c in range(len(grid[r])):
                    if result[r][c] == 1:
                        result[r][c] = 2
    
    return result

# Load task
with open('arc-dataset/data/evaluation/e7dd8335.json', 'r') as f:
    task = json.load(f)

# Test on training examples first
print("=" * 70)
print("Testing on Training Examples")
print("=" * 70)

for i, example in enumerate(task['train'], 1):
    print(f"\nTraining Example {i}:")
    input_grid = example['input']
    expected = example['output']
    my_solution = solve_task5(input_grid)
    
    # Compare
    match = True
    for r in range(len(expected)):
        for c in range(len(expected[r])):
            if expected[r][c] != my_solution[r][c]:
                match = False
                print(f"  MISMATCH at row {r}, col {c}: expected {expected[r][c]}, got {my_solution[r][c]}")
    
    if match:
        print("  [CORRECT]")
    else:
        print("  [INCORRECT]")
        print(f"  Expected row 3: {expected[3][:10] if len(expected) > 3 else 'N/A'}")
        print(f"  Got row 3:      {my_solution[3][:10] if len(my_solution) > 3 else 'N/A'}")

# Now test on actual test case
print("\n" + "=" * 70)
print("Testing on Test Case")
print("=" * 70)

test_input = task['test'][0]['input']
expected_output = task['test'][0]['output']
my_output = solve_task5(test_input)

print("\nMy Solution:")
for i, row in enumerate(my_output):
    print(f"Row {i}: {row}")

print("\nExpected Output:")
for i, row in enumerate(expected_output):
    print(f"Row {i}: {row}")

# Compare
match = True
for r in range(len(expected_output)):
    for c in range(len(expected_output[r])):
        if expected_output[r][c] != my_output[r][c]:
            match = False
            print(f"\nMISMATCH at row {r}, col {c}: expected {expected_output[r][c]}, got {my_output[r][c]}")

if match:
    print("\n[CORRECT] Task solved!")
else:
    print("\n[INCORRECT] - need to refine the algorithm")

