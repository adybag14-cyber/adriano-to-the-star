import json

task = json.load(open('arc-dataset/data/evaluation/6ad5bdfd.json'))
ex = task['train'][0]

print("Example 1 - Sequence Extraction:")
print("\nInput sequences (preserving relative positions):")

def extract_sequence(row):
    """Extract non-zero values with their relative positions."""
    seq = []
    for i, val in enumerate(row):
        if val != 0:
            seq.append((i, val))
    return seq

rows_with_data = []
for r in range(len(ex['input']) - 1):  # Exclude fixed row
    row = ex['input'][r]
    seq = extract_sequence(row)
    if seq:
        rows_with_data.append((r, seq, row))

for r, seq, full_row in rows_with_data:
    print(f"  Row {r}: positions={seq}, full={full_row}")

print("\nOutput analysis:")
print("  Row 6: [3, 0, 0, 4, 8, 8]")
print("    - Contains row 1's [3, 0, 0, 4] at positions 0-3")
print("    - Contains row 0's [8, 8] at positions 4-5")
print("\n  Row 7: [3, 0, 0, 4, 0, 6]")
print("    - Contains row 2's [3, 0, 0, 4] at positions 0-3")
print("    - Contains row 3's [6] at position 5")
print("\n  Row 8: [1, 1, 5, 5, 0, 6]")
print("    - Contains row 4's [1, 1] at positions 0-1")
print("    - Contains row 6's [5, 5] at positions 2-3")
print("    - Contains row 4's [6] at position 5")

print("\nPattern: Extract sequences preserving relative positions, then pack them row by row!")


