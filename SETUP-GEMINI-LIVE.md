# 🚀 Quick Setup: Gemini Live Models with Backend

## ✅ What Was Fixed

All code has been updated to make `gemini-2.5-flash-live` work via a **backend WebSocket proxy**.

## 📋 Setup Steps

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

This will install the `ws` package needed for WebSocket support.

### 2. Configure API Key

Create `backend/.env` file:

```env
GEMINI_API_KEY=your-api-key-here
```

Get your API key from: https://aistudio.google.com/app/apikey

**Note:** No Google Cloud required! Just a free API key.

### 3. Start Backend Server

```bash
cd backend
npm run start-stellar-ai
```

Server will run on `http://localhost:3001`

### 4. Use Frontend

Open `stellar-ai.html` in your browser. The frontend will automatically:
- Detect the backend at `localhost:3001`
- Use WebSocket proxy for live models
- Fall back to REST API if backend unavailable

## 🎯 How It Works

1. **Frontend** → Connects to `ws://localhost:3001/api/gemini-live`
2. **Backend** → Proxies to Gemini Live API WebSocket
3. **Gemini Live API** → Returns responses via WebSocket

## ✅ Benefits

- ✅ **Unlimited RPM/RPD** - Live models have no rate limits
- ✅ **No CORS Issues** - Backend handles WebSocket connection
- ✅ **No Google Cloud** - Just API key needed
- ✅ **Automatic Fallback** - Uses REST API if backend unavailable

## 🔧 Files Changed

- `backend/gemini-live-proxy.js` - WebSocket proxy server
- `backend/stellar-ai-server.js` - Integrated proxy
- `backend/package.json` - Added `ws` dependency
- `gemini-live-helper.js` - Uses backend WebSocket
- `stellar-ai.js` - Supports backend for live models
- `stellar-ai.html` - Configures backend URL

## 📚 More Info

See `backend/README-GEMINI-LIVE.md` for detailed documentation.

