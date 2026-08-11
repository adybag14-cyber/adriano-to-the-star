
def check_balance(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    stack = []
    for i, line in enumerate(lines):
        for j, char in enumerate(line):
            if char in '{[(':
                stack.append((char, i + 1, j + 1))
            elif char in '}])':
                if not stack:
                    print(f"Error: Unmatched {char} at line {i+1}:{j+1}")
                    return
                last, li, lj = stack.pop()
                if (last == '{' and char != '}') or \
                   (last == '[' and char != ']') or \
                   (last == '(' and char != ')'):
                    print(f"Error: Mismatched {last} at {li}:{lj} with {char} at {i+1}:{j+1}")
                    return
    
    if stack:
        print(f"Error: Unclosed pairs: {stack[-1]}")

check_balance('exoplanet-pioneer.js')
