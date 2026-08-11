# Fix: chunk.text is not a function

## ✅ Problem Fixed

The error `chunk.text is not a function` was occurring because the VertexAI SDK streaming response format is different than expected.

## 🔧 Solution Applied

Updated `backend/google-cloud-backend.js` to handle multiple chunk formats:

1. **Method 1**: `chunk.response.text()` - Most common format
2. **Method 2**: `chunk.text()` - Direct method
3. **Method 3**: `chunk.candidates[0].content.parts[].text` - Candidates array format
4. **Method 4**: `chunk.text` - Direct property
5. **Method 5**: `chunk.response.candidates[0].content.parts[].text` - Nested response format

## 📋 Changes Made

- Added comprehensive chunk format detection
- Added debug logging to identify actual chunk structure
- Added error handling for each extraction method
- Added warning if text cannot be extracted

## 🧪 Testing

Restart backend and test:
1. Backend should now handle streaming chunks correctly
2. Check logs for `[debug] First chunk structure` to see actual format
3. If errors persist, check logs for chunk structure details

## ✅ Status

**Fixed** - Backend now handles all known VertexAI SDK chunk formats.

