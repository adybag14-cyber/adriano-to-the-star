#!/usr/bin/env python3
"""
Check what Gemini models are actually available
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

print("Checking available Gemini models...\n")

try:
    models = list(genai.list_models())
    
    print("=" * 80)
    print("ALL AVAILABLE MODELS:")
    print("=" * 80)
    
    for model in models:
        methods = model.supported_generation_methods
        name = model.name.split('/')[-1] if '/' in model.name else model.name
        
        # Check if it's a live model
        is_live = 'live' in name.lower()
        has_generate = 'generateContent' in methods
        has_bidi = 'bidiGenerateContent' in methods
        
        print(f"\n{name}")
        print(f"  Methods: {', '.join(methods)}")
        if is_live:
            print(f"  ⚡ LIVE MODEL")
        if has_generate:
            print(f"  ✅ Supports generateContent (REST API)")
        if has_bidi:
            print(f"  ✅ Supports bidiGenerateContent (Streaming API)")
        if is_live and not has_generate and not has_bidi:
            print(f"  ⚠️  Live model but no standard API methods")
    
    print("\n" + "=" * 80)
    print("LIVE MODELS SUMMARY:")
    print("=" * 80)
    
    live_models = [m for m in models if 'live' in m.name.lower()]
    if live_models:
        for model in live_models:
            name = model.name.split('/')[-1] if '/' in model.name else model.name
            methods = model.supported_generation_methods
            print(f"\n{name}:")
            print(f"  Methods: {', '.join(methods)}")
    else:
        print("\n⚠️  No live models found in available models list")
    
    print("\n" + "=" * 80)
    print("RECOMMENDED MODELS FOR SCRAPING:")
    print("=" * 80)
    
    # Find models that support generateContent
    rest_models = [m for m in models if 'generateContent' in m.supported_generation_methods]
    flash_models = [m for m in rest_models if 'flash' in m.name.lower()]
    
    if flash_models:
        print("\n✅ Flash models (fast, good for scraping):")
        for model in flash_models[:5]:
            name = model.name.split('/')[-1] if '/' in model.name else model.name
            print(f"  - {name}")
    
    pro_models = [m for m in rest_models if 'pro' in m.name.lower() and 'flash' not in m.name.lower()]
    if pro_models:
        print("\n✅ Pro models (more capable, slower):")
        for model in pro_models[:3]:
            name = model.name.split('/')[-1] if '/' in model.name else model.name
            print(f"  - {name}")
            
except Exception as e:
    print(f"[ERROR] Failed to list models: {e}")
    import traceback
    traceback.print_exc()

