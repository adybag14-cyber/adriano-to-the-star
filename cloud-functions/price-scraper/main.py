"""
Google Cloud Function for Real-Time Broadband Price Scraping
Uses Gemini AI for intelligent price extraction from provider websites
Supports Live Models via WebSocket for unlimited RPM/RPD
"""

import functions_framework  # type: ignore
from flask import jsonify  # type: ignore
import requests
from bs4 import BeautifulSoup
import re
import json
import ipaddress
import socket
from urllib.parse import quote
from urllib.parse import urlparse
from urllib.parse import urljoin
import logging
import os
import concurrent.futures

# Configure logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# WebSocket support for live models
WEBSOCKET_AVAILABLE = False
try:
    import websockets
    import asyncio
    WEBSOCKET_AVAILABLE = True
except ImportError:
    logger.warning("websockets library not available. Live models will use REST API fallback.")

# Try new google-genai SDK for Live API
GENAI_LIVE_AVAILABLE = False
try:
    from google import genai as genai_live
    GENAI_LIVE_AVAILABLE = True
except ImportError:
    GENAI_LIVE_AVAILABLE = False

# Gemini API configuration
# Use provided API key as default, allow override via environment variable
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')
# Enable live models by default for unlimited RPM/RPD
USE_LIVE_MODEL = os.environ.get('USE_GEMINI_LIVE', 'true').lower() == 'true'
# REST API endpoint - using Gemini 2.5 Flash (fallback only, prefer live models)
GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
GEMINI_API_URL_FALLBACK = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
GEMINI_API_URL_FALLBACK2 = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
# Live API endpoint - using Gemini 2.5 Flash Live (unlimited RPM/RPD)
GEMINI_LIVE_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-live:bidiGenerateContent'

# Log configuration on startup
if GEMINI_API_KEY:
    logger.info(f"Gemini API configured. Live models enabled: {USE_LIVE_MODEL}. WebSocket available: {WEBSOCKET_AVAILABLE}")
else:
    logger.warning("Gemini API key not configured - will fall back to regex extraction")

# CORS headers for browser requests
NODE_ENV = (os.environ.get('NODE_ENV') or ('production' if (os.environ.get('K_SERVICE') or os.environ.get('FUNCTION_TARGET')) else 'development')).lower()
CORS_ORIGINS_ENV = os.environ.get('CORS_ORIGINS', '')
ALLOWED_CORS_ORIGINS = [o.strip() for o in CORS_ORIGINS_ENV.split(',') if o.strip()]
MAX_REQUEST_BYTES = 1_000_000

CORS_HEADERS = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '3600'
}

def _is_origin_allowed(origin: str) -> bool:
    if not origin:
        return True
    if NODE_ENV != 'production':
        return True
    if not ALLOWED_CORS_ORIGINS:
        return False
    return origin in ALLOWED_CORS_ORIGINS

def _get_cors_headers(origin: str):
    headers = dict(CORS_HEADERS)
    if NODE_ENV != 'production':
        if origin:
            headers['Access-Control-Allow-Origin'] = origin
            headers['Vary'] = 'Origin'
        return headers
    if origin and origin in ALLOWED_CORS_ORIGINS:
        headers['Access-Control-Allow-Origin'] = origin
        headers['Vary'] = 'Origin'
    return headers

