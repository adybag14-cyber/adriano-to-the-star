import json
from solve_task4 import solve_task4

task = json.load(open('arc-dataset/data/evaluation/6ad5bdfd.json'))
ex = task['train'][0]
sol = solve_task4(ex['input'])

print("Training Example 1 - Full comparison:")
for r in range(len(ex['output'])):
    expected = ex['output'][r]
    got = sol[r]
    match = expected == got
    status = "OK" if match else "MISMATCH"
    print(f"Row {r}: {status}")
    if not match:
        print(f"  Expected: {expected}")
        print(f"  Got:      {got}")


