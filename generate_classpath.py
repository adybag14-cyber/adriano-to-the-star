import os
jars = [f for f in os.listdir('Starsector/starsector-core') if f.endswith('.jar')]
cp = '/Starsector/starsector-core/' + ':/Starsector/starsector-core/'.join(jars)
# Append the config directory for good measure
cp += ':/Starsector/starsector-core' 
with open('classpath.txt', 'w') as f:
    f.write(cp)
print(f"Generated classpath with {len(jars)} JARs")
