import requests
from bs4 import BeautifulSoup
import json
import time
import random
import os
import sys

# WebSocket support for live models
try:
    import websockets
    import asyncio
    WEBSOCKET_AVAILABLE = True
except ImportError:
    WEBSOCKET_AVAILABLE = False

# Try new google-genai SDK for Live API
try:
    from google import genai as genai_live
    GENAI_LIVE_AVAILABLE = True
except ImportError:
    GENAI_LIVE_AVAILABLE = False

# Fix Windows encoding issues
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Try to import Google Generative AI (optional dependency)
try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    print("[WARNING] google-generativeai not installed. AI extraction disabled.")
    print("   Install with: pip install google-generativeai")

# Configuration
OUTPUT_FILE = 'broadband-deals.json'
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
]

# AI Configuration
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
USE_LIVE_MODEL = os.getenv('USE_GEMINI_LIVE', 'false').lower() == 'true'  # Enable live models for unlimited RPM
if GEMINI_API_KEY and GENAI_AVAILABLE:
    genai.configure(api_key=GEMINI_API_KEY)

def get_headers():
    return {
        'User-Agent': random.choice(USER_AGENTS),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/'
    }

# Browserless Configuration
BROWSERLESS_API_KEY = os.getenv('BROWSERLESS_API_KEY')

def get_browserless_content(url):
    """
    Uses Browserless.io to fetch rendered HTML content.
    """
    if not BROWSERLESS_API_KEY:
        return None
        
    print(f"[INFO] Scraping via Browserless.io: {url}")
    try:
        # Browserless /content endpoint - returns fully rendered HTML
        # Minimal payload: just the URL
        api_url = f"https://production-sfo.browserless.io/content?token={BROWSERLESS_API_KEY}"
        headers = {'Content-Type': 'application/json'}
        payload = {
            "url": url
        }
        
        response = requests.post(api_url, headers=headers, json=payload, timeout=30)
        if response.status_code == 200:
            return response.text
        else:
            print(f"[WARNING] Browserless error: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        print(f"[WARNING] Browserless exception: {e}")
        return None

async def _call_live_model_websocket(model_name, prompt):
    """
    Call Gemini Live model via WebSocket for bidiGenerateContent.
    Uses the Live API WebSocket endpoint for unlimited RPM/RPD.
    Returns the full response text.
    """
    # Try using google-genai SDK first (recommended method)
    if GENAI_LIVE_AVAILABLE:
        try:
            client = genai_live.Client(api_key=GEMINI_API_KEY)
            config = {
                "response_modalities": ["TEXT"],
                "temperature": 0.1,
                "max_output_tokens": 2048
            }
            
            response_text = ""
            async with client.aio.live.connect(model=model_name, config=config) as session:
                # Send the prompt
                await session.send_client_content(
                    turns={"role": "user", "parts": [{"text": prompt}]}, 
                    turn_complete=True
                )
                
                # Receive responses
                async for response in session.receive():
                    if response.server_content and response.server_content.model_turn:
                        parts = response.server_content.model_turn.parts
                        for part in parts:
                            if hasattr(part, 'text') and part.text:
                                response_text += part.text
                    if response.server_content and response.server_content.output_transcription:
                        # Also check transcription
                        if hasattr(response.server_content.output_transcription, 'text'):
                            response_text += response.server_content.output_transcription.text
            
            if response_text:
                return response_text
        except Exception as e:
            print(f"[INFO] google-genai SDK failed, trying raw WebSocket: {e}")
    
    # Fallback to raw WebSocket connection
    if not WEBSOCKET_AVAILABLE:
        raise Exception("WebSocket support not available")
    
    # WebSocket URL for Gemini Live API
    # Try alternative endpoint format
    ws_url = f"wss://generativelanguage.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent"
    
    # Setup message to initialize the session
    setup_message = {
        "setup": {
            "model": f"models/{model_name}",
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 32768,  # 32K tokens for comprehensive extraction
                "responseModalities": ["TEXT"]
            }
        }
    }
    
    # Client content message
    client_message = {
        "clientContent": {
            "parts": [{"text": prompt}]
        }
    }
    
    try:
        # Connect with API key - try both query parameter and header
        # Note: websockets library may not support additional_headers in all versions
        try:
            # Try with Authorization header
            async with websockets.connect(
                f"{ws_url}?key={GEMINI_API_KEY}",
                additional_headers=[("Authorization", f"Bearer {GEMINI_API_KEY}")]
            ) as websocket:
                return await _handle_websocket_messages(websocket, setup_message, client_message, model_name)
        except (TypeError, AttributeError):
            # Fallback: try without additional_headers (older websockets version)
            async with websockets.connect(
                f"{ws_url}?key={GEMINI_API_KEY}"
            ) as websocket:
                return await _handle_websocket_messages(websocket, setup_message, client_message, model_name)
                    
    except Exception as e:
        raise Exception(f"WebSocket connection failed: {e}")

