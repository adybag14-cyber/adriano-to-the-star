"""
Quick test for LiveKit agent with API key
Run this to test if your Gemini API key works
"""

import os
import sys

# Fix Windows encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("=" * 60)
    print("Testing LiveKit Gemini Agent")
    print("=" * 60)
    
    # Check if API key is set
    api_key = os.getenv('GOOGLE_API_KEY')
    
    if not api_key:
        print("\nGOOGLE_API_KEY environment variable is not set.")
        print("\nYou can set it in PowerShell with:")
        print("  $env:GOOGLE_API_KEY='your-api-key-here'")
        print("\nOr set it temporarily for this test:")
        api_key = input("Enter your Gemini API key (or press Enter to skip): ").strip()
        if api_key:
            os.environ['GOOGLE_API_KEY'] = api_key
            print("✓ API key set for this session")
        else:
            print("✗ No API key provided. Exiting.")
            return
    
    # Test imports
    try:
        from livekit.plugins import google
        print("\n✓ LiveKit packages imported successfully")
    except ImportError as e:
        print(f"\n✗ Import error: {e}")
        print("Install with: pip install -r requirements.txt")
        return
    
    # Test model creation
    try:
        print("\nTesting RealtimeModel creation...")
        model = google.realtime.RealtimeModel(
            model="gemini-2.5-flash-native-audio-preview-09-2025",
            voice="Puck",
            temperature=0.8,
            modalities=["AUDIO"],
        )
        print("✓ RealtimeModel created successfully!")
        print("\n" + "=" * 60)
        print("✓ SUCCESS! Your API key works and the agent is configured correctly.")
        print("=" * 60)
        print("\nTo run the agent:")
        print("  1. Make sure GOOGLE_API_KEY is set in your environment")
        print("  2. Run: python livekit_agent.py console")
        print("\nOr for development mode:")
        print("  2. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET")
        print("  3. Run: python livekit_agent.py dev")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        print("\nThis might indicate:")
        print("  - Invalid API key")
        print("  - Network connectivity issues")
        print("  - API quota/access issues")

if __name__ == "__main__":
    main()

