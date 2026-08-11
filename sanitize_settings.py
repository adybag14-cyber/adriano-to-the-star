import re
import os

path = r"C:\Users\adyba\adriano-to-the-star-clean\Starsector\starsector-core\data\config\settings.json"

if not os.path.exists(path):
    print("File not found!")
    exit(1)

with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    # Remove comment only lines (starting with whitespace then #)
    if re.match(r'^\s*#', line):
        continue
    # Remove trailing comments
    line = re.sub(r'#.*$', '', line)
    new_lines.append(line)

content = "".join(new_lines)
# Fix trailing commas: , } -> } and , ] -> ]
content = re.sub(r',\s*}', '}', content)
content = re.sub(r',\s*]', ']', content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Sanitization complete.")