# Known provider URLs mapping
PROVIDER_URLS = {
    'bt': 'https://www.bt.com/broadband/deals',
    'bt broadband': 'https://www.bt.com/broadband',
    'sky': 'https://www.sky.com/shop/broadband-talk/',
    'sky broadband': 'https://www.sky.com/broadband',
    'virgin media': 'https://www.virginmedia.com/broadband',
    'talktalk': 'https://www.talktalk.co.uk/shop/broadband',
    'talktalk broadband': 'https://www.talktalk.co.uk/broadband',
    'vodafone': 'https://www.vodafone.co.uk/broadband',
    'plusnet': 'https://www.plus.net/broadband/',
    'ee': 'https://ee.co.uk/broadband',
    'now': 'https://www.nowtv.com/broadband',
    'hyperoptic': 'https://www.hyperoptic.com/broadband/',
    'hyperoptic limited': 'https://www.hyperoptic.com/broadband/',
    'community fibre': 'https://communityfibre.co.uk/home-broadband',
    'community fibre ltd': 'https://www.communityfibre.co.uk',
    'gigaclear': 'https://www.gigaclear.com/residential',
    'zen': 'https://www.zen.co.uk/broadband',
    'shell energy': 'https://www.shellenergy.co.uk/broadband',
    'utility warehouse': 'https://www.utilitywarehouse.co.uk/services/broadband',
    'utility warehouse broadband': 'https://www.utilitywarehouse.co.uk/broadband',
    'three': 'https://www.three.co.uk/broadband',
    'three uk': 'https://www.three.co.uk/broadband',
    'youfibre': 'https://www.youfibre.com/packages',
    'toob': 'https://www.toob.co.uk/',
    'trooli': 'https://www.trooli.com/packages/',
    'lightning fibre': 'https://www.lightningfibre.co.uk/packages/',
    'cuckoo': 'https://www.cuckoo.co/our-broadband',
    'zzoomm': 'https://www.zzoomm.com/packages',
    'yayzi': 'https://yayzi.com/packages/',
    'v4 consumer': 'https://www.v4consumer.co.uk/residential/broadband',
    'brawband': 'https://www.brawband.com',
    'brsk': 'https://www.brsk.co.uk',
    # Additional providers from knownProviderData
    'lit fibre': 'https://www.litfibre.com',
    'gofibre': 'https://www.gofibre.co.uk',
    'fibrus': 'https://www.fibrus.com',
    'truespeed': 'https://www.truespeed.com',
    'truespeed communications ltd': 'https://www.truespeed.com',
    'g.network': 'https://www.g.network',
    'giganet': 'https://www.giganet.uk',
    'giganet (cuckoo fibre ltd)': 'https://www.giganet.uk',
    'kcom': 'https://www.kcom.com',
    'airband': 'https://www.airband.co.uk',
    'county broadband': 'https://www.countybroadband.co.uk',
    'wessex internet': 'https://www.wessexinternet.com',
    'wildanet': 'https://www.wildanet.com',
    'voneus': 'https://www.voneus.com',
    'quickline': 'https://www.quickline.co.uk',
    'b4rn': 'https://b4rn.org.uk',
    'aa.net': 'https://www.aa.net.uk',
    'idnet': 'https://www.idnet.com',
    'onestream': 'https://www.onestream.co.uk',
    'origin broadband': 'https://www.originbroadband.com',
    'wightfibre': 'https://www.wightfibre.com',
    'ogi': 'https://www.ogi.wales',
    'connexin': 'https://www.connexin.co.uk',
    # Additional missing providers
    'giffgaff': 'https://www.giffgaff.com/broadband',
    'andrews & arnold': 'https://www.aa.net.uk',
    'andrews and arnold': 'https://www.aa.net.uk',
    'acorn broadband': 'https://www.acornbroadband.co.uk',
}

# User agent to mimic a real browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-GB,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
}

def _is_private_hostname(hostname: str) -> bool:
    host = (hostname or '').strip().lower()
    if not host:
        return True
    if host in ('localhost', '0.0.0.0', '127.0.0.1', '::1'):
        return True
    if host.endswith('.localhost'):
        return True

    try:
        infos = socket.getaddrinfo(host, None)
    except Exception:
        return True

    for info in infos:
        addr = info[4][0]
        try:
            ip = ipaddress.ip_address(addr)
        except ValueError:
            return True

        is_global = getattr(ip, 'is_global', None)
        if is_global is None:
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved or ip.is_unspecified:
                return True
        else:
            if not is_global:
                return True

    return False

