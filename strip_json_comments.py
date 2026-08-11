
import json
import re
import os

def strip_comments(text):
    # Remove # comments
    text = re.sub(r'#.*', '', text)
    # Remove // comments
    text = re.sub(r'//.*', '', text)
    return text

src = 'files/data/config/settings.json'
dst = 'files/data/config/settings.json'
backup = 'files/data/config/settings.json.bak'

if not os.path.exists(backup):
    import shutil
    shutil.copy(src, backup)
    print(f"Backed up to {backup}")

with open(src, 'r') as f:
    content = f.read()

# Naive stripping
stripped = strip_comments(content)

# Fix trailing commas (simple regex for common cases)
# Replace ", }" with "}" and ", ]" with "]"
stripped = re.sub(r',\s*}', '}', stripped)
stripped = re.sub(r',\s*]', ']', stripped)

try:
    # Validate
    parsed = json.loads(stripped)
    print("Valid JSON generated.")
    with open(dst, 'w') as f:
        json.dump(parsed, f, indent=4)
    print(f"Sanitized {dst}")
except json.JSONDecodeError as e:
    print(f"Failed to produce valid JSON: {e}")
    # Write anyway just to see? No, write best effort
    with open(dst, 'w') as f:
        f.write(stripped)
    print(f" wrote best effort stripped text to {dst}")
