import os

def batch_fix_html(directory):
    html_files = [f for f in os.listdir(directory) if f.endswith('.html')]
    
    head_injections = [
        '<link rel="stylesheet" href="loader.css">',
        '<script src="loader.js"></script>',
        '<script src="navigation.js" defer></script>',
        '<link rel="manifest" href="manifest.json">'
    ]
    
    for file in html_files:
        file_path = os.path.join(directory, file)
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            
        original_content = content
        
        # Fix missing DOCTYPE
        if '<!DOCTYPE html>' not in content:
            content = '<!DOCTYPE html>\n' + content
            
        # Inject missing resources into <head>
        if '<head>' in content:
            head_end_index = content.find('</head>')
            if head_end_index != -1:
                injections = []
                for item in head_injections:
                    if item not in content:
                        injections.append(item)
                
                if injections:
                    injection_str = '\n    ' + '\n    '.join(injections) + '\n'
                    content = content[:head_end_index] + injection_str + content[head_end_index:]
        
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Fixed {file}")

if __name__ == "__main__":
    batch_fix_html(".")
