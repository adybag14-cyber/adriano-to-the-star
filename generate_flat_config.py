import os

# Jars to include
jars = [f for f in os.listdir('Starsector/starsector-core') if f.endswith('.jar') and '_v2' not in f]
if os.path.exists('Starsector/starsector-core/starfarer_obf_unsigned.jar'):
    jars = [j for j in jars if 'starfarer_obf.jar' not in j]
    jars.append('starfarer_obf_unsigned.jar')

print("PRELOAD_RESOURCES = [")
print('    ["/liblwjgl.so", "/liblwjgl.so"],')
print('    ["/log4j_debug.properties", "/app/log4j_debug.properties"],')
print('    ["/log4j.xml", "/app/log4j.xml"],')
print('    ["/log4j.dtd", "/app/log4j.dtd"],')

classpath_entries = []

for j in jars:
    url = f"/Starsector/starsector-core/{j}"
    mount_point = f"/app/{j}"
    print(f'    ["{url}", "{mount_point}"],')
    classpath_entries.append(mount_point)

print("]")
print("\nCLASSPATH:")
# Also include current dir (.) and /app itself
classpath_entries.append(".")
classpath_entries.append("/app")
print(":".join(classpath_entries))
