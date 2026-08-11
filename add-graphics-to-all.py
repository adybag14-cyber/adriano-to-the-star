import os
import re

# List of HTML files to enhance
html_files = [
    'about.html',
    'blog.html',
    'book-online.html',
    'business-promise.html',
    'database.html',
    'education.html',
    'events.html',
    'followers.html',
    'forum.html',
    'groups.html',
    'loyalty.html',
    'members.html',
    'projects.html',
    'shop.html'
]

def add_graphics_to_html(filename):
    """Add universal graphics script to HTML file if not already present"""
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already added
    if 'universal-graphics.js' in content:
        print(f'[SKIP] {filename} already has graphics')
        return False
    
    # Find </head> tag and insert before it
    if '</head>' in content:
        # Add the script tag
        script_tag = '    <script src="universal-graphics.js" defer></script>\n</head>'
        content = content.replace('</head>', script_tag)
        
        # Write back
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f'[OK] Added graphics to {filename}')
        return True
    else:
        print(f'[ERROR] Could not find </head> in {filename}')
        return False

def main():
    print('Adding universal graphics to all pages...')
    print('=' * 60)
    
    updated_count = 0
    for filename in html_files:
        if os.path.exists(filename):
            if add_graphics_to_html(filename):
                updated_count += 1
        else:
            print(f'[WARNING] {filename} not found')
    
    print('=' * 60)
    print(f'Updated {updated_count} files!')
    print('All pages now have INSANE graphics! 🌟✨🚀')

if __name__ == '__main__':
    main()
