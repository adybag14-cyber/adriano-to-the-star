#!/bin/bash
# Start LiveKit Agent Script for Linux/Mac
# Usage: ./start-livekit-agent.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Starting LiveKit Agent...${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 is not installed!${NC}"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}📦 Creating virtual environment...${NC}"
    python3 -m venv venv
fi

# Activate virtual environment
echo -e "${YELLOW}🔧 Activating virtual environment...${NC}"
source venv/bin/activate

# Install/update dependencies
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}❌ requirements.txt not found!${NC}"
    exit 1
fi

echo -e "${YELLOW}📥 Installing dependencies...${NC}"
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Set environment variables
export LIVEKIT_URL="${LIVEKIT_URL:-wss://gemini-integration-pxcg6ngt.livekit.cloud}"

if [ -z "${GOOGLE_API_KEY}" ] && [ -n "${GEMINI_API_KEY}" ]; then
    export GOOGLE_API_KEY="${GEMINI_API_KEY}"
fi

if [ -z "${LIVEKIT_API_KEY}" ]; then
    echo "LIVEKIT_API_KEY is not set" >&2
    exit 1
fi
if [ -z "${LIVEKIT_API_SECRET}" ]; then
    echo "LIVEKIT_API_SECRET is not set" >&2
    exit 1
fi
if [ -z "${GOOGLE_API_KEY}" ]; then
    echo "GOOGLE_API_KEY (or GEMINI_API_KEY) is not set" >&2
    exit 1
fi

# Check if livekit_agent.py exists
if [ ! -f "livekit_agent.py" ]; then
    echo -e "${RED}❌ livekit_agent.py not found!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Starting LiveKit Agent...${NC}"
echo -e "${YELLOW}💡 Press Ctrl+C to stop${NC}"
echo ""

# Run the agent
python3 livekit_agent.py dev

