import json

task = json.load(open('arc-dataset/data/evaluation/6ad5bdfd.json'))
ex = task['train'][0]

print("Training Example 1 Analysis:")
print("\nInput rows with data (excluding fixed row 9):")
for i, row in enumerate(ex['input']):
    if i != 9 and any(v != 0 for v in row):
        print(f"  Row {i}: {row}")

print("\nOutput rows 6-8:")
for i in [6, 7, 8]:
    print(f"  Row {i}: {ex['output'][i]}")

print("\nComponent mapping:")
print("Row 6 output: [3, 0, 0, 4, 8, 8]")
print("  - Contains row 1's [3, 0, 0, 4] at positions 0-3")
print("  - Contains row 0's [8, 8] at positions 4-5")
print("\nRow 7 output: [3, 0, 0, 4, 0, 6]")
print("  - Contains row 2's [3, 0, 0, 4] at positions 0-3")
print("  - Contains row 3's [6] at position 5")
print("\nRow 8 output: [1, 1, 5, 5, 0, 6]")
print("  - Contains row 4's [1, 1] at positions 0-1")
print("  - Contains row 6's [5, 5] at positions 2-3")
print("  - Contains row 4's [6] at position 5")

print("\nPattern: Components maintain their internal spacing and are placed")
print("at the leftmost position where they fit, processing rows in order.")

