import os
import google.generativeai as genai

# Fix Windows encoding
import sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

api_key = os.getenv('GEMINI_API_KEY')
if not api_key:
    print("Error: GEMINI_API_KEY not set")
    exit(1)

genai.configure(api_key=api_key)

print(f"Listing available models for API key: {api_key[:5]}...{api_key[-5:]}")
print("=" * 60)

try:
    count = 0
    for m in genai.list_models():
        count += 1
        print(f"Name: {m.name}")
        print(f"Display Name: {m.display_name}")
        print(f"Description: {m.description}")
        print(f"Supported methods: {m.supported_generation_methods}")
        print("-" * 60)
    
    print(f"Total models found: {count}")

except Exception as e:
    print(f"Error listing models: {e}")