def sanitize_external_url(raw_url: str):
    if not raw_url:
        return None
    raw_url = str(raw_url).strip()
    if not raw_url:
        return None
    if len(raw_url) > 2048 or '\n' in raw_url or '\r' in raw_url:
        return None
    try:
        parsed = urlparse(raw_url)
        if parsed.scheme not in ('http', 'https'):
            return None
        if parsed.username or parsed.password:
            return None
        if parsed.port and parsed.port not in (80, 443):
            return None
        if _is_private_hostname(parsed.hostname or ''):
            return None
        return parsed._replace(fragment='').geturl()
    except Exception:
        return None

def _safe_get(url: str, timeout: int = 30):
    current_url = sanitize_external_url(url)
    if not current_url:
        raise Exception('Invalid url')
    redirects_remaining = 3

    while True:
        response = requests.get(current_url, headers=HEADERS, timeout=timeout, allow_redirects=False)

        if response.is_redirect:
            location = response.headers.get('Location')
            if not location:
                return response

            next_url = urljoin(current_url, location)
            next_url = sanitize_external_url(next_url)
            if not next_url:
                response.close()
                raise Exception('Invalid redirect target')

            response.close()
            redirects_remaining -= 1
            if redirects_remaining < 0:
                raise Exception('Too many redirects')

            current_url = next_url
            continue

        return response

def _normalize_hostname(hostname: str) -> str:
    host = (hostname or '').strip().lower().rstrip('.')
    if host.startswith('www.'):
        host = host[4:]
    return host

def _hostname_matches_provider(hostname: str, provider_hostname: str) -> bool:
    host = _normalize_hostname(hostname)
    base = _normalize_hostname(provider_hostname)
    if not host or not base:
        return False
    return host == base or host.endswith('.' + base)

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
        logger.info(f"WebSocket setup complete for {model_name}")
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
                logger.warning(f"Error parsing WebSocket message: {e}")
                continue
    else:
        raise Exception("WebSocket setup did not complete")
        
    return response_text

async def _call_live_model_websocket(model_name, prompt, system_prompt=None):
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
                "max_output_tokens": 32768,  # 32K tokens for comprehensive extraction and detailed responses
                "top_p": 0.95,
                "top_k": 40
            }
            
            # Add system instruction if provided
            if system_prompt:
                config["system_instruction"] = system_prompt
            
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
            logger.info(f"google-genai SDK failed, trying raw WebSocket: {e}")
    
    # Fallback to raw WebSocket connection
    if not WEBSOCKET_AVAILABLE:
        raise Exception("WebSocket support not available")
    
    # WebSocket URL for Gemini Live API
    ws_url = f"wss://generativelanguage.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent"
    
    # Setup message to initialize the session
    setup_message = {
        "setup": {
            "model": f"models/{model_name}",
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 32768,  # 32K tokens for comprehensive extraction and detailed responses
                "topP": 0.95,
                "topK": 40,
                "responseModalities": ["TEXT"]
            }
        }
    }
    
    # Add system instruction if provided
    if system_prompt:
        setup_message["setup"]["systemInstruction"] = {
            "parts": [{"text": system_prompt}]
        }
    
    # Client content message
    client_message = {
        "clientContent": {
            "parts": [{"text": prompt}]
        }
    }
    
    try:
        # Connect with API key in query parameter
        async with websockets.connect(
            f"{ws_url}?key={GEMINI_API_KEY}"
        ) as websocket:
            return await _handle_websocket_messages(websocket, setup_message, client_message, model_name)
                
    except Exception as e:
        raise Exception(f"WebSocket connection failed: {e}")

