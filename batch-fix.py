#!/usr/bin/env python3
"""Comprehensive fix: Add loader, manifest, and Ruffle to all pages"""
import re
from pathlib import Path

pages_needing_loader = [
    "about.html", "blog.html", "book-online.html", "broadband-checker.html",
    "business-promise.html", "dashboard.html", "education.html", "events.html",
    "file-storage.html", "followers.html", "forum.html", "games.html",
    "groups.html", "gta-6-videos.html", "loyalty.html", "members.html",
    "offline.html", "projects.html", "shop.html", "stellar-ai.html"
]

fixed = 0
skipped = 0

for page in pages_needing_loader:
    path = Path(page)
    if not path.exists():
        print(f"  ⚠ {page} not found")
        continue
    
    content = path.read_text(encoding='utf-8')
    
    # Skip if already has loader.js
    if 'loader.js' in content:
        print(f"  ✓ {page} already has loader")
        skipped += 1
        continue
    
    # Add loader after pages-styles.css or styles.css
    if 'pages-styles.css' in content:
        content = re.sub(
            r'(<link rel="stylesheet" href="pages-styles\.css">)',
            r'\1\n    <link rel="stylesheet" href="loader.css">\n    <script src="loader.js"></script>',
            content
        )
    elif 'styles.css' in content:
        content = re.sub(
            r'(<link rel="stylesheet" href="styles\.css">)',
            r'\1\n    <link rel="stylesheet" href="loader.css">\n    <script src="loader.js"></script>',
            content
        )
    
    # Add manifest.json if missing
    if 'manifest.json' not in content:
        content = re.sub(
            r'(</head>)',
            r'    <link rel="manifest" href="manifest.json">\n\1',
            content
        )
    
    path.write_text(content, encoding='utf-8')
    print(f"  ✅ Fixed {page}")
    fixed += 1

# Special: Add Ruffle to games.html
games_path = Path("games.html")
if games_path.exists():
    games_content = games_path.read_text(encoding='utf-8')
    if '@ruffle-rs/ruffle' not in games_content:
        games_content = re.sub(
            r'(<scriptsrc="games\.js")',
            r'    <!-- Ruffle Player -->\n    <script src="https://unpkg.com/@ruffle-rs/ruffle"></script>\n    \1',
            games_content
        )
        games_path.write_text(games_content, encoding='utf-8')
        print("  ✅ Added Ruffle to games.html")

print(f"\n📊 Summary:")
print(f"  Fixed: {fixed} pages")
print(f"  Skipped: {skipped} pages")
print(f"\n✅ Batch fix complete!")
