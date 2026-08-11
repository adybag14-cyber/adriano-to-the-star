from flask import Flask, request, jsonify
from flask_cors import CORS
from livekit import api
import os
import sys
import time
from werkzeug.exceptions import RequestEntityTooLarge

# Fix Windows encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

NODE_ENV = (os.environ.get('NODE_ENV') or 'development').lower()
CORS_ORIGINS_ENV = os.environ.get('CORS_ORIGINS', '')
ALLOWED_CORS_ORIGINS = [o.strip() for o in CORS_ORIGINS_ENV.split(',') if o.strip()]
MAX_REQUEST_BYTES = 1_000_000
API_TOKEN = os.environ.get('API_TOKEN') or None
RATE_LIMIT_WINDOW_SECONDS = 60
MAX_REQUESTS_PER_WINDOW = int(os.environ.get('TOKEN_SERVER_MAX_REQUESTS_PER_MINUTE', '20' if NODE_ENV == 'production' else '1000'))
_rate_limit = {}

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = MAX_REQUEST_BYTES

if NODE_ENV != 'production':
    CORS(app) # Enable CORS for all routes
elif ALLOWED_CORS_ORIGINS:
    CORS(app, origins=ALLOWED_CORS_ORIGINS)

@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'no-referrer'
    return response

@app.errorhandler(RequestEntityTooLarge)
def handle_request_too_large(_e):
    return jsonify({'error': 'Request body too large'}), 413

def _client_ip() -> str:
    forwarded = request.headers.get('X-Forwarded-For', '')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.remote_addr or 'unknown'

def _check_rate_limit():
    ip = _client_ip()
    now = time.time()
    window_start, count = _rate_limit.get(ip, (now, 0))
    if now - window_start >= RATE_LIMIT_WINDOW_SECONDS:
        window_start, count = now, 0
    count += 1
    _rate_limit[ip] = (window_start, count)
    if count > MAX_REQUESTS_PER_WINDOW:
        return jsonify({'error': 'Too many requests'}), 429
    return None

def _require_token_if_configured():
    if NODE_ENV != 'production':
        return None
    if not API_TOKEN:
        return jsonify({'error': 'Disabled in production unless API_TOKEN is set'}), 403
    auth = request.headers.get('Authorization', '')
    token = ''
    if isinstance(auth, str):
        if auth.startswith('Bearer '):
            token = auth[len('Bearer '):].strip()
        else:
            token = auth.strip()
    if token != API_TOKEN:
        return jsonify({'error': 'Unauthorized'}), 401
    return None

# Configuration
LIVEKIT_API_KEY = os.environ.get("LIVEKIT_API_KEY")
LIVEKIT_API_SECRET = os.environ.get("LIVEKIT_API_SECRET")

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'service': 'Stellar AI Token Server'})

@app.route('/api/livekit/token', methods=['POST'])
def get_token():
    try:
        auth_error = _require_token_if_configured()
        if auth_error:
            return auth_error

        rate_error = _check_rate_limit()
        if rate_error:
            return rate_error

        content_length = request.content_length or 0
        if content_length and content_length > MAX_REQUEST_BYTES:
            return jsonify({'error': 'Request body too large'}), 413

        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            return jsonify({'error': 'Invalid JSON'}), 400

        room_name = data.get('roomName')
        participant_name = data.get('participantName')
        if not isinstance(room_name, str) or not isinstance(participant_name, str):
            return jsonify({'error': 'Missing roomName or participantName'}), 400

        room_name = room_name.strip()
        participant_name = participant_name.strip()
        if not room_name or not participant_name:
            return jsonify({'error': 'Missing roomName or participantName'}), 400

        if len(room_name) > 128 or len(participant_name) > 128:
            return jsonify({'error': 'Invalid roomName or participantName'}), 400

        if '\n' in room_name or '\r' in room_name or '\n' in participant_name or '\r' in participant_name:
            return jsonify({'error': 'Invalid roomName or participantName'}), 400

        if not LIVEKIT_API_KEY or not LIVEKIT_API_SECRET:
            return jsonify({'error': 'LiveKit credentials not configured'}), 500

        token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
            .with_identity(participant_name) \
            .with_name(participant_name) \
            .with_grants(api.VideoGrants(
                room_join=True,
                room=room_name,
            ))

        jwt_token = token.to_jwt()
        
        return jsonify({'token': jwt_token})

    except Exception as e:
        print(f"Error generating token: {e}")
        return jsonify({'error': 'Internal server error' if NODE_ENV == 'production' else str(e)}), 500

if __name__ == '__main__':
    print(f"Starting Token Server on port 3001...")
    print(f"API Key: {LIVEKIT_API_KEY[:5]}..." if LIVEKIT_API_KEY else "API Key: [NOT SET]")
    app.run(host='0.0.0.0' if NODE_ENV == 'production' else 'localhost', port=3001, debug=NODE_ENV != 'production')
