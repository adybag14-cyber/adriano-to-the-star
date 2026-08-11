
def check_quotes(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()

    in_string = False
    string_char = None
    in_comment = False # /* */
    in_line_comment = False # //
    
    i = 0
    line = 1
    col = 1
    
    start_pos = (0, 0)
    
    while i < len(content):
        char = content[i]
        
        if not in_string and not in_comment and not in_line_comment:
            if char == '/' and i+1 < len(content) and content[i+1] == '*':
                in_comment = True
                i += 1
            elif char == '/' and i+1 < len(content) and content[i+1] == '/':
                in_line_comment = True
                i += 1
            elif char in "\"'`":
                in_string = True
                string_char = char
                start_pos = (line, col)
        
        elif in_line_comment:
            if char == '\n':
                in_line_comment = False
        
        elif in_comment:
            if char == '*' and i+1 < len(content) and content[i+1] == '/':
                in_comment = False
                i += 1
        
        elif in_string:
            if char == '\\':
                i += 1 # skip next char
            elif char == string_char:
                in_string = False
        
        if char == '\n':
            line += 1
            col = 1
        else:
            col += 1
        i += 1

    if in_string:
        print(f"Error: Unclosed string starting at line {start_pos[0]}, col {start_pos[1]} with char {string_char}")

check_quotes('exoplanet-pioneer.js')