def extract_prices_with_ai(html_content, provider_name):
    """Use Gemini AI to intelligently extract broadband deals from HTML"""
    if not GEMINI_API_KEY:
        logger.warning("No Gemini API key configured, falling back to regex")
        return extract_prices_regex(html_content, provider_name)
    
    try:
        # Clean HTML to reduce token usage
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Remove scripts, styles, and other non-content elements
        for tag in soup(['script', 'style', 'nav', 'footer', 'header', 'noscript', 'iframe', 'svg']):
            tag.decompose()
        
        # Get text content with structure hints
        text_content = soup.get_text(separator='\n', strip=True)
        
        # Increase content size for better extraction (roughly 4 chars per token)
        # Increased to 200k chars (~50k tokens) for comprehensive extraction with Live models
        # Live models support much larger context windows
        max_chars = 200000  # 200k chars = ~50k tokens (well within Live model limits)
        if len(text_content) > max_chars:
            # Take from beginning and end to preserve structure
            half = max_chars // 2
            text_content = text_content[:half] + "\n\n[... content truncated ...]\n\n" + text_content[-half:]
        
        # System prompt for consistent behavior
        system_prompt = """You are an expert broadband pricing data extraction specialist with deep knowledge of UK broadband providers, pricing structures, and package details. Your role is to accurately extract broadband deal information from website content.

Key Responsibilities:
- Identify residential broadband packages (exclude business-only, TV-only, phone-only)
- Extract accurate speed information (convert Gbps to Mbps: 1Gbps = 1000Mbps)
- Extract monthly prices (prefer standard pricing over promotional/first-month offers)
- Match speeds with their corresponding prices from the same package
- Identify contract lengths when available
- Focus on main advertised packages, not promotional snippets

Output Requirements:
- Return ONLY valid JSON (no markdown, no explanations)
- Include all available deals (up to 10)
- Use consistent formatting for speeds and prices
- If no valid deals found, return empty deals array but keep status as "active" if page looks valid"""
        
        # Build the AI prompt with system context
        prompt = f"""{system_prompt}

Extract ALL broadband/internet package deals from this {provider_name} website content.

For each package/deal found, extract:
1. Package name (e.g., "Full Fibre 500", "Superfast", "1Gbps")
2. Download speed in Mbps (convert Gbps to Mbps: 1Gbps = 1000Mbps)
3. Monthly price in GBP (the actual price, not promotional/first-month price if possible)
4. Contract length if mentioned

IMPORTANT RULES:
- Only extract RESIDENTIAL BROADBAND packages (not business, not TV-only, not phone-only)
- Match the speed with its corresponding price from the SAME package
- If you see "Full Fibre 1000" or "1Gbps", the speed is 1000 Mbps
- Look for the main advertised packages, not promotional snippets
- Prices are typically shown as £XX.XX/month or £XX.XX per month

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{{"deals": [
  {{"name": "Package Name", "speed_mbps": 500, "price": 34.99, "contract_months": 24}},
  {{"name": "Another Package", "speed_mbps": 1000, "price": 51.99, "contract_months": 24}}
]}}

If no valid broadband deals are found, return: {{"deals": []}}

Website content:
{text_content}"""

        # Try live model first if enabled (for unlimited RPM/RPD via WebSocket)
        if USE_LIVE_MODEL and WEBSOCKET_AVAILABLE:
            # Try live models in order of preference
            # Live models have unlimited RPM and RPD (confirmed in Google AI Studio)
            # Use WebSocket connection for bidiGenerateContent
            # Using Gemini 2.5 Flash Live - unlimited RPM/RPD on free tier
            # Falls back to other 2.5 live models if primary unavailable
            live_models = [
                'gemini-2.5-flash-live',      # Primary: Unlimited RPM/RPD, best performance
                'gemini-live-2.5-flash-preview',  # Fallback: Unlimited RPM/RPD, 1M TPM
                'gemini-2.0-flash-live-001'   # Fallback: Unlimited RPM/RPD, 4M TPM
            ]
            logger.info(f"Using live models with unlimited RPM/RPD. API Key configured: {bool(GEMINI_API_KEY)}")
            
            for model_name in live_models:
                try:
                    # Use WebSocket for bidiGenerateContent (unlimited requests)
                    logger.info(f"Attempting to use live model via WebSocket: {model_name}")
                    response_text = asyncio.run(_call_live_model_websocket(model_name, prompt, system_prompt))
                    
                    if response_text:
                        # Parse the response text as JSON
                        json_str = response_text.replace('```json', '').replace('```', '').strip()
                        json_match = re.search(r'\{[\s\S]*"deals"[\s\S]*\}', json_str)
                        if json_match:
                            json_str = json_match.group(0)
                        
                        # Convert to the expected format
                        parsed = json.loads(json_str)
                        deals = parsed.get('deals', [])
                        
                        # Format deals
                        formatted_deals = []
                        for deal in deals[:5]:  # Max 5 deals
                            formatted_deals.append({
                                'name': deal.get('name', 'Broadband Package'),
                                'speed': f"{deal.get('speed_mbps', 0)} Mbps" if deal.get('speed_mbps') else None,
                                'price': f"{deal.get('price', 0):.2f}",
                                'contract': f"{deal.get('contract_months', 0)} months" if deal.get('contract_months') else None
                            })
                        
                        if formatted_deals:
                            logger.info(f"Live AI extracted {len(formatted_deals)} deals for {provider_name}")
                            return formatted_deals
                        else:
                            logger.warning(f"Live AI returned no deals for {provider_name}")
                            continue
                    else:
                        logger.warning(f"No response from live model {model_name}")
                        continue
                except Exception as e:
                    logger.warning(f"Live model {model_name} failed: {e}, trying next...")
                    continue
            else:
                # If all live models failed, fall back to REST API
                logger.info("All live models failed, using REST API")
                response = requests.post(
                    f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                    headers={'Content-Type': 'application/json'},
                    json={
                        'contents': [{'parts': [{'text': prompt}]}],
                        'generationConfig': {
                            'temperature': 0.1,
                            'maxOutputTokens': 16384,  # 16K tokens for comprehensive extraction and detailed responses
                            'topP': 0.95,
                            'topK': 40
                        },
                        'systemInstruction': {
                            'parts': [{'text': 'You are an expert web scraper and data extraction specialist. Extract broadband deals from HTML content with high accuracy. Return structured JSON with deal information including name, speed, price, and contract length.'}]
                        }
                    },
                    timeout=30
                )
                
                if response.status_code != 200:
                    logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                    return extract_prices_regex(html_content, provider_name)
                
                result = response.json()
        else:
            # Use standard REST API with Gemini 2.5 Flash
            response = requests.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                headers={'Content-Type': 'application/json'},
                json={
                    'contents': [{'parts': [{'text': prompt}]}],
                    'generationConfig': {
                        'temperature': 0.1,
                        'maxOutputTokens': 16384,  # 16K tokens for comprehensive extraction and detailed responses
                        'topP': 0.95,
                        'topK': 40
                    },
                    'systemInstruction': {
                        'parts': [{'text': 'You are an expert web scraper and data extraction specialist. Extract broadband deals from HTML content with high accuracy. Return structured JSON with deal information including name, speed, price, and contract length.'}]
                    }
                },
                timeout=30
            )
            
            if response.status_code != 200:
                logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                return extract_prices_regex(html_content, provider_name)
            
            result = response.json()
        
        # Extract the text response with proper error handling
        # Note: If we used WebSocket, we already returned formatted_deals above
        # This section only runs for REST API responses
        if 'result' not in locals():
            # This shouldn't happen, but handle gracefully
            logger.warning("No result from API call")
            return extract_prices_regex(html_content, provider_name)
            
        candidates = result.get('candidates', [])
        if not candidates or not candidates[0]:
            logger.warning("No candidates in Gemini response")
            return extract_prices_regex(html_content, provider_name)
        
        content = candidates[0].get('content', {})
        parts = content.get('parts', [])
        if not parts or not parts[0]:
            logger.warning("No parts in Gemini response")
            return extract_prices_regex(html_content, provider_name)
        
        ai_response = parts[0].get('text', '')
        if not ai_response:
            logger.warning("Empty text in Gemini response")
            return extract_prices_regex(html_content, provider_name)
        
        # Clean up response and extract JSON robustly
        ai_response = ai_response.strip()
        
        # Remove markdown code blocks if present
        if ai_response.startswith('```'):
            ai_response = re.sub(r'^```json?\s*', '', ai_response)
            ai_response = re.sub(r'\s*```$', '', ai_response)
        
        # Try to extract JSON object using regex (handles extra text around JSON)
        json_match = re.search(r'\{[\s\S]*"deals"[\s\S]*\}', ai_response)
        if json_match:
            ai_response = json_match.group(0)
        
        # Parse JSON response
        try:
            parsed = json.loads(ai_response)
            deals = parsed.get('deals', [])
            
            # Convert to our format
            formatted_deals = []
            for deal in deals[:5]:  # Max 5 deals
                formatted_deals.append({
                    'name': deal.get('name', 'Broadband Package'),
                    'speed': f"{deal.get('speed_mbps', 0)} Mbps" if deal.get('speed_mbps') else None,
                    'price': f"{deal.get('price', 0):.2f}",
                    'contract': f"{deal.get('contract_months', 0)} months" if deal.get('contract_months') else None
                })
            
            if formatted_deals:
                logger.info(f"AI extracted {len(formatted_deals)} deals for {provider_name}")
                return formatted_deals
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response: {e} - Response: {ai_response[:200]}")
    
    except Exception as e:
        logger.error(f"AI extraction failed for {provider_name}: {e}")
    
    # Fallback to regex
    return extract_prices_regex(html_content, provider_name)

