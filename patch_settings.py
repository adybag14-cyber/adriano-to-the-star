import json
import re

path = r"C:\Users\Ady\Documents\GitHub\starsector-linux\starsector\data\config\settings.json"

try:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Regex replacement because the file contains comments (// or #) which JSON parsers hate
    
    # 1. Force Windowed
    content = re.sub(r'"fullscreen":\s*true', '"fullscreen":false', content)
    
    # 2. Set Resolution
    content = re.sub(r'"resolutionWidth":\s*\d+', '"resolutionWidth":1280', content)
    content = re.sub(r'"resolutionHeight":\s*\d+', '"resolutionHeight":768', content)
    
    # 3. Disable Sound (Optional, for stability?) No, keep sound.
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print("Successfully patched settings.json for WebGL compatibility.")

except Exception as e:
    print(f"Error patching settings: {e}")
