import os
jars = [f for f in os.listdir('Starsector/starsector-core') if f.endswith('.jar') and '_v2' not in f]

# We need the unsigned one if we made it
if os.path.exists('Starsector/starsector-core/starfarer_obf_unsigned.jar'):
    jars = [j for j in jars if 'starfarer_obf.jar' not in j] # remove original
    jars.append('starfarer_obf_unsigned.jar')

print("                    preloadResources: [")
print('                        ["/liblwjgl.so", "/liblwjgl.so"],')
print('                        ["/log4j_debug.properties", "/log4j_debug.properties"],')
print('                        ["/log4j.xml", "/log4j.xml"],')
print('                        ["/log4j.dtd", "/log4j.dtd"],')

for j in jars:
    path = f"/Starsector/starsector-core/{j}"
    print(f'                        ["{path}", "{path}"],')

print("                    ],")
