#!/usr/bin/env python3
"""
Check available Gemini models and see if flash-live can be used
"""

import os
import sys
import json

# Fix Windows encoding issues
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
if not GEMINI_API_KEY:
    print("[ERROR] GEMINI_API_KEY environment variable not set")
    print("   Set it with: set GEMINI_API_KEY=your_key (Windows)")
    print("   Or: export GEMINI_API_KEY=your_key (Linux/Mac)")
    sys.exit(1)

print(f"[OK] GEMINI_API_KEY is set (length: {len(GEMINI_API_KEY)} chars)")

# Configure Gemini
try:
    genai.configure(api_key=GEMINI_API_KEY)
    print("[OK] Gemini configured successfully")
except Exception as e:
    print(f"[ERROR] Failed to configure Gemini: {e}")
    sys.exit(1)

# List all available models
print("\n" + "="*80)
print("CHECKING AVAILABLE GEMINI MODELS")
print("="*80)

try:
    print("\n[INFO] Fetching list of available models...")
    models_generator = genai.list_models()
    models = list(models_generator)  # Convert generator to list
    
    # Categorize models
    generate_content_models = []
    streaming_models = []
    live_models = []
    flash_models = []
    pro_models = []
    other_models = []
    
    for model in models:
        name = model.name
        methods = model.supported_generation_methods
        
        # Check what methods are supported
        has_generate_content = 'generateContent' in methods
        has_stream_generate_content = 'streamGenerateContent' in methods
        
        model_info = {
            'name': name,
            'display_name': model.display_name,
            'description': model.description,
            'methods': methods,
            'has_generate_content': has_generate_content,
            'has_stream': has_stream_generate_content
        }
        
        if 'flash-live' in name.lower() or 'live' in name.lower():
            live_models.append(model_info)
        elif 'flash' in name.lower():
            flash_models.append(model_info)
            if has_generate_content:
                generate_content_models.append(model_info)
        elif 'pro' in name.lower():
            pro_models.append(model_info)
            if has_generate_content:
                generate_content_models.append(model_info)
        else:
            other_models.append(model_info)
            if has_generate_content:
                generate_content_models.append(model_info)
        
        if has_stream_generate_content:
            streaming_models.append(model_info)
    
    # Print results
    print(f"\n[RESULTS] Found {len(models)} total models")
    print(f"  - Models with generateContent: {len(generate_content_models)}")
    print(f"  - Models with streaming: {len(streaming_models)}")
    print(f"  - Flash models: {len(flash_models)}")
    print(f"  - Live models: {len(live_models)}")
    print(f"  - Pro models: {len(pro_models)}")
    
    # Show Flash models
    print("\n" + "-"*80)
    print("FLASH MODELS (for REST API generateContent):")
    print("-"*80)
    for model in flash_models:
        methods_str = ', '.join(model['methods'])
        generate_ok = "✅" if model['has_generate_content'] else "❌"
        stream_ok = "✅" if model['has_stream'] else "❌"
        print(f"  {generate_ok} {model['name']}")
        print(f"     Display: {model['display_name']}")
        print(f"     Methods: {methods_str}")
        if model['description']:
            print(f"     Description: {model['description'][:100]}...")
        print()
    
    # Show Live models
    print("-"*80)
    print("LIVE MODELS (for streaming/real-time):")
    print("-"*80)
    if live_models:
        for model in live_models:
            methods_str = ', '.join(model['methods'])
            generate_ok = "✅" if model['has_generate_content'] else "❌"
            stream_ok = "✅" if model['has_stream'] else "❌"
            print(f"  {generate_ok} {model['name']}")
            print(f"     Display: {model['display_name']}")
            print(f"     Methods: {methods_str}")
            if model['description']:
                print(f"     Description: {model['description'][:100]}...")
            print()
    else:
        print("  No live models found")
    
    # Check specifically for flash-live
    print("-"*80)
    print("CHECKING FOR gemini-2.5-flash-live:")
    print("-"*80)
    flash_live_models = [m for m in models if 'flash-live' in m.name.lower()]
    if flash_live_models:
        for model in flash_live_models:
            print(f"  Found: {model.name}")
            print(f"     Display: {model.display_name}")
            print(f"     Methods: {', '.join(model.supported_generation_methods)}")
            if 'generateContent' in model.supported_generation_methods:
                print(f"     ✅ CAN USE with generateContent REST API")
            else:
                print(f"     ❌ CANNOT use with generateContent REST API")
                print(f"     ⚠️  This model is for streaming APIs only")
            print()
    else:
        print("  ❌ gemini-2.5-flash-live not found in available models")
        print("  ⚠️  This model may not be available via REST API")
    
    # Test if we can use flash-live
    print("-"*80)
    print("TESTING MODEL USAGE:")
    print("-"*80)
    
    # Test regular flash
    print("\n[TEST 1] Testing gemini-2.5-flash (REST API)...")
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content("Say 'test' if you can hear me")
        print(f"  ✅ SUCCESS: gemini-2.5-flash works with REST API")
        print(f"     Response: {response.text[:50]}...")
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
    
    # Test flash-live if available
    print("\n[TEST 2] Testing gemini-2.5-flash-live (if available)...")
    try:
        model = genai.GenerativeModel('gemini-2.5-flash-live')
        response = model.generate_content("Say 'test' if you can hear me")
        print(f"  ✅ SUCCESS: gemini-2.5-flash-live works with REST API!")
        print(f"     Response: {response.text[:50]}...")
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        if '404' in str(e) or 'not found' in str(e).lower():
            print(f"     ⚠️  Model not available via REST API generateContent")
            print(f"     💡 Live models may require streaming API endpoints")
    
    # Recommendations
    print("\n" + "="*80)
    print("RECOMMENDATIONS:")
    print("="*80)
    
    best_flash = None
    for model in flash_models:
        if model['has_generate_content'] and '2.5' in model['name']:
            best_flash = model
            break
    
    if best_flash:
        print(f"\n✅ RECOMMENDED: Use {best_flash['name']} for REST API")
        print(f"   - Supports generateContent: ✅")
        print(f"   - Good for batch processing: ✅")
    else:
        print("\n⚠️  No ideal flash model found, using gemini-2.5-flash as default")
    
    if live_models:
        live_with_generate = [m for m in live_models if m['has_generate_content']]
        if live_with_generate:
            print(f"\n✅ LIVE MODEL AVAILABLE: {live_with_generate[0]['name']}")
            print(f"   - Can use with REST API: ✅")
        else:
            print(f"\n⚠️  Live models found but require streaming API")
            print(f"   - For REST API, use regular flash models instead")
    
    print("\n" + "="*80)
    
except Exception as e:
    print(f"[ERROR] Failed to list models: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

