import re
import os

path = "Starsector/starsector-core/data/config/settings.json"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove # style comments
content = re.sub(r"^\s*#.*$", "", content, flags=re.MULTILINE)
# Remove // style comments
content = re.sub(r"//.*$", "", content, flags=re.MULTILINE)
# Remove trailing comments on lines? The regex above handles // at end of line.
# What about # at end of line?
content = re.sub(r"#.*$", "", content, flags=re.MULTILINE)

# Remove empty lines
content = "\n".join([line for line in content.splitlines() if line.strip()])

with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Stripped comments from settings.json")
