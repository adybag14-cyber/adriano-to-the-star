import json

task = json.load(open('arc-dataset/data/evaluation/6ad5bdfd.json'))
test = task['test'][0]

print("Test Case - Component Analysis:")
print("\nExpected Row 1: [3, 0, 3, 3, 0, 7, 0, 6, 6, 6]")
print("\nInput rows and their components:")

for r in [1, 2, 8]:
    row = test['input'][r]
    components = []
    current = []
    for c in range(len(row)):
        if row[c] != 0:
            current.append((c, row[c]))
        else:
            if current:
                components.append(current)
                current = []
    if current:
        components.append(current)
    
    print(f"\nRow {r}: {row}")
    for i, comp in enumerate(components):
        print(f"  Component {i}: {comp}")

print("\nExpected Row 1 breakdown:")
exp1 = test['output'][1]
print(f"  Position 0: {exp1[0]} (from row 8, component [3])")
print(f"  Position 2-3: {exp1[2]}, {exp1[3]} (from row 1, component [3,3])")
print(f"  Position 5: {exp1[5]} (from row 2, component [7])")
print(f"  Position 7-9: {exp1[7]}, {exp1[8]}, {exp1[9]} (from rows 1,2,3/4, component [6]s)")

print("\nPattern: Components are placed sequentially, preserving their internal spacing,")
print("and they're placed at the leftmost position where they fit without overlapping.")


