
try:
    with open('lwjgl.js', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print("Lines with backticks:")
    for i, line in enumerate(lines):
        if '`' in line:
            print(f"{i+1}: {line.strip()}")
            
except Exception as e:
    print(e)
