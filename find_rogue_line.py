with open('starsector.html', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f, 1):
        if "Registered Sys/Time Natives" in line:
            print(f"FOUND at line {i}: {line.strip()}")
            # Also print context
            print(f"Context: {line[:100]}...")
