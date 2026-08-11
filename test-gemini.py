#!/usr/bin/env python3
"""
Test script to verify Gemini API is working correctly for price extraction
"""

import os
import sys

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

    print(f"[OK] google-generativeai installed")
    print(f"[OK] GEMINI_API_KEY is set (length: {len(GEMINI_API_KEY)} chars)")

# Configure Gemini
try:
    genai.configure(api_key=GEMINI_API_KEY)
    print("[OK] Gemini configured successfully")
except Exception as e:
    print(f"[ERROR] Failed to configure Gemini: {e}")
    sys.exit(1)

# Test with a simple prompt
print("\n[TEST] Testing Gemini API with a simple price extraction...")

test_html = """
<div class="broadband-packages">
    <div class="package">
        <h3>Full Fibre 100</h3>
        <p class="speed">100 Mbps download</p>
        <p class="price">£29.99 per month</p>
        <p>24 month contract</p>
    </div>
    <div class="package">
        <h3>Full Fibre 500</h3>
        <p class="speed">500 Mbps download</p>
        <p class="price">£39.99 per month</p>
        <p>24 month contract</p>
    </div>
    <div class="package">
        <h3>Full Fibre 900</h3>
        <p class="speed">900 Mbps download</p>
        <p class="price">£54.99 per month</p>
        <p>24 month contract</p>
    </div>
</div>
"""

try:
    # List available models first
    print("   Checking available models...")
    try:
        models = genai.list_models()
        available_models = [m.name for m in models if 'generateContent' in m.supported_generation_methods]
        print(f"   Available models: {', '.join(available_models[:5])}")
        
        # Use gemini-2.5-flash (REST API) or gemini-2.5-pro (more capable)
        # Note: gemini-2.5-flash-live is for streaming APIs, not REST API
        if any('gemini-2.5-flash' in m for m in available_models):
            model = genai.GenerativeModel('gemini-2.5-flash')
            print(f"   [OK] Using model: gemini-2.5-flash")
        elif any('gemini-2.5-pro' in m for m in available_models):
            # Use the latest stable pro version
            pro_models = [m for m in available_models if 'gemini-2.5-pro' in m]
            model_name = pro_models[0].split('/')[-1] if pro_models else 'gemini-2.5-pro'
            model = genai.GenerativeModel(model_name)
            print(f"   [OK] Using model: {model_name}")
        else:
            # Fallback to first available model
            if available_models:
                model_name = available_models[0].split('/')[-1]
                model = genai.GenerativeModel(model_name)
                print(f"   [OK] Using model: {model_name}")
            else:
                raise Exception("No models available")
    except Exception as e:
        print(f"   [WARN] Could not list models: {e}")
        # Try gemini-2.5-flash as default (REST API compatible)
        # Note: flash-live is for streaming APIs only
        model = genai.GenerativeModel('gemini-2.5-flash')
        print(f"   [OK] Using default model: gemini-2.5-flash")
    
    prompt = f"""
    Extract broadband deals from this HTML content.
    Return ONLY valid JSON in this format:
    {{
        "deals": [
            {{"name": "Package Name", "speed": "100 Mbps", "price": "29.99", "contract": "24 months"}},
            ...
        ]
    }}
    
    HTML Content:
    {test_html}
    """
    
    print("   Sending request to Gemini API...")
    response = model.generate_content(prompt)
    
    # Clean response
    json_str = response.text.replace('```json', '').replace('```', '').strip()
    
    import json
    data = json.loads(json_str)
    
    print(f"[OK] Gemini API responded successfully!")
    print(f"   Extracted {len(data.get('deals', []))} deals:")
    for deal in data.get('deals', []):
        print(f"      - {deal.get('name')}: {deal.get('speed')} @ {deal.get('price')}/mo")
    
    print("\n[OK] Gemini integration is working correctly!")
    
except Exception as e:
    print(f"[ERROR] Gemini API test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

