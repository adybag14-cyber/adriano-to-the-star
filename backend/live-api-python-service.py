#!/usr/bin/env python3
"""
Gemini Live API Python Service
Handles Live API models using google-genai SDK
Communicates with Node.js backend via stdin/stdout JSON
"""

import asyncio
import json
import os
import sys
from google import genai
from google.genai import types

# Configuration from environment
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') or os.getenv('GOOGLE_AI_API_KEY')
GOOGLE_CLOUD_PROJECT = os.getenv('GOOGLE_CLOUD_PROJECT', 'adriano-broadband')
GOOGLE_CLOUD_LOCATION = os.getenv('GOOGLE_CLOUD_LOCATION', 'us-central1')

# Initialize client
# Live API REQUIRES Vertex AI (OAuth2), not API keys
# Even if API key is available, we must use Vertex AI for Live API
try:
    # Try Vertex AI first (required for Live API)
    client = genai.Client(
        vertexai=True,
        project=GOOGLE_CLOUD_PROJECT,
        location=GOOGLE_CLOUD_LOCATION
    )
    print(json.dumps({"status": "initialized", "method": "vertexai", "note": "Live API requires Vertex AI"}), flush=True)
except Exception as e:
    # Fallback: Try with API key (won't work for Live API, but for error message)
    error_msg = str(e)
    if GEMINI_API_KEY:
        print(json.dumps({
            "status": "error", 
            "message": f"Live API requires Vertex AI authentication. Error: {error_msg}",
            "suggestion": "Set up Google Cloud Vertex AI with service account credentials"
        }), flush=True)
    else:
        print(json.dumps({
            "status": "error", 
            "message": f"Vertex AI initialization failed: {error_msg}",
            "suggestion": "Set GOOGLE_CLOUD_PROJECT, GOOGLE_CLOUD_LOCATION, and GOOGLE_APPLICATION_CREDENTIALS"
        }), flush=True)
    sys.exit(1)

# Available Live models (in order of preference)
LIVE_MODELS = [
    "gemini-2.5-flash-live",
    "gemini-2.5-flash-native-audio-preview-09-2025",
    "gemini-live-2.5-flash-preview",
    "gemini-live-2.5-flash",
    "gemini-2.0-flash-live-preview-04-09"
]

async def handle_live_api_request(model_name, text_input, response_modalities=["TEXT"], request_id=None):
    """
    Handle Live API request using official SDK
    
    Args:
        model_name: Model name (e.g., 'gemini-2.5-flash-live')
        text_input: User's text input
        response_modalities: List of response types (["TEXT"] or ["AUDIO"] or both)
        request_id: Request ID for tracking
    
    Returns:
        Response text/audio from Live API
    """
    # Determine which models to try
    if model_name:
        # Try requested model first, then others
        models_to_try = [model_name] + [m for m in LIVE_MODELS if m != model_name]
    else:
        models_to_try = LIVE_MODELS
    
    last_error = None
    
    for try_model in models_to_try:
        try:
            # Configure Live API connection
            config = types.LiveConnectConfig(
                response_modalities=response_modalities
            )
            
            print(json.dumps({
                "type": "connecting",
                "model": try_model,
                "request_id": request_id
            }), flush=True)
            
            # Connect to Live API
            async with client.aio.live.connect(
                model=try_model,
                config=config
            ) as session:
                print(json.dumps({
                    "type": "connected",
                    "model": try_model,
                    "request_id": request_id
                }), flush=True)
                
                # Send text input
                await session.send_client_content(
                    turns=types.Content(
                        role="user",
                        parts=[types.Part(text=text_input)]
                    )
                )
                
                # Receive response
                response_text = ""
                response_audio = []
                
                async for message in session.receive():
                    if message.text:
                        response_text += message.text
                        # Send incremental updates to Node.js
                        print(json.dumps({
                            "type": "text_chunk",
                            "text": message.text,
                            "model": try_model,
                            "request_id": request_id
                        }), flush=True)
                    
                    if message.data:  # Audio data
                        response_audio.append(message.data)
                        print(json.dumps({
                            "type": "audio_chunk",
                            "data_length": len(message.data),
                            "model": try_model,
                            "request_id": request_id
                        }), flush=True)
                
                # Send final response
                result = {
                    "type": "complete",
                    "text": response_text,
                    "audio_chunks": len(response_audio),
                    "model": try_model,
                    "request_id": request_id
                }
                
                print(json.dumps(result), flush=True)
                return result
                
        except Exception as e:
            last_error = str(e)
            error_msg = str(e).lower()
            
            # If model not found, try next model
            if "not found" in error_msg or "404" in error_msg or "not available" in error_msg:
                print(json.dumps({
                    "type": "error",
                    "message": f"Model {try_model} not available: {str(e)}",
                    "trying_next": True,
                    "request_id": request_id
                }), flush=True)
                continue
            else:
                # Other error - might be auth or config issue
                print(json.dumps({
                    "type": "error",
                    "message": f"Error with {try_model}: {str(e)}",
                    "trying_next": len(models_to_try) > models_to_try.index(try_model) + 1,
                    "request_id": request_id
                }), flush=True)
                if "auth" in error_msg or "permission" in error_msg:
                    # Auth error - don't try other models
                    break
    
    # All models failed
    error_result = {
        "type": "error",
        "message": f"All Live models failed. Last error: {last_error}",
        "request_id": request_id
    }
    print(json.dumps(error_result), flush=True)
    raise Exception(f"All Live models failed. Last error: {last_error}")

async def main():
    """Main loop: Read JSON from stdin, process, send JSON to stdout"""
    print(json.dumps({"status": "ready"}), flush=True)
    
    try:
        for line in sys.stdin:
            try:
                request = json.loads(line.strip())
                
                if request.get("action") == "process":
                    model_name = request.get("model", "gemini-2.5-flash-live")
                    text_input = request.get("text", "")
                    response_modalities = request.get("response_modalities", ["TEXT"])
                    # Handle both camelCase (from JS) and snake_case (Python convention)
                    request_id = request.get("requestId") or request.get("request_id")
                    
                    print(json.dumps({
                        "type": "processing",
                        "model": model_name,
                        "request_id": request_id,
                        "text_length": len(text_input)
                    }), flush=True)
                    
                    try:
                        await handle_live_api_request(model_name, text_input, response_modalities, request_id)
                    except Exception as e:
                        print(json.dumps({
                            "type": "error",
                            "message": f"Failed to process request: {str(e)}",
                            "request_id": request_id
                        }), flush=True)
                    
                elif request.get("action") == "test":
                    # Test connection
                    print(json.dumps({
                        "type": "test_response",
                        "status": "ok",
                        "api_key_set": bool(GEMINI_API_KEY),
                        "client_initialized": client is not None
                    }), flush=True)
                    
            except json.JSONDecodeError:
                print(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON"
                }), flush=True)
            except Exception as e:
                print(json.dumps({
                    "type": "error",
                    "message": str(e)
                }), flush=True)
                
    except KeyboardInterrupt:
        print(json.dumps({"status": "shutdown"}), flush=True)
    except Exception as e:
        print(json.dumps({
            "type": "error",
            "message": f"Fatal error: {str(e)}"
        }), flush=True)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())

