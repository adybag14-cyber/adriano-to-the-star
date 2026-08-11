#!/usr/bin/env python3
"""
Quick test script for Live API Python service
Tests if the service can connect to Live API
"""

import asyncio
import os
import sys
from google import genai
from google.genai import types

# Get API key
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_AI_API_KEY')

if not GEMINI_API_KEY:
    print("❌ Error: GEMINI_API_KEY not set in environment")
    print("   Set it in backend/.env or export it")
    sys.exit(1)

print(f"✅ API Key found: {GEMINI_API_KEY[:10]}...")
print()

# Initialize client
# Live API REQUIRES Vertex AI, not API keys
GOOGLE_CLOUD_PROJECT = os.getenv('GOOGLE_CLOUD_PROJECT', 'adriano-broadband')
GOOGLE_CLOUD_LOCATION = os.getenv('GOOGLE_CLOUD_LOCATION', 'us-central1')

try:
    client = genai.Client(
        vertexai=True,
        project=GOOGLE_CLOUD_PROJECT,
        location=GOOGLE_CLOUD_LOCATION
    )
    print("✅ Client initialized with Vertex AI (required for Live API)")
except Exception as e:
    print(f"❌ Failed to initialize client with Vertex AI: {e}")
    print("   Note: Live API requires Vertex AI authentication, not API keys")
    sys.exit(1)

# Test models
test_models = [
    "gemini-2.5-flash-live",
    "gemini-2.5-flash-native-audio-preview-09-2025",
    "gemini-live-2.5-flash-preview"
]

async def test_model(model_name):
    """Test if a model is accessible"""
    try:
        print(f"🔍 Testing: {model_name}...")
        
        config = types.LiveConnectConfig(
            response_modalities=["TEXT"]
        )
        
        async with client.aio.live.connect(
            model=model_name,
            config=config
        ) as session:
            print(f"   ✅ Connected to {model_name}!")
            
            # Send test message
            await session.send_client_content(
                turns=types.Content(
                    role="user",
                    parts=[types.Part(text="Hello, test message")]
                )
            )
            
            # Receive response
            response_text = ""
            async for message in session.receive():
                if message.text:
                    response_text += message.text
            
            if response_text:
                print(f"   ✅ Got response ({len(response_text)} chars): {response_text[:100]}...")
                return True
            else:
                print(f"   ⚠️  Connected but no response")
                return False
                
    except Exception as e:
        error_msg = str(e).lower()
        if "not found" in error_msg or "404" in error_msg:
            print(f"   ❌ Model not available: {str(e)[:100]}")
        else:
            print(f"   ❌ Error: {str(e)[:100]}")
        return False

async def main():
    print("🧪 Testing Live API Models...")
    print()
    
    success_count = 0
    for model in test_models:
        result = await test_model(model)
        if result:
            success_count += 1
        print()
    
    print(f"📊 Results: {success_count}/{len(test_models)} models working")
    
    if success_count > 0:
        print("✅ Live API is working! You can use Live models.")
    else:
        print("⚠️  No Live models accessible. Check API key permissions.")

if __name__ == "__main__":
    asyncio.run(main())

