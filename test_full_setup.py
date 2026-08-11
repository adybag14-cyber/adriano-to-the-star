"""
Complete test for LiveKit Gemini agent setup
Tests both LiveKit credentials and Google API key
"""

import os
import sys

# Fix Windows encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def check_livekit_env():
    """Check LiveKit environment variables"""
    print("Checking LiveKit configuration...")
    
    url = os.getenv('LIVEKIT_URL')
    api_key = os.getenv('LIVEKIT_API_KEY')
    api_secret = os.getenv('LIVEKIT_API_SECRET')
    
    all_set = True
    
    if url:
        print(f"  ✓ LIVEKIT_URL: {url}")
    else:
        print("  ✗ LIVEKIT_URL is not set")
        all_set = False
    
    if api_key:
        print(f"  ✓ LIVEKIT_API_KEY: {api_key}")
    else:
        print("  ✗ LIVEKIT_API_KEY is not set")
        all_set = False
    
    if api_secret:
        print(f"  ✓ LIVEKIT_API_SECRET: [HIDDEN]")
    else:
        print("  ✗ LIVEKIT_API_SECRET is not set")
        all_set = False
    
    return all_set

def check_google_api():
    """Check Google API key"""
    print("\nChecking Google API configuration...")
    
    api_key = os.getenv('GOOGLE_API_KEY')
    if api_key:
        print(f"  ✓ GOOGLE_API_KEY is set (length: {len(api_key)})")
        return True
    else:
        print("  ✗ GOOGLE_API_KEY is not set")
        print("  Set it with: $env:GOOGLE_API_KEY='your-api-key'")
        return False

def test_imports():
    """Test if packages are installed"""
    print("\nChecking Python packages...")
    try:
        from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli
        from livekit.plugins import google
        print("  ✓ All required packages are installed")
        return True
    except ImportError as e:
        print(f"  ✗ Import error: {e}")
        return False

def test_model_creation():
    """Test model creation"""
    print("\nTesting Gemini RealtimeModel creation...")
    try:
        from livekit.plugins import google
        
        model = google.realtime.RealtimeModel(
            model="gemini-2.5-flash-native-audio-preview-09-2025",
            voice="Puck",
            temperature=0.8,
            modalities=["AUDIO"],
        )
        print("  ✓ RealtimeModel created successfully")
        return True
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False

def main():
    print("=" * 70)
    print("LiveKit Gemini Agent - Complete Setup Test")
    print("=" * 70)
    
    results = {
        'livekit': check_livekit_env(),
        'google': check_google_api(),
        'packages': test_imports(),
        'model': False
    }
    
    if results['packages']:
        results['model'] = test_model_creation()
    
    print("\n" + "=" * 70)
    print("Test Results Summary")
    print("=" * 70)
    
    for check, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {check.upper():12} : {status}")
    
    print("\n" + "=" * 70)
    
    if all(results.values()):
        print("✓ ALL CHECKS PASSED! Your agent is ready to use.")
        print("\nTo run the agent:")
        print("  python livekit_agent.py dev    # Development mode with hot reload")
        print("  python livekit_agent.py start  # Production mode")
        print("\nOr test in console mode (no LiveKit server needed):")
        print("  python livekit_agent.py console")
    else:
        print("✗ Some checks failed. Please fix the issues above.")
        if not results['livekit']:
            print("\nRun setup_env.ps1 to set LiveKit environment variables")
        if not results['google']:
            print("Set GOOGLE_API_KEY environment variable")
    
    print("=" * 70)

if __name__ == "__main__":
    main()