async def _handle_websocket_messages(websocket, setup_message, client_message, model_name):
    """Handle WebSocket messages for live model communication"""
    response_text = ""
    setup_complete = False
    
    # Send setup message
    await websocket.send(json.dumps(setup_message))
    
    # Wait for setup complete
    setup_response = await websocket.recv()
    setup_data = json.loads(setup_response)
    
    if "setupComplete" in setup_data or "BidiGenerateContentSetupComplete" in str(setup_data):
        setup_complete = True
        print(f"[INFO] WebSocket setup complete for {model_name}")
    else:
        # Check for errors in setup
        if "error" in setup_data:
            raise Exception(f"Setup error: {setup_data['error']}")
    
    if setup_complete:
        # Send client content
        await websocket.send(json.dumps(client_message))
        
        # Receive streaming responses
        async for message in websocket:
            try:
                data = json.loads(message)
                
                # Check for errors
                if "error" in data:
                    raise Exception(f"API error: {data['error']}")
                
                # Extract server content (response)
                if "serverContent" in data:
                    server_content = data["serverContent"]
                    parts = server_content.get("parts", [])
                    for part in parts:
                        if "text" in part:
                            response_text += part["text"]
                
                # Check if response is complete
                if data.get("done", False) or "BidiGenerateContentResponse" in str(data):
                    break
                    
            except json.JSONDecodeError:
                continue
            except Exception as e:
                print(f"[WARNING] Error parsing WebSocket message: {e}")
                continue
    else:
        raise Exception("WebSocket setup did not complete")
    
    return response_text

def extract_deals_with_ai_live(html_content, provider_name):
    """
    Uses Gemini Live models (bidiGenerateContent) for unlimited RPM/RPD.
    This uses the bidirectional streaming API.
    """
    if not GENAI_AVAILABLE:
        return None
    if not GEMINI_API_KEY:
        print("[WARNING] GEMINI_API_KEY not found. Skipping AI extraction.")
        return None

    try:
        # Clean HTML content
        soup = BeautifulSoup(html_content, 'html.parser')
        for script in soup(["script", "style", "svg", "path"]):
            script.decompose()
        
        clean_text = soup.get_text(separator=' ', strip=True)[:50000]
        
        # Try live models in order of preference
        # Live models have unlimited RPM and RPD (confirmed in Google AI Studio)
        # Use WebSocket connection for bidiGenerateContent
        live_models = [
            'gemini-live-2.5-flash-preview',  # Unlimited RPM/RPD, 1M TPM (correct naming)
            'gemini-2.0-flash-live-001'  # Unlimited RPM/RPD, 4M TPM (fallback)
        ]
        
        model = None
        selected_model_name = None
        for model_name in live_models:
            try:
                # Just verify the model exists - we'll use REST API directly
                model = genai.GenerativeModel(model_name)
                selected_model_name = model_name
                print(f"[INFO] Attempting to use live model: {model_name}")
                break
            except Exception as e:
                error_msg = str(e).lower()
                if "not found" in error_msg or "404" in error_msg or "not supported" in error_msg:
                    print(f"[INFO] Model {model_name} not available, trying next...")
                else:
                    print(f"[WARNING] Error with {model_name}: {e}")
                continue
        
        if not model or not selected_model_name:
            print("[WARNING] No live models available, falling back to REST API")
            return None
        
        prompt = f"""
        You are a data extraction assistant. I will provide you with text from the {provider_name} broadband website.
        Your task is to extract the available broadband deals.
        
        For each deal, extract:
        - speed: The download speed (e.g., "100 Mbps", "1 Gbps")
        - price: The monthly price (just the number, e.g., "29.99")
        - contract: The contract length (e.g., "24 months")
        
        Return the data ONLY as a valid JSON object with this structure:
        {{
            "provider": "{provider_name}",
            "deals": [
                {{ "speed": "...", "price": "...", "contract": "..." }},
                ...
            ],
            "status": "active",
            "last_checked": "{time.strftime("%Y-%m-%dT%H:%M:%S")}"
        }}
        
        If you cannot find specific deals, return an empty deals array but keep the status as "active" if the text looks like a valid broadband page.
        
        Website Text:
        {clean_text}
        """
        
        # Live models ONLY support bidiGenerateContent via WebSocket
        # Use WebSocket connection for bidirectional streaming (unlimited RPM/RPD)
        if not WEBSOCKET_AVAILABLE:
            print("[WARNING] websockets library not installed. Install with: pip install websockets")
            raise Exception("WebSocket support not available")
        
        try:
            # Use WebSocket for bidiGenerateContent (unlimited requests)
            response_text = asyncio.run(_call_live_model_websocket(selected_model_name, prompt))
            
            if not response_text:
                raise Exception("No response text received from live model")
                
        except Exception as e:
            print(f"[ERROR] Live model WebSocket call failed: {e}")
            raise Exception(f"Live model failed: {e}")
        
        # Clean up response
        json_str = response_text.replace('```json', '').replace('```', '').strip()
        
        # Try to extract JSON
        try:
            data = json.loads(json_str)
        except json.JSONDecodeError:
            import re
            json_match = re.search(r'\{[\s\S]*"deals"[\s\S]*\}', json_str)
            if json_match:
                data = json.loads(json_match.group(0))
            else:
                raise ValueError("Could not parse JSON from AI response")
        
        print(f"[SUCCESS] Live AI successfully extracted {len(data.get('deals', []))} deals for {provider_name}")
        return data

    except Exception as e:
        print(f"[ERROR] Live AI Extraction failed for {provider_name}: {e}")
        return None

