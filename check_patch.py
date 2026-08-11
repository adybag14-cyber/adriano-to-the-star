import urllib.request
import re

url = 'https://cjrtnc.leaningtech.com/4.2/cj3.js'
print(f"Fetching {url}...")
try:
    with urllib.request.urlopen(url) as response:
        content = response.read().decode('utf-8')
    
    print(f"Fetched {len(content)} bytes.")
    
    needle = 'if(h===undefined){console.log("Missing import:",c);V();;}'
    
    if needle in content:
        print("SUCCESS: Exact needle found!")
    else:
        print("FAILURE: Exact needle NOT found.")
        
        # Search for "Missing import" to find the new context
        match = re.search(r'.{0,100}Missing import.{0,100}', content)
        if match:
            print(f"Context found around 'Missing import':\n{match.group(0)}")
        else:
            print("CRITICAL: 'Missing import' string not found in file either!")

except Exception as e:
    print(f"Error: {e}")
