#!/usr/bin/env python3
"""
Gemini Live API Service
Handles Live API models using google-genai SDK
Requires: pip install google-genai
"""

import asyncio
import json
import os
import sys

# Set environment variables before importing genai
os.environ['GOOGLE_CLOUD_PROJECT'] = os.getenv('GOOGLE_CLOUD_PROJECT', 'adriano-broadband')
os.environ['GOOGLE_CLOUD_LOCATION'] = os.getenv('GOOGLE_CLOUD_LOCATION', 'us-central1')
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', './stellar-ai-key.json')
os.environ['GOOGLE_GENAI_USE_VERTEXAI'] = 'True'

from google import genai
from google.genai.types import Content, LiveConnectConfig, Modality, Part

# Configuration
GOOGLE_CLOUD_PROJECT = os.environ['GOOGLE_CLOUD_PROJECT']
GOOGLE_CLOUD_LOCATION = os.environ['GOOGLE_CLOUD_LOCATION']
GOOGLE_APPLICATION_CREDENTIALS = os.environ['GOOGLE_APPLICATION_CREDENTIALS']

# Initialize client with Vertex AI - try different initialization methods
try:
    # Method 1: Use environment variables (preferred)
    client = genai.Client(
        vertexai=True,
        project=GOOGLE_CLOUD_PROJECT,
        location=GOOGLE_CLOUD_LOCATION
    )
except Exception as e1:
    try:
        # Method 2: Let SDK auto-detect from environment
        client = genai.Client(vertexai=True)
    except Exception as e2:
        print(f"Error initializing client: {e1}, {e2}")
        sys.exit(1)

async def handle_live_api_request(model_name, text_input):
    """
    Handle Live API request
    
    Args:
        model_name: Model name (e.g., 'gemini-2.0-flash-live-preview-04-09')
        text_input: User's text input
    
    Returns:
        Response text from Live API
    """
    try:
        # Connect to Live API
        async with client.aio.live.connect(
            model=model_name,
            config=LiveConnectConfig(response_modalities=[Modality.TEXT]),
        ) as session:
            # Send text input
            await session.send_client_content(
                turns=Content(role="user", parts=[Part(text=text_input)])
            )

            # Receive response
            response = []
            async for message in session.receive():
                if message.text:
                    response.append(message.text)

            return "".join(response)
    except Exception as e:
        return f"Error: {str(e)}"

async def main():
    """Main function for testing"""
    if len(sys.argv) < 3:
        print("Usage: python live-api-service.py <model_name> <text_input>")
        print("Example: python live-api-service.py gemini-2.0-flash-live-preview-04-09 'Hello'")
        sys.exit(1)
    
    model_name = sys.argv[1]
    text_input = sys.argv[2]
    
    print(f"Connecting to Live API with model: {model_name}")
    print(f"Input: {text_input}")
    print()
    
    response = await handle_live_api_request(model_name, text_input)
    print(f"Response: {response}")

if __name__ == "__main__":
    asyncio.run(main())

