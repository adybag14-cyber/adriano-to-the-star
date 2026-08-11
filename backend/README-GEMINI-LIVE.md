# Gemini Live API Backend Setup

## ✅ No Google Cloud Required!

The backend **does NOT require Google Cloud Platform**. It only needs:

1. **Simple API Key** from [Google AI Studio](https://aistudio.google.com/)
   - Free tier available
   - Get your API key: https://aistudio.google.com/app/apikey
   - No Google Cloud account needed

2. **Node.js dependencies** (already in package.json):
   - `ws` - WebSocket support
   - `express` - HTTP server
   - No Google Cloud SDK needed

## 🔑 Setup

### 1. Get API Key
- Go to https://aistudio.google.com/app/apikey
- Create a new API key (free)
- Copy the API key

### 2. Set Environment Variable

Create a `.env` file in the `backend` directory:

```env
GEMINI_API_KEY=your-api-key-here
```

Or use:
```env
GOOGLE_AI_API_KEY=your-api-key-here
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

### 4. Start Server

```bash
npm run start-stellar-ai
```

Or for development:
```bash
npm run dev-stellar-ai
```

## 📡 How It Works

1. **Frontend** connects to backend WebSocket: `ws://localhost:3001/api/gemini-live`
2. **Backend** proxies to Gemini Live API: `wss://generativelanguage.googleapis.com/ws/...?key=YOUR_API_KEY`
3. **No Google Cloud** - uses public Gemini API endpoint with simple API key authentication

## 🔒 Security

- API key is stored server-side (in `.env` file)
- Never expose API key to frontend
- Backend acts as secure proxy

## 💰 Cost

- **Free tier**: Unlimited requests on live models
- No Google Cloud billing required
- Just need Google account (free)

## 🆚 Google Cloud vs Public API

| Feature | Public API (This) | Google Cloud Vertex AI |
|---------|-------------------|------------------------|
| **Setup** | ✅ Just API key | ❌ Requires GCP project |
| **Cost** | ✅ Free tier available | ⚠️ Pay-as-you-go |
| **Authentication** | ✅ API key | ❌ Service account |
| **Endpoint** | `generativelanguage.googleapis.com` | `us-central1-aiplatform.googleapis.com` |
| **WebSocket** | ✅ Supported | ✅ Supported |

## ✅ Summary

**You do NOT need:**
- ❌ Google Cloud Platform account
- ❌ GCP project setup
- ❌ Service account credentials
- ❌ Vertex AI configuration

**You only need:**
- ✅ API key from Google AI Studio (free)
- ✅ Node.js backend server
- ✅ `ws` package installed


