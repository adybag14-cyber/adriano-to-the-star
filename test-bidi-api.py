import asyncio
import os
import json
import sys
import websockets

# Fix Windows encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

API_KEY = os.getenv('GEMINI_API_KEY')
if not API_KEY:
    print("Error: GEMINI_API_KEY not set")
    sys.exit(1)

# Models to test
MODELS = [
    "models/gemini-2.5-flash-native-audio-latest",
    "models/gemini-2.5-flash-native-audio-preview-09-2025",
    "models/gemini-2.5-flash-live-preview",
    "models/gemini-2.0-flash-exp"
]

HOST = "generativelanguage.googleapis.com"
# Try Vertex AI endpoint structure as a fallback
URI = f"wss://{HOST}/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?key={API_KEY}"

async def test_model(model_name):
    print(f"\n[TEST] Testing model: {model_name}")
    print(f"   Connecting to: {URI}")
    
    try:
        async with websockets.connect(URI) as ws:
            print("   [OK] Connected to WebSocket")
            
            # 1. Send Setup Message
            setup_msg = {
                "setup": {
                    "model": model_name,
                    "generation_config": {
                        "response_modalities": ["TEXT"] # Request text back for this test
                    }
                }
            }
            await ws.send(json.dumps(setup_msg))
            print("   [SENT] Setup message")
            
            # 2. Wait for Setup Complete
            while True:
                try:
                    raw_response = await asyncio.wait_for(ws.recv(), timeout=10.0)
                    response = json.loads(raw_response)
                    if "setupComplete" in response:
                        print("   [OK] Setup complete received")
                        break
                    if "serverContent" in response:
                        # Sometimes we might get content early?
                        pass
                except asyncio.TimeoutError:
                    print("   [ERROR] Timeout waiting for setup complete")
                    return False
                except Exception as e:
                    print(f"   [ERROR] Error during setup: {e}")
                    return False

            # 3. Send Client Content
            client_msg = {
                "client_content": {
                    "turns": [
                        {
                            "role": "user",
                            "parts": [{"text": "Hello, are you working?"}]
                        }
                    ],
                    "turn_complete": True
                }
            }
            await ws.send(json.dumps(client_msg))
            print("   [SENT] Client content")
            
            # 4. Receive Responses
            print("   [WAITING] Waiting for response...")
            response_text = ""
            try:
                while True:
                    raw_response = await asyncio.wait_for(ws.recv(), timeout=10.0)
                    response = json.loads(raw_response)
                    
                    if "serverContent" in response:
                        content = response["serverContent"]
                        if "modelTurn" in content:
                            parts = content["modelTurn"].get("parts", [])
                            for part in parts:
                                if "text" in part:
                                    text = part["text"]
                                    print(f"      -> Chunk: {text}")
                                    response_text += text
                            
                            if content.get("turnComplete"):
                                print("   [OK] Turn complete received")
                                break
            except asyncio.TimeoutError:
                print("   [WARN] Timeout waiting for response (might be complete)")
            
            if response_text:
                print(f"   [SUCCESS] Full response: {response_text}")
                return True
            else:
                print("   [FAIL] No text response received")
                return False

    except websockets.exceptions.InvalidStatusCode as e:
        print(f"   [FAIL] WebSocket connection failed: {e.status_code} {e}")
        return False
    except Exception as e:
        print(f"   [ERROR] Unexpected error: {e}")
        return False

async def main():
    print("Starting WebSocket Bidi API Test")
    print("=" * 60)
    
    results = {}
    
    for model in MODELS:
        success = await test_model(model)
        results[model] = "SUCCESS" if success else "FAILED"
        
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    for model, status in results.items():
        print(f"{model}: {status}")

if __name__ == "__main__":
    asyncio.run(main())
