
with open('exoplanet-pioneer.js', 'rb') as f:
    lines = f.readlines()
    for i in range(478, 485):
        print(f"{i+1}: {repr(lines[i])}")
