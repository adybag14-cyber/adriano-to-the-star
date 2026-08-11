import json
import copy

task = json.load(open('arc-dataset/data/evaluation/6ad5bdfd.json'))
test = task['test'][0]

# Extract components
all_components = []
rows = len(test['input'])
cols = len(test['input'][0])

for r in range(rows):
    if r == 0:  # Skip fixed row
        continue
    components = []
    current = []
    for c in range(cols):
        if test['input'][r][c] != 0:
            current.append((c, test['input'][r][c]))
        else:
            if current:
                components.append(current)
                current = []
    if current:
        components.append(current)
    
    for comp in components:
        all_components.append((r, comp))

all_components.sort(key=lambda x: x[0])

print("Components in order:")
for orig_r, comp in all_components:
    min_col = min(col for col, val in comp)
    max_col = max(col for col, val in comp)
    print(f"  Row {orig_r}: {comp} (span: {min_col}-{max_col}, length: {max_col-min_col+1})")

print("\nSimulating placement:")
current_output_row = [0] * cols

for orig_r, component in all_components[:5]:  # First 5 components
    min_col = min(col for col, val in component)
    max_col = max(col for col, val in component)
    component_length = max_col - min_col + 1
    
    print(f"\nPlacing component from row {orig_r}: {component}")
    print(f"  Current row state: {current_output_row}")
    
    placed = False
    for start_col in range(cols - component_length + 1):
        can_place = True
        for orig_col, val in component:
            rel_pos = orig_col - min_col
            target_col = start_col + rel_pos
            if target_col >= cols or current_output_row[target_col] != 0:
                can_place = False
                break
        
        if can_place:
            print(f"  Placing at start_col={start_col}")
            for orig_col, val in component:
                rel_pos = orig_col - min_col
                target_col = start_col + rel_pos
                current_output_row[target_col] = val
            placed = True
            print(f"  New row state: {current_output_row}")
            break
    
    if not placed:
        print(f"  Could not place!")

print(f"\nFinal row: {current_output_row}")
print(f"Expected:  {test['output'][1]}")


