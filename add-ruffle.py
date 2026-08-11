import re
from pathlib import Path

# Read games.html
games_file = Path('games.html')
content = games_file.read_text(encoding='utf-8')

# Find the exact position to add Ruffle - before </body>
# We'll add it right before the games.js script

# Pattern to find games.js line
pattern = r'(\s*<script src="games\.js" defer></script>\s*</body>)'

# Replacement adding Ruffle before games.js
replacement = r'''
    <!-- Ruffle Player - Flash Emulator -->
    <script src="https://unpkg.com/@ruffle-rs/ruffle"></script>
    
\1'''

# Perform replacement
new_content = re.sub(pattern, replacement, content, count=1)

# Only write if we found the pattern
if new_content != content:
    games_file.write_text(new_content, encoding='utf-8')
    print("✅ Successfully added Ruffle player script to games.html")
    print("   Added before games.js line")
else:
    print("⚠️ Could not find games.js script tag pattern")
    print("   Searching for alternative...")
    
    # Try alternative - just add before </body>
    if '</body>' in content and '@ruffle-rs/ruffle' not in content:
        content = content.replace('</body>', '''    <!-- Ruffle Player - Flash Emulator -->
    <script src="https://unpkg.com/@ruffle-rs/ruffle"></script>
    
</body>''')
        games_file.write_text(content, encoding='utf-8')
        print("✅ Added Ruffle before </body> tag")
    elif '@ruffle-rs/ruffle' in content:
        print("✅ Ruffle already present in file")
    else:
        print("❌ Could not add Ruffle - no </body> tag found")
