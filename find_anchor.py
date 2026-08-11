
with open('cj3_debug.js','rb') as f:
    c = f.read()
    needle = b'c==="__syscall_pipe2"'
    i = c.find(needle)
    print(f'Found at {i}')
    if i != -1:
        start = max(0, i-20)
        end = i + 50
        print(f"Context: {c[start:end]}")
