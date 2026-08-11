# Gemini Live Models - What They Support

## ✅ What Live Models Support

### **ONLY ONE Endpoint:**
- **`bidiGenerateContent`** via **WebSocket** (bidirectional streaming)
  - Endpoint: `wss://generativelanguage.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent`
  - This is the **ONLY** way to use live models
  - Requires WebSocket connection (not HTTP REST)

### **Capabilities:**
1. **Unlimited RPM/RPD** - No rate limits on requests
2. **Bidirectional Streaming** - Real-time two-way communication
3. **Multimodal Input** - Text, audio, and video inputs
4. **Low Latency** - Optimized for real-time interactions
5. **Function Calling** - Can execute predefined functions during session
6. **Code Execution** - Can run code within a session
7. **24 Languages** - Multilingual support
8. **Voice Customization** - Multiple voice options available

## ❌ What Live Models DON'T Support

### **REST Endpoints (All Return 404):**
- ❌ `generateContent` (standard REST) - **NOT SUPPORTED**
- ❌ `streamGenerateContent` (REST streaming) - **NOT SUPPORTED**
- ❌ Any HTTP-based endpoints - **NOT SUPPORTED**

### **Test Results:**
```
✅ gemini-2.5-flash:generateContent          → Works
✅ gemini-2.5-flash:streamGenerateContent    → Works
❌ gemini-2.5-flash-live:streamGenerateContent → 404 Error
❌ gemini-2.5-flash-live-preview:generateContent → 404 Error
❌ gemini-2.5-flash-live-preview:streamGenerateContent → 404 Error
❌ gemini-live-2.5-flash-preview:generateContent → 404 Error
❌ gemini-live-2.5-flash-preview:streamGenerateContent → 404 Error
```

## 🔍 Key Insights

### **Live Models Are WebSocket-Only:**
- Live models (`gemini-2.5-flash-live`, `gemini-2.5-flash-live-preview`, `gemini-live-2.5-flash-preview`) are **designed exclusively for WebSocket connections**
- They do **NOT** support any REST-based endpoints
- They require bidirectional streaming via WebSocket protocol

### **Browser Limitations:**
- WebSocket connections may fail in browsers due to CORS restrictions
- Error 1006 (abnormal closure) suggests browser security blocking the connection
- WebSocket works better from server-side (Node.js, Python)

### **Standard Models Work Everywhere:**
- `gemini-2.5-flash` supports:
  - ✅ `generateContent` (REST)
  - ✅ `streamGenerateContent` (REST streaming)
  - ✅ Works from browser and server-side

## 📊 Comparison Table

| Feature | Live Models | Standard Models |
|---------|------------|-----------------|
| **REST `generateContent`** | ❌ Not supported | ✅ Supported |
| **REST `streamGenerateContent`** | ❌ Not supported | ✅ Supported |
| **WebSocket `bidiGenerateContent`** | ✅ Supported | ❌ Not available |
| **RPM Limit** | Unlimited | 2K-4K (free tier) |
| **RPD Limit** | Unlimited | Unlimited |
| **Use Case** | Real-time interactive apps | General purpose |
| **Browser Support** | ⚠️ Limited (CORS issues) | ✅ Full support |

## 💡 Recommendations

### **For Browser-Based Applications:**
- ✅ Use `gemini-2.5-flash` with `generateContent` or `streamGenerateContent`
- ❌ Don't try to use live models from browser (WebSocket blocked by CORS)

### **For Server-Side Applications:**
- ✅ Use live models via WebSocket for unlimited RPM/RPD
- ✅ Use `gemini-2.5-flash` as fallback if WebSocket fails
- ✅ Python SDK handles WebSocket complexity automatically

### **For High-Volume Processing:**
- ✅ Use `gemini-2.5-flash:streamGenerateContent` (works reliably)
- ⚠️ Live models via WebSocket only if server-side and WebSocket works

## 🔗 Official Documentation

- [Gemini Live API Docs](https://ai.google.dev/gemini-api/docs/live)
- [Live API Capabilities Guide](https://ai.google.dev/gemini-api/docs/live-guide)
- [WebSocket API Reference](https://ai.google.dev/api/live)

## 📝 Summary

**Live models support ONLY:**
- WebSocket `bidiGenerateContent` endpoint
- Unlimited RPM/RPD
- Real-time bidirectional streaming

**Live models do NOT support:**
- Any REST endpoints (`generateContent`, `streamGenerateContent`)
- HTTP-based requests
- Browser-based WebSocket (due to CORS)

**For most use cases:**
- Use `gemini-2.5-flash` with REST endpoints (works everywhere)
- Use live models only if you need unlimited RPM/RPD and can use server-side WebSocket

