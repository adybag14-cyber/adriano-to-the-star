import functions_framework
import os
import json
import requests
import google.generativeai as genai
from datetime import datetime

NODE_ENV = (os.environ.get('NODE_ENV') or ('production' if (os.environ.get('K_SERVICE') or os.environ.get('FUNCTION_TARGET')) else 'development')).lower()
CORS_ORIGINS_ENV = os.environ.get('CORS_ORIGINS', '')
ALLOWED_CORS_ORIGINS = [o.strip() for o in CORS_ORIGINS_ENV.split(',') if o.strip()]
MAX_REQUEST_BYTES = 1_000_000

def _is_origin_allowed(origin: str) -> bool:
    if not origin:
        return True
    if NODE_ENV != 'production':
        return True
    if not ALLOWED_CORS_ORIGINS:
        return False
    return origin in ALLOWED_CORS_ORIGINS

def _get_cors_headers(origin: str):
    headers = {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '3600'
    }
    if NODE_ENV != 'production':
        if origin:
            headers['Access-Control-Allow-Origin'] = origin
            headers['Vary'] = 'Origin'
        return headers
    if origin and origin in ALLOWED_CORS_ORIGINS:
        headers['Access-Control-Allow-Origin'] = origin
        headers['Vary'] = 'Origin'
    return headers

# Configure Gemini
GENAI_AVAILABLE = False
try:
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        genai.configure(api_key=api_key)
        GENAI_AVAILABLE = True
except Exception as e:
    print(f"Warning: Failed to configure Gemini: {e}")

def get_browserless_content(url):
    """Fetch rendered HTML content using Browserless.io"""
    api_key = os.environ.get("BROWSERLESS_API_KEY")
    if not api_key:
        print("Warning: BROWSERLESS_API_KEY not set")
        return None
        
    browserless_url = f"https://production-sfo.browserless.io/content?token={api_key}"
    
    headers = {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json"
    }
    
    # Browserless /content endpoint - minimal payload, just the URL
    # Returns fully rendered HTML including JavaScript-generated content
    payload = {
        "url": url
    }
    
    try:
        response = requests.post(browserless_url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"Browserless error for {url}: {e}")
        return None

def extract_deals_with_ai(html_content, provider_name):
    """Use Gemini to extract deal information from HTML"""
    if not GENAI_AVAILABLE:
        return None
        
    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        Analyze the following HTML content from {provider_name}'s broadband page and extract the top 3 broadband deals.
        Return ONLY a valid JSON object with this structure:
        [
            {{
                "speed": "string (e.g. '67Mbps')",
                "price": "string (e.g. '25.00')",
                "contract": "string (e.g. '24 months')"
            }}
        ]
        
        HTML Content (truncated):
        {html_content[:30000]}
        """
        
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Clean up markdown formatting if present
        if text.startswith("```json"):
            text = text[7:]
        if text.endswith("```"):
            text = text[:-3]
            
        return json.loads(text)
    except Exception as e:
        print(f"AI Extraction error for {provider_name}: {e}")
        return None

@functions_framework.http
def scrape_broadband(request):
    origin = request.headers.get('Origin', '')
    headers = _get_cors_headers(origin)

    # Set CORS headers for the preflight request
    if request.method == 'OPTIONS':
        if not _is_origin_allowed(origin):
            return ('', 403, headers)
        return ('', 204, headers)

    if not _is_origin_allowed(origin):
        return (json.dumps({
            'error': 'Not allowed by CORS'
        }), 403, headers)

    content_length = request.content_length or 0
    if content_length and content_length > MAX_REQUEST_BYTES:
        return (json.dumps({
            'error': 'Request body too large'
        }), 413, headers)

    # Define providers to scrape
    # Note: In a real-time function, we might want to limit this or parallelize it
    # For now, let's scrape a subset or specific provider if requested
    providers = {
        "BT": "https://www.bt.com/broadband",
        "Sky": "https://www.sky.com/broadband",
        "Virgin Media": "https://www.virginmedia.com/broadband"
    }

    results = {}
    
    # Check if a specific provider was requested
    request_json = request.get_json(silent=True)
    request_args = request.args
    
    target_provider = None
    if request_json and 'provider' in request_json:
        target_provider = request_json['provider']
    elif request_args and 'provider' in request_args:
        target_provider = request_args['provider']

    if target_provider and (not isinstance(target_provider, str) or len(target_provider) > 128 or '\n' in target_provider or '\r' in target_provider):
        return (json.dumps({
            'error': 'Invalid provider parameter'
        }), 400, headers)

    # If a specific provider is requested, only scrape that one
    if target_provider:
        # Simple fuzzy match
        for name, url in providers.items():
            if target_provider.lower() in name.lower():
                providers = {name: url}
                break
    
    for name, url in providers.items():
        try:
            # 1. Fetch Content
            html_content = get_browserless_content(url)
            
            deals = None
            status = "error"
            
            if html_content:
                # 2. Extract with AI
                deals = extract_deals_with_ai(html_content, name)
                if deals:
                    status = "active"
            
            # 3. Fallback if AI failed
            if not deals:
                # Return simulated/fallback data if scraping fails to ensure UI doesn't break
                # In production, you might want to return an error or cached data
                status = "fallback"
                deals = [
                    {"speed": "Check Site", "price": "Check Site", "contract": "Unknown"}
                ]

            results[name] = {
                "provider": name,
                "deals": deals,
                "url": url,
                "status": status,
                "last_checked": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Error processing {name}: {e}")
            results[name] = {
                "provider": name,
                "status": "error",
                "error": "Internal server error" if NODE_ENV == 'production' else str(e)
            }

    return (json.dumps(results), 200, headers)
