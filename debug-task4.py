import json
from solve_task4 import solve_task4

task = json.load(open('arc-dataset/data/evaluation/6ad5bdfd.json'))
ex = task['train'][0]
sol = solve_task4(ex['input'])

print('Example 1 - Row 6:')
print(f'Expected: {ex["output"][6]}')
print(f'Got:      {sol[6]}')
print(f'Match: {ex["output"][6] == sol[6]}')

print('\nExample 1 - Row 7:')
print(f'Expected: {ex["output"][7]}')
print(f'Got:      {sol[7]}')
print(f'Match: {ex["output"][7] == sol[7]}')

print('\nExample 1 - Row 8:')
print(f'Expected: {ex["output"][8]}')
print(f'Got:      {sol[8]}')
print(f'Match: {ex["output"][8] == sol[8]}')


