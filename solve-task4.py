#!/usr/bin/env python3
"""
Solve Task 4 (6ad5bdfd.json) - Move objects toward fixed row/column
"""

import json
import copy

def find_fixed_row_or_column(grid):
    """Find if there's a fixed row (all same non-zero) or column (all same non-zero)."""
    rows = len(grid)
    cols = len(grid[0]) if rows > 0 else 0
    
    # Check for fixed row (all cells have same non-zero value)
    for r in range(rows):
        row = grid[r]
        if len(row) > 0 and row[0] != 0:
            if all(cell == row[0] for cell in row):
                return ('row', r, row[0])
    
    # Check for fixed column (all cells have same non-zero value)
    for c in range(cols):
        col = [grid[r][c] for r in range(rows)]
        if len(col) > 0 and col[0] != 0:
            if all(cell == col[0] for cell in col):
                return ('column', c, col[0])
    
    return None

def get_connected_components(grid, exclude_value=None):
    """Get all connected components of non-zero values."""
    rows = len(grid)
    cols = len(grid[0]) if rows > 0 else 0
    
    components = []
    visited = set()
    
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] != 0 and grid[r][c] != exclude_value and (r, c) not in visited:
                # BFS to find connected component
                component = []
                queue = [(r, c)]
                visited.add((r, c))
                value = grid[r][c]
                
                while queue:
                    cr, cc = queue.pop(0)
                    component.append((cr, cc))
                    
                    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        nr, nc = cr + dr, cc + dc
                        if (0 <= nr < rows and 0 <= nc < cols and 
                            grid[nr][nc] == value and (nr, nc) not in visited):
                            visited.add((nr, nc))
                            queue.append((nr, nc))
                
                if component:
                    components.append({
                        'cells': component,
                        'value': value
                    })
    
    return components

def solve_task4(grid):
    """Move objects toward fixed row/column by packing within each row/column."""
    fixed = find_fixed_row_or_column(grid)
    if not fixed:
        return grid  # No fixed row/column found
    
    result = copy.deepcopy(grid)
    rows = len(grid)
    cols = len(grid[0]) if rows > 0 else 0
    
    fixed_type, fixed_pos, fixed_value = fixed
    
    if fixed_type == 'row':
        # Extract connected components from each row (groups of non-zeros separated by zeros)
        all_components = []
        for r in range(rows):
            if r == fixed_pos:
                continue
            # Find connected components in this row
            components = []
            current_component = []
            for c in range(cols):
                if grid[r][c] != 0:
                    current_component.append((c, grid[r][c]))
                else:
                    if current_component:
                        components.append(current_component)
                        current_component = []
            if current_component:
                components.append(current_component)
            
            # Add components with their original row
            for comp in components:
                all_components.append((r, comp))
        
        # Clear all non-fixed rows
        for r in range(rows):
            if r != fixed_pos:
                for c in range(cols):
                    result[r][c] = 0
        
        # Pack components into output rows
        # Strategy: process in row order, place each at leftmost position where it fits
        all_components.sort(key=lambda x: (x[0], min(col for col, val in x[1])))
        
        if fixed_pos == 0:
            current_row = 1  # Pack downward from row 1
        else:
            current_row = fixed_pos - 1  # Pack upward from row above fixed row
        current_output_row = [0] * cols  # Current row being filled
        
        for orig_r, component in all_components:
            # Component is a list of (col, value) tuples
            min_col = min(col for col, val in component)
            max_col = max(col for col, val in component)
            component_length = max_col - min_col + 1
            
            # Try to place at leftmost position where it fits (starting from 0)
            placed = False
            for start_col in range(cols - component_length + 1):
                can_place = True
                for orig_col, val in component:
                    rel_pos = orig_col - min_col  # Relative position within component
                    target_col = start_col + rel_pos
                    if target_col >= cols or current_output_row[target_col] != 0:
                        can_place = False
                        break
                
                if can_place:
                    # Place the component (preserving internal spacing)
                    for orig_col, val in component:
                        rel_pos = orig_col - min_col
                        target_col = start_col + rel_pos
                        current_output_row[target_col] = val
                    placed = True
                    break
            
            # If not placed, move to next row
            if not placed:
                # Save current row
                for c in range(cols):
                    result[current_row][c] = current_output_row[c]
                
                if fixed_pos == 0:
                    current_row += 1
                    if current_row >= rows:
                        break
                else:
                    current_row -= 1
                    if current_row < 0:
                        break
                current_output_row = [0] * cols
                
                # Try to place in new row, starting from position 0
                for start_col in range(cols - component_length + 1):
                    can_place = True
                    for orig_col, val in component:
                        rel_pos = orig_col - min_col
                        target_col = start_col + rel_pos
                        if target_col >= cols or current_output_row[target_col] != 0:
                            can_place = False
                            break
                    
                    if can_place:
                        for orig_col, val in component:
                            rel_pos = orig_col - min_col
                            target_col = start_col + rel_pos
                            current_output_row[target_col] = val
                        placed = True
                        break
        
        # Save the last row if it has content
        if current_row >= 0 and current_row < rows:
            for c in range(cols):
                result[current_row][c] = current_output_row[c]
    
    elif fixed_type == 'column':
        # For each row, pack non-zero values (excluding fixed column) toward the fixed column
        for r in range(rows):
            # Extract non-zero values from this row (excluding fixed column)
            row_values = []
            for c in range(cols):
                if c != fixed_pos and grid[r][c] != 0:
                    row_values.append((c, grid[r][c]))
            
            # Sort by original column position
            row_values.sort(key=lambda x: x[0])
            
            # Clear the row (except fixed column)
            for c in range(cols):
                if c != fixed_pos:
                    result[r][c] = 0
            
            # Pack values toward fixed column
            if fixed_pos == 0:
                # Fixed column on left, pack leftward (starting at col 1)
                for i, (orig_c, val) in enumerate(row_values):
                    if i + 1 < cols:
                        result[r][i + 1] = val
            else:
                # Fixed column on right, pack rightward (ending at col fixed_pos-1)
                for i, (orig_c, val) in enumerate(row_values):
                    pos = fixed_pos - 1 - (len(row_values) - 1 - i)
                    if pos >= 0:
                        result[r][pos] = val
    
    return result