def extract_prices_regex(html_content, provider_name):
    """Fallback regex-based price extraction"""
    soup = BeautifulSoup(html_content, 'html.parser')
    text = soup.get_text(separator=' ', strip=True)
    
    deals = []
    
    # Look for structured deal patterns (price + speed together)
    # Pattern: speed followed by price within reasonable distance
    deal_patterns = [
        # "1000 Mbps ... £51.99/month" or "1Gbps ... £51.99"
        r'(\d+)\s*(?:Mbps|Mb|Gbps|Gig)[^\£]{0,50}£(\d+(?:\.\d{2})?)',
        # "£51.99/month ... 1000 Mbps"
        r'£(\d+(?:\.\d{2})?)[^\d]{0,50}(\d+)\s*(?:Mbps|Mb)',
        # "Full Fibre 1000 £51.99"
        r'(?:Fibre|Fiber|Full\s*Fibre)\s*(\d+)[^\£]{0,30}£(\d+(?:\.\d{2})?)',
    ]
    
    found_deals = []
    
    for pattern in deal_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            try:
                if '£' in pattern[:10]:  # Price first pattern
                    price, speed = float(match[0]), int(match[1])
                else:  # Speed first pattern
                    speed, price = int(match[0]), float(match[1])
                
                # Validate reasonable ranges
                if 15 <= price <= 150 and 10 <= speed <= 10000:
                    # Check for Gbps conversion
                    if speed <= 10:  # Likely Gbps
                        speed = speed * 1000
                    
                    found_deals.append({
                        'speed': speed,
                        'price': price
                    })
            except (ValueError, IndexError):
                continue
    
    # Deduplicate and sort by speed
    seen = set()
    unique_deals = []
    for deal in found_deals:
        key = (deal['speed'], deal['price'])
        if key not in seen:
            seen.add(key)
            unique_deals.append(deal)
    
    unique_deals.sort(key=lambda x: x['speed'], reverse=True)
    
    # Format output
    for i, deal in enumerate(unique_deals[:3]):
            deals.append({
            'name': f"Fibre {deal['speed']}" if deal['speed'] >= 100 else f"Broadband {deal['speed']}",
            'speed': f"{deal['speed']} Mbps",
            'price': f"{deal['price']:.2f}"
            })
    
    return deals

