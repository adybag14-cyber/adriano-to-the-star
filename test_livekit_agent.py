"""
Test script for LiveKit Gemini agent
This script tests the agent configuration and API key connection
"""

import os
import sys
import asyncio

# Fix Windows encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def check_environment():
    """Check if required environment variables are set"""
    print("Checking environment setup...")
    
    api_key = os.getenv('GOOGLE_API_KEY')
    if api_key:
        print(f"✓ GOOGLE_API_KEY is set (length: {len(api_key)})")
        return True
    else:
        print("✗ GOOGLE_API_KEY is not set")
        print("\nTo set it, run:")
        print("  PowerShell: $env:GOOGLE_API_KEY='your-api-key'")
        print("  CMD: set GOOGLE_API_KEY=your-api-key")
        return False

def check_imports():
    """Check if required packages are installed"""
    print("\nChecking required packages...")
    try:
        from livekit.agents import Agent, AgentSession, JobContext, WorkerOptions, cli
        from livekit.plugins import google
        print("✓ All required packages are installed")
        return True
    except ImportError as e:
        print(f"✗ Missing package: {e}")
        print("\nInstall with: pip install -r requirements.txt")
        return False

def test_model_creation():
    """Test if we can create a RealtimeModel instance"""
    print("\nTesting model creation...")
    try:
        from livekit.plugins import google
        
        model = google.realtime.RealtimeModel(
            model="gemini-2.5-flash-native-audio-preview-09-2025",
            voice="Puck",
            temperature=0.8,
            modalities=["AUDIO"],
        )
        print("✓ RealtimeModel created successfully")
        return True
    except Exception as e:
        print(f"✗ Error creating model: {e}")
        return False

def main():
    print("=" * 60)
    print("LiveKit Gemini Agent Test")
    print("=" * 60)
    
    all_checks_passed = True
    
    # Check environment
    if not check_environment():
        all_checks_passed = False
    
    # Check imports
    if not check_imports():
        all_checks_passed = False
        return
    
    # Test model creation
    if not test_model_creation():
        all_checks_passed = False
    
    print("\n" + "=" * 60)
    if all_checks_passed:
        print("✓ All checks passed! Agent is ready to use.")
        print("\nTo run the agent:")
        print("  python livekit_agent.py console  # Terminal mode")
        print("  python livekit_agent.py dev       # Development mode")
    else:
        print("✗ Some checks failed. Please fix the issues above.")
    print("=" * 60)

if __name__ == "__main__":
    main()