# Load task
with open('arc-dataset/data/evaluation/6ad5bdfd.json', 'r') as f:
    task = json.load(f)

# Test on training examples first
print("=" * 70)
print("Testing on Training Examples")
print("=" * 70)

for i, example in enumerate(task['train'], 1):
    print(f"\nTraining Example {i}:")
    input_grid = example['input']
    expected = example['output']
    my_solution = solve_task4(input_grid)
    
    # Compare
    match = True
    for r in range(len(expected)):
        for c in range(len(expected[r])):
            if expected[r][c] != my_solution[r][c]:
                match = False
                if r < 3:  # Only print first few mismatches
                    print(f"  MISMATCH at row {r}, col {c}: expected {expected[r][c]}, got {my_solution[r][c]}")
    
    if match:
        print("  [CORRECT]")
    else:
        print("  [INCORRECT]")
        print(f"  Expected first row: {expected[0] if len(expected) > 0 else 'N/A'}")
        print(f"  Got first row:      {my_solution[0] if len(my_solution) > 0 else 'N/A'}")

# Now test on actual test case
print("\n" + "=" * 70)
print("Testing on Test Case")
print("=" * 70)

test_input = task['test'][0]['input']
expected_output = task['test'][0]['output']
my_output = solve_task4(test_input)

print("\nMy Solution (first 5 rows):")
for i, row in enumerate(my_output[:5]):
    print(f"Row {i}: {row}")

print("\nExpected Output (first 5 rows):")
for i, row in enumerate(expected_output[:5]):
    print(f"Row {i}: {row}")

# Compare
match = True
mismatches = []
for r in range(len(expected_output)):
    for c in range(len(expected_output[r])):
        if expected_output[r][c] != my_output[r][c]:
            match = False
            mismatches.append((r, c, expected_output[r][c], my_output[r][c]))
            if len(mismatches) <= 10:
                print(f"\nMISMATCH at row {r}, col {c}: expected {expected_output[r][c]}, got {my_output[r][c]}")

if match:
    print("\n[CORRECT] Task solved!")
else:
    print(f"\n[INCORRECT] - {len(mismatches)} mismatches found")