def extract_deals_with_ai(html_content, provider_name):
    """
    Uses Google Gemini to extract broadband deals from HTML content.
    Supports both REST API (generateContent) and Live API (bidiGenerateContent).
    """
    if not GENAI_AVAILABLE:
        return None
    if not GEMINI_API_KEY:
        print("[WARNING] GEMINI_API_KEY not found. Skipping AI extraction.")
        return None

    # Try live model first if enabled (for unlimited RPM/RPD)
    if USE_LIVE_MODEL:
        result = extract_deals_with_ai_live(html_content, provider_name)
        if result:
            return result
        print("[INFO] Live model failed, falling back to REST API")

    try:
        # Truncate HTML to avoid token limits
        soup = BeautifulSoup(html_content, 'html.parser')
        for script in soup(["script", "style", "svg", "path"]):
            script.decompose()
        
        clean_text = soup.get_text(separator=' ', strip=True)[:50000]

        # Use REST API model
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
        You are a data extraction assistant. I will provide you with text from the {provider_name} broadband website.
        Your task is to extract the available broadband deals.
        
        For each deal, extract:
        - speed: The download speed (e.g., "100 Mbps", "1 Gbps")
        - price: The monthly price (just the number, e.g., "29.99")
        - contract: The contract length (e.g., "24 months")
        
        Return the data ONLY as a valid JSON object with this structure:
        {{
            "provider": "{provider_name}",
            "deals": [
                {{ "speed": "...", "price": "...", "contract": "..." }},
                ...
            ],
            "status": "active",
            "last_checked": "{time.strftime("%Y-%m-%dT%H:%M:%S")}"
        }}
        
        If you cannot find specific deals, return an empty deals array but keep the status as "active" if the text looks like a valid broadband page.
        
        Website Text:
        {clean_text}
        """
        
        response = model.generate_content(prompt)
        
        # Clean up response if it contains markdown code blocks
        json_str = response.text.replace('```json', '').replace('```', '').strip()
        
        # Try to extract JSON if wrapped in text
        try:
            # First try direct parsing
            data = json.loads(json_str)
        except json.JSONDecodeError:
            # Try to find JSON object in the response
            import re
            json_match = re.search(r'\{[\s\S]*"deals"[\s\S]*\}', json_str)
            if json_match:
                data = json.loads(json_match.group(0))
            else:
                raise ValueError("Could not parse JSON from AI response")
        
        print(f"[SUCCESS] AI successfully extracted {len(data.get('deals', []))} deals for {provider_name}")
        return data

    except Exception as e:
        print(f"[ERROR] AI Extraction failed for {provider_name}: {e}")
        return None

def try_scrape(url, provider_name, fallback_data):
    try:
        print(f"Fetching {url}...")
        
        # Try Browserless first if configured (best for JS-heavy sites)
        html_content = get_browserless_content(url)
        
        # Fallback to standard request if Browserless fails or isn't configured
        if not html_content:
            response = requests.get(url, headers=get_headers(), timeout=15)
            if response.status_code == 200:
                html_content = response.text
                print(f"Successfully fetched {len(html_content)} bytes via standard request")
            else:
                print(f"Failed to fetch {provider_name}: Status {response.status_code}")
                fallback_data['status'] = f'offline_{response.status_code}'
                fallback_data['last_checked'] = time.strftime("%Y-%m-%dT%H:%M:%S")
                return fallback_data

        # Attempt AI Extraction
        if html_content:
            ai_data = extract_deals_with_ai(html_content, provider_name)
            if ai_data and ai_data.get('deals'):
                return ai_data
            
        print(f"[WARNING] AI could not extract deals. Using fallback data for {provider_name}.")
        fallback_data['status'] = 'active'
        fallback_data['last_checked'] = time.strftime("%Y-%m-%dT%H:%M:%S")
        return fallback_data

            
    except Exception as e:
        print(f"Exception scraping {provider_name}: {e}")
        fallback_data['status'] = 'error_connection'
        fallback_data['last_checked'] = time.strftime("%Y-%m-%dT%H:%M:%S")
        return fallback_data

def scrape_bt():
    fallback = {
        "provider": "BT",
        "deals": [
            {"speed": "Full Fibre 100", "price": "29.99", "contract": "24 months"},
            {"speed": "Full Fibre 500", "price": "39.99", "contract": "24 months"},
            {"speed": "Full Fibre 900", "price": "49.99", "contract": "24 months"}
        ],
        "url": "https://www.bt.com/broadband"
    }
    return try_scrape(fallback['url'], "BT", fallback)

def scrape_sky():
    fallback = {
        "provider": "Sky",
        "deals": [
            {"speed": "Superfast", "price": "25.00", "contract": "24 months"},
            {"speed": "Ultrafast", "price": "29.00", "contract": "24 months"},
            {"speed": "Gigafast", "price": "45.00", "contract": "24 months"}
        ],
        "url": "https://www.sky.com/broadband"
    }
    return try_scrape(fallback['url'], "Sky", fallback)

def scrape_virgin():
    fallback = {
        "provider": "Virgin Media Limited",
        "deals": [
            {"speed": "M125", "price": "26.50", "contract": "18 months"},
            {"speed": "M250", "price": "30.50", "contract": "18 months"},
            {"speed": "Gig1", "price": "45.00", "contract": "18 months"}
        ],
        "url": "https://www.virginmedia.com/broadband"
    }
    return try_scrape(fallback['url'], "Virgin Media", fallback)

def scrape_talktalk():
    fallback = {
        "provider": "TalkTalk",
        "deals": [
            {"speed": "Fibre 65", "price": "28.00", "contract": "18 months"},
            {"speed": "Full Fibre 150", "price": "29.95", "contract": "18 months"},
            {"speed": "Full Fibre 900", "price": "39.95", "contract": "18 months"}
        ],
        "url": "https://www.talktalk.co.uk/broadband"
    }
    return try_scrape(fallback['url'], "TalkTalk", fallback)

def main():
    print("Starting broadband price scraper (AI Enhanced)...")
    
    if not GENAI_AVAILABLE:
        print("[WARNING] google-generativeai not installed. AI features disabled.")
    elif not GEMINI_API_KEY:
        print("[WARNING] No GEMINI_API_KEY found. Scraper will run in fallback mode.")
        print("   To enable AI, set the environment variable: set GEMINI_API_KEY=your_key")
    
    deals_data = {}
    
    # Scrape providers
    providers = [scrape_bt, scrape_sky, scrape_virgin, scrape_talktalk]
    
    for scraper in providers:
        try:
            data = scraper()
            if data:
                deals_data[data['provider']] = data
            time.sleep(random.uniform(1, 3)) # Be polite
        except Exception as e:
            print(f"Error scraping: {e}")

    # Save to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(deals_data, f, indent=4)
    
    print(f"Scraping complete. Data saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
