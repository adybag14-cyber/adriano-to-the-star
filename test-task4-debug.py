import json
import sys
sys.path.insert(0, '.')
from solve_task4 import solve_task4

task = json.load(open('arc-dataset/data/evaluation/6ad5bdfd.json'))
ex = task['train'][0]
sol = solve_task4(ex['input'])

print('Training Example 1 - Row by row comparison:')
for r in [6, 7, 8]:
    expected = ex['output'][r]
    got = sol[r]
    match = expected == got
    status = "OK" if match else "MISMATCH"
    print(f'\nRow {r}: {status}')
    print(f'  Expected: {expected}')
    print(f'  Got:      {got}')


