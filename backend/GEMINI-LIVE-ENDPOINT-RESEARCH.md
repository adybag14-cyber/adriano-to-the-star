# Gemini Live API WebSocket Endpoint Research

## 🔍 Research Findings

Based on official Google documentation and community discussions:

### Correct Endpoints

1. **REST API Key Endpoint** (for simple API keys):
   ```
   wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService/BidiGenerateContent?key=YOUR_API_KEY
   ```

2. **Vertex AI Endpoint** (requires Google Cloud setup):
   ```
   wss://generativelanguage.googleapis.com/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent?key=YOUR_API_KEY
   ```

### Key Differences

- **REST API keys** should use: `google.ai.generativelanguage.v1beta.GenerativeService`
- **Vertex AI** uses: `google.cloud.aiplatform.v1beta1.LlmBidiService`

### Current Issue

The code was using the **Vertex AI endpoint** (`google.cloud.aiplatform.v1beta1.LlmBidiService`) with a **REST API key**, which causes 404 errors.

### Solution Applied

Updated the code to use the correct REST API endpoint:
- Changed from: `google.cloud.aiplatform.v1beta1.LlmBidiService`
- Changed to: `google.ai.generativelanguage.v1beta.GenerativeService`

## 📚 References

1. [Google AI Developers Forum](https://discuss.ai.google.dev/t/gemini-s-websocket-won-t-talk-to-me/73980)
2. [Gemini API Overview](https://ai.google.dev/docs/gemini_api_overview/)
3. [Live API Reference](https://ai.google.dev/api/live)
4. [Vertex AI Live API](https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/multimodal-live)

## 🔧 Implementation Notes

- The endpoint format is: `/ws/{ServiceName}/{MethodName}`
- API key is passed as query parameter: `?key=YOUR_API_KEY`
- Setup message must be sent after WebSocket opens
- Wait for `setupComplete` before sending content

## ⚠️ Important Notes

1. **Live models may still require Vertex AI** even with correct endpoint
2. **REST API streaming** (`streamGenerateContent`) works reliably with API keys
3. **Fallback mechanism** is implemented to use REST API if WebSocket fails

---

**Status:** ✅ Endpoint updated to correct REST API format

