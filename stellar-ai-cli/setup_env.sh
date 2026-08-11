#!/bin/bash
# LiveKit Agent Environment Setup Script
# Run this script to set up all required environment variables

echo "Setting up LiveKit Agent environment variables..."

# LiveKit Server Configuration
export LIVEKIT_URL="${LIVEKIT_URL:-wss://gemini-integration-pxcg6ngt.livekit.cloud}"

if [ -z "${LIVEKIT_API_KEY}" ]; then
    read -r -p "Enter LIVEKIT_API_KEY: " LIVEKIT_API_KEY
    export LIVEKIT_API_KEY
fi
if [ -z "${LIVEKIT_API_SECRET}" ]; then
    read -rs -p "Enter LIVEKIT_API_SECRET: " LIVEKIT_API_SECRET
    echo
    export LIVEKIT_API_SECRET
fi

echo "✓ LiveKit URL: $LIVEKIT_URL"
echo "✓ LiveKit API Key is set (length: ${#LIVEKIT_API_KEY})"
echo "✓ LiveKit API Secret: [HIDDEN]"

# Google API Key Configuration
if [ -z "${GOOGLE_API_KEY}" ] && [ -n "${GEMINI_API_KEY}" ]; then
    export GOOGLE_API_KEY="${GEMINI_API_KEY}"
fi
if [ -z "${GOOGLE_API_KEY}" ]; then
    read -r -p "Enter GOOGLE_API_KEY: " GOOGLE_API_KEY
    export GOOGLE_API_KEY
fi
echo "✓ GOOGLE_API_KEY is set (length: ${#GOOGLE_API_KEY})"

echo ""
echo "Environment setup complete!"
echo ""
echo "To test the setup:"
echo "  python test_full_setup.py"
echo ""
echo "To run the agent:"
echo "  python livekit_agent.py console  # Terminal mode (no server needed)"
echo "  python livekit_agent.py dev      # Development mode"
echo "  python livekit_agent.py start     # Production mode"

