import json

task = json.load(open('arc-dataset/data/evaluation/6ad5bdfd.json'))
test = task['test'][0]

print("Checking if components with same value are grouped:")
print("\nAll components with value 6:")
all_components = []
for r in range(len(test['input'])):
    if r == 0:
        continue
    components = []
    current = []
    for c in range(len(test['input'][r])):
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

six_components = [(r, comp) for r, comp in all_components if any(val == 6 for _, val in comp)]
print("Components with value 6:")
for r, comp in six_components:
    print(f"  Row {r}: {comp}")

print(f"\nExpected row 1 positions 7-9: {test['output'][1][7:10]}")
print("All three 6s are grouped together at positions 7-9!")

print("\nLet me check the order - maybe components are sorted by value, then by row?")
print("Or maybe same-value components are placed together?")


