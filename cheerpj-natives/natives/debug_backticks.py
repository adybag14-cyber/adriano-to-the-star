
try:
    with open('lwjgl.js', 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    backtick_count = 0
    last_backtick_line = -1
    
    print(f"Total lines: {len(lines)}")
    
    for i, line in enumerate(lines):
        for char in line:
            if char == '`':
                backtick_count += 1
                last_backtick_line = i + 1
                
    print(f"Total backticks: {backtick_count}")
    if backtick_count % 2 != 0:
        print(f"ODD NUMBER OF BACKTICKS FOUND! Last backtick at line {last_backtick_line}")
        # Print context around the last backtick
        start = max(0, last_backtick_line - 5)
        end = min(len(lines), last_backtick_line + 5)
        print("Context:")
        for j in range(start, end):
             print(f"{j+1}: {lines[j]}")
    else:
        print("Even number of backticks. The error might be something else or a very long string.")

except Exception as e:
    print(e)