def scrape_uswitch(provider_name):
    """Scrape Uswitch for provider prices as fallback"""
    try:
        # Convert provider name to URL slug
        slug = provider_name.lower().replace(' ', '-').replace('_', '-')
        slug = re.sub(r'[^a-z0-9-]', '', slug)
        
        url = f"https://www.uswitch.com/broadband/providers/{slug}/"
        
        response = _safe_get(url, timeout=10)
        if response.status_code == 200:
            # Try AI extraction first for Uswitch too
            deals = extract_prices_with_ai(response.text, f"{provider_name} (via Uswitch)")
            if deals:
                return {
                    'deals': deals,
                    'source': 'uswitch'
                }
    except Exception as e:
        logger.warning(f"Uswitch scrape failed for {provider_name}: {e}")
    
    return None

def scrape_provider(provider_name, provider_url=None):
    """Scrape a provider's website for current prices"""
    result = {
        'provider': provider_name,
        'success': False,
        'deals': [],
        'error': None,
        'source': 'direct',
        'ai_powered': bool(GEMINI_API_KEY)
    }
    
    # Get URL from known providers or use provided URL
    provider_key = provider_name.lower().strip()
    default_url = PROVIDER_URLS.get(provider_key)

    if NODE_ENV == 'production' and not default_url:
        result['error'] = 'Unknown provider'
        return result

    url = None

    if provider_url:
        provider_url = sanitize_external_url(provider_url)
        if not provider_url:
            result['error'] = 'Invalid url parameter'
            return result

        if NODE_ENV == 'production':
            provider_hostname = urlparse(default_url).hostname or ''
            requested_hostname = urlparse(provider_url).hostname or ''
            if not _hostname_matches_provider(requested_hostname, provider_hostname):
                result['error'] = 'Invalid url parameter'
                return result

        url = provider_url
    else:
        url = default_url
    
    if not url:
        # Try to construct URL
        slug = provider_key.replace(' ', '').replace('_', '')
        # Basic validation - only allow alphanumeric and hyphens
        slug = re.sub(r'[^a-z0-9-]', '', slug.lower())
        if not slug:
            result['error'] = 'Could not determine provider URL'
            return result
        url = f"https://www.{slug}.co.uk"
    
    try:
        logger.info(f"Scraping {provider_name} from {url}")
        
        response = _safe_get(url, timeout=30)  # Increased timeout for large pages
        response.raise_for_status()
        
        # Use AI-powered extraction
        deals = extract_prices_with_ai(response.text, provider_name)
        
        if deals:
            result['success'] = True
            result['deals'] = deals
            result['url'] = url
        else:
            # Try Uswitch as fallback
            uswitch_data = scrape_uswitch(provider_name)
            if uswitch_data:
                result['success'] = True
                result['deals'] = uswitch_data['deals']
                result['source'] = 'uswitch'
            else:
                result['error'] = 'No price data found'
                
    except requests.exceptions.Timeout:
        result['error'] = 'Request timed out'
    except requests.exceptions.SSLError:
        result['error'] = 'SSL certificate error'
    except requests.exceptions.ConnectionError:
        result['error'] = 'Connection failed'
    except Exception as e:
        result['error'] = 'Internal server error' if NODE_ENV == 'production' else str(e)
        logger.error(f"Error scraping {provider_name}: {e}")
    
    return result

