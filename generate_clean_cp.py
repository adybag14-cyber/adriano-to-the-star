import os
jars = [f for f in os.listdir('Starsector/starsector-core') if f.endswith('.jar') and '_v2' not in f]
cp = '/Starsector/starsector-core/' + ':/Starsector/starsector-core/'.join(jars)
cp += ':/Starsector/starsector-core' 
with open('classpath_clean.txt', 'w') as f:
    f.write(cp)
print(f"Generated clean classpath with {len(jars)} JARs")
