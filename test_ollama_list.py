import ollama
try:
    response = ollama.list()
    # Handle object response (new ollama lib) vs dict response (old)
    if hasattr(response, 'models'):
        models = response.models
    else:
        models = response.get('models', [])
        
    names = []
    for m in models:
        if hasattr(m, 'model'):
            names.append(m.model)
        elif isinstance(m, dict) and 'name' in m:
            names.append(m['name']) # old format
        elif isinstance(m, dict) and 'model' in m:
            names.append(m['model']) # alternative dict format
            
    print("Success! Models found:", names)
except Exception as e:
    print("Error:", e)