@functions_framework.http
def get_broadband_price(request):
    """
    HTTP Cloud Function for getting broadband prices
    
    Query Parameters:
        provider: Name of the broadband provider
        url: (optional) Direct URL to scrape
    
    Returns:
        JSON with price data or error message
    """
    origin = request.headers.get('Origin', '')
    cors_headers = _get_cors_headers(origin)

    # Handle CORS preflight
    if request.method == 'OPTIONS':
        if not _is_origin_allowed(origin):
            return ('', 403, cors_headers)
        return ('', 204, cors_headers)

    if not _is_origin_allowed(origin):
        return (jsonify({
            'success': False,
            'error': 'Not allowed by CORS'
        }), 403, cors_headers)

    if request.method != 'GET':
        return (jsonify({
            'success': False,
            'error': 'Method not allowed'
        }), 405, cors_headers)
    
    # Get parameters
    provider = request.args.get('provider', '')
    provider = provider.strip() if isinstance(provider, str) else ''
    url = request.args.get('url', '')
    url = url.strip() if isinstance(url, str) else ''
    url = url or None

    if provider and (len(provider) > 128 or '\n' in provider or '\r' in provider):
        return (jsonify({
            'success': False,
            'error': 'Invalid provider parameter'
        }), 400, cors_headers)

    if url:
        if len(url) > 2048 or '\n' in url or '\r' in url:
            return (jsonify({
                'success': False,
                'error': 'Invalid url parameter'
            }), 400, cors_headers)
        url = sanitize_external_url(url)
        if not url:
            return (jsonify({
                'success': False,
                'error': 'Invalid url parameter'
            }), 400, cors_headers)
    
    if not provider:
        return (jsonify({
            'success': False,
            'error': 'Missing provider parameter'
        }), 400, cors_headers)
    
    # Scrape the provider
    result = scrape_provider(provider, url)
    
    return (jsonify(result), 200, cors_headers)

