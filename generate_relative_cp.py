import os

# Jars to include (same logic as before)
jars = [f for f in os.listdir('Starsector/starsector-core') if f.endswith('.jar') and '_v2' not in f]
if os.path.exists('Starsector/starsector-core/starfarer_obf_unsigned.jar'):
    jars = [j for j in jars if 'starfarer_obf.jar' not in j]
    jars.append('starfarer_obf_unsigned.jar')

# Also include the directory itself for class files if any
classpath_entries = jars + ['.']

# Join with colon (Unix standard for CheerpJ)
classpath_string = ":".join(classpath_entries)

print(classpath_string)
