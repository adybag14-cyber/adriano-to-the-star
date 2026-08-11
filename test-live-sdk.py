#!/usr/bin/env python3
"""
Test live models using Python SDK
"""

import os
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

try:
    import google.generativeai as genai
except ImportError:
    print("[ERROR] google-generativeai not installed")
    sys.exit(1)

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', 'GEMINI_API_KEY_2')
genai.configure(api_key=GEMINI_API_KEY)

models_to_test = [
    'gemini-2.5-flash-live',
    'gemini-2.5-flash-live-preview',
    'gemini-live-2.5-flash-preview',
    'gemini-2.0-flash-live-001'
]

print("Testing live models using Python SDK")
print("=" * 60)

for model_name in models_to_test:
    print(f"\n[TEST] Testing {model_name}...")
    try:
        model = genai.GenerativeModel(model_name)
        print(f"   ✅ Model object created")
        
        # Try to generate content
        print(f"   Sending request...")
        response = model.generate_content("Say hello", stream=False)
        print(f"   ✅ SUCCESS: {response.text[:100]}")
        
    except Exception as e:
        error_msg = str(e)
        print(f"   ❌ ERROR: {error_msg[:200]}")
        if "not found" in error_msg.lower() or "404" in error_msg.lower():
            print(f"   ⚠️  Model not available via SDK")
        elif "not supported" in error_msg.lower():
            print(f"   ⚠️  Method not supported for this model")

print("\n" + "=" * 60)
print("[TEST COMPLETE]")

