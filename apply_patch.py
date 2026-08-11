
import os

with open('custom_server_fixed.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
patched = False

with open('patch_logic.txt', 'r', encoding='utf-8') as f:
    patch_code = f.read()

for line in lines:
    if 'if is_cj3:' in line and not patched:
        new_lines.append(line)
        new_lines.append(patch_code + '\n')
        # identifying start of block to skip
        skip = True
        patched = True
        continue
    
    if skip:
        if 'if not CJ3_PATCH_LOGGED:' in line:
            skip = False
            new_lines.append(line)
        continue
        
    new_lines.append(line)

with open('custom_server_fixed.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("Patch applied.")
