#!/usr/bin/env python3
"""
Test script to check if Live API access is available
"""

import os
import sys

# Check if google-genai is installed
try:
    from google import genai
    print("[OK] google-genai SDK is installed")
except ImportError:
    print("❌ google-genai SDK not installed")
    print("   Install with: pip install google-genai")
    sys.exit(1)

# Check environment variables
project = os.getenv('GOOGLE_CLOUD_PROJECT', 'adriano-broadband')
location = os.getenv('GOOGLE_CLOUD_LOCATION', 'us-central1')
credentials = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', './stellar-ai-key.json')

print(f"\n📋 Configuration:")
print(f"   Project: {project}")
print(f"   Location: {location}")
print(f"   Credentials: {credentials}")
print(f"   Credentials exist: {os.path.exists(credentials)}")

# Set environment variables
os.environ['GOOGLE_CLOUD_PROJECT'] = project
os.environ['GOOGLE_CLOUD_LOCATION'] = location
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials
os.environ['GOOGLE_GENAI_USE_VERTEXAI'] = 'True'

# Try to initialize client with Vertex AI
try:
    # Method 1: Explicit parameters
    client = genai.Client(
        vertexai=True,
        project=project,
        location=location
    )
    print("\n[OK] Gen AI client initialized with Vertex AI")
except Exception as e1:
    try:
        # Method 2: Auto-detect from environment
        client = genai.Client(vertexai=True)
        print("\n[OK] Gen AI client initialized (auto-detected)")
    except Exception as e2:
        print(f"\n[FAIL] Failed to initialize client: {e1}")
        print(f"       Alternative method also failed: {e2}")
        sys.exit(1)

# Test available Live models (correct names from documentation)
live_models = [
    "gemini-live-2.5-flash",  # Primary Live model name
    "gemini-2.0-flash-live-preview-04-09",  # Alternative name
    "gemini-live-2.5-flash-preview",  # Preview version
    "gemini-2.5-flash-live"  # Alternative naming
]

print("\n🔍 Testing Live API model access...")
print("   (This will fail if you don't have access)\n")

for model in live_models:
    try:
        # Try to connect (this will fail if model not available)
        import asyncio
        from google.genai.types import LiveConnectConfig, Modality
        
        async def test_model():
            try:
                async with client.aio.live.connect(
                    model=model,
                    config=LiveConnectConfig(response_modalities=[Modality.TEXT]),
                ) as session:
                    # Just test connection, don't send anything
                    return True
            except Exception as e:
                error_msg = str(e)
                # Truncate long error messages
                if len(error_msg) > 150:
                    error_msg = error_msg[:150] + "..."
                return error_msg
        
        result = asyncio.run(test_model())
        if result is True:
            print(f"   [OK] {model} - ACCESSIBLE")
        else:
            print(f"   [FAIL] {model} - {result}")
    except Exception as e:
        print(f"   [FAIL] {model} - Error: {str(e)[:100]}")

print("\n💡 If all models show errors, you need to request access from Google")
print("   See: backend/SETUP-LIVE-API.md")

