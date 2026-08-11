import os

pages = [
    'about.html', 'database.html', 'business-promise.html', 'education.html', 
    'projects.html', 'book-online.html', 'loyalty.html', 'events.html', 
    'shop.html', 'groups.html', 'members.html', 'followers.html', 'forum.html', 'blog.html'
]

for page in pages:
    if os.path.exists(page):
        with open(page, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'pages-styles.css' not in content:
            content = content.replace(
                '<link rel="stylesheet" href="styles.css">',
                '<link rel="stylesheet" href="styles.css">\n    <link rel="stylesheet" href="pages-styles.css">'
            )
            
            with open(page, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[OK] Updated {page}")
        else:
            print(f"[SKIP] {page} already has pages-styles.css")

print("\n[SUCCESS] All pages updated!")
