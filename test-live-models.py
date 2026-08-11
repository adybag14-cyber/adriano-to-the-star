#!/usr/bin/env python3
"""
Test script to verify Gemini Live models are working correctly
"""

import os
import sys

# Fix Windows encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Check if Gemini is available
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    print("[ERROR] google-generativeai not installed")
    print("   Install with: pip install google-generativeai")
    sys.exit(1)

# Check API key
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
USE_LIVE_MODEL = os.getenv('USE_GEMINI_LIVE', 'false').lower() == 'true'

if not GEMINI_API_KEY:
    print("[ERROR] GEMINI_API_KEY environment variable not set")
    sys.exit(1)

print(f"[OK] GEMINI_API_KEY is set (length: {len(GEMINI_API_KEY)} chars)")
print(f"[OK] USE_GEMINI_LIVE = {USE_LIVE_MODEL}")

# Configure Gemini
try:
    genai.configure(api_key=GEMINI_API_KEY)
    print("[OK] Gemini configured successfully")
except Exception as e:
    print(f"[ERROR] Failed to configure Gemini: {e}")
    sys.exit(1)

# Test live models
print("\n[TEST] Testing Gemini Live Models...")
print("=" * 60)

live_models = [
    'gemini-2.5-flash',
    'gemini-2.0-flash'
]

working_model = None
for model_name in live_models:
    print(f"\n[TEST] Trying model: {model_name}")
    try:
        model = genai.GenerativeModel(model_name)
        print(f"   [OK] Model object created")
        
        # Test with a simple prompt
        test_prompt = "Extract this JSON: {\"test\": \"value\"}"
        print(f"   [TEST] Sending test request...")
        
        try:
            # Try non-streaming first
            response = model.generate_content(test_prompt, stream=False)
            print(f"   [SUCCESS] Non-streaming works!")
            print(f"   [RESPONSE] {response.text[:100]}...")
            working_model = model_name
            break
        except Exception as stream_error:
            print(f"   [INFO] Non-streaming failed: {stream_error}")
            print(f"   [TEST] Trying streaming...")
            try:
                response_text = ""
                for chunk in model.generate_content(test_prompt, stream=True):
                    if hasattr(chunk, 'text') and chunk.text:
                        response_text += chunk.text
                print(f"   [SUCCESS] Streaming works!")
                print(f"   [RESPONSE] {response_text[:100]}...")
                working_model = model_name
                break
            except Exception as e:
                print(f"   [ERROR] Streaming also failed: {e}")
                continue
                
    except Exception as e:
        error_msg = str(e).lower()
        if "not found" in error_msg or "404" in error_msg or "not supported" in error_msg:
            print(f"   [INFO] Model not available: {e}")
        else:
            print(f"   [ERROR] Could not use model: {e}")
        continue

if working_model:
    print(f"\n[SUCCESS] ✅ Live model working: {working_model}")
    print(f"[INFO] You can use this model for unlimited RPM/RPD")
else:
    print(f"\n[WARNING] ⚠️  No live models available")
    print(f"[INFO] Falling back to standard REST API (gemini-2.5-flash)")
    
    # Test fallback
    print(f"\n[TEST] Testing fallback model: gemini-2.5-flash")
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content("Say hello")
        print(f"[OK] Fallback model works: {response.text[:50]}")
    except Exception as e:
        print(f"[ERROR] Fallback model failed: {e}")

print("\n" + "=" * 60)
print("[TEST COMPLETE]")