@functions_framework.http
def get_multiple_prices(request):
    """
    HTTP Cloud Function for getting prices for multiple providers
    
    Request Body (JSON):
        providers: List of provider names
    
    Returns:
        JSON with price data for all providers
    """
    origin = request.headers.get('Origin', '')
    cors_headers = _get_cors_headers(origin)

    # Handle CORS preflight
    if request.method == 'OPTIONS':
        if not _is_origin_allowed(origin):
            return ('', 403, cors_headers)
        return ('', 204, cors_headers)

    if not _is_origin_allowed(origin):
        return (jsonify({
            'success': False,
            'error': 'Not allowed by CORS'
        }), 403, cors_headers)

    if request.method != 'POST':
        return (jsonify({
            'success': False,
            'error': 'Method not allowed'
        }), 405, cors_headers)

    content_length = request.content_length or 0
    if content_length and content_length > MAX_REQUEST_BYTES:
        return (jsonify({
            'success': False,
            'error': 'Request body too large'
        }), 413, cors_headers)
    
    try:
        data = request.get_json(silent=True) or {}
        providers = data.get('providers', [])

        if not isinstance(providers, list):
            providers = []

        sanitized_providers = []
        for p in providers:
            if isinstance(p, str):
                s = p.strip()
                if s and len(s) <= 128 and '\n' not in s and '\r' not in s:
                    sanitized_providers.append(s)
        
        if not sanitized_providers:
            return (jsonify({
                'success': False,
                'error': 'Missing providers list'
            }), 400, cors_headers)
        
        # Parallel processing for better performance
        providers_list = sanitized_providers[:20]  # Increased limit to 20 providers
        
        # Use ThreadPoolExecutor for parallel scraping
        results = {}
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            # Submit all provider scraping tasks
            future_to_provider = {
                executor.submit(scrape_provider, provider): provider 
                for provider in providers_list
            }
            
            # Collect results as they complete
            for future in concurrent.futures.as_completed(future_to_provider):
                provider = future_to_provider[future]
                try:
                    results[provider] = future.result()
                except Exception as e:
                    logger.error(f"Error processing {provider}: {e}")
                    results[provider] = {
                        'provider': provider,
                        'success': False,
                        'error': 'Internal server error' if NODE_ENV == 'production' else str(e),
                        'deals': []
                    }
        
        return (jsonify({
            'success': True,
            'results': results,
            'total': len(results),
            'successful': sum(1 for r in results.values() if r.get('success', False))
        }), 200, cors_headers)
        
    except Exception as e:
        return (jsonify({
            'success': False,
            'error': 'Internal server error' if NODE_ENV == 'production' else str(e)
        }), 500, cors_headers)
