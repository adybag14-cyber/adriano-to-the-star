# Gemini Live Models - Rate Limits Confirmed

## ✅ Rate Limits Confirmation

Based on Google AI Studio dashboard, live models have **unlimited RPM and RPD**:

### Live Models (Unlimited RPM/RPD):

| Model | Category | RPM | TPM | RPD |
|-------|----------|-----|-----|-----|
| `gemini-2.5-flash-live` | Live API | **Unlimited** | 1M | **Unlimited** |
| `gemini-2.0-flash-live` | Live API | **Unlimited** | 4M | **Unlimited** |
| `gemini-2.5-flash-native-audio-dialog` | Live API | **Unlimited** | 1M | **Unlimited** |

### Non-Live Models (Limited RPM):

| Model | Category | RPM | TPM | RPD |
|-------|----------|-----|-----|-----|
| `gemini-2.5-flash` | Text-out | 2K | 4M | Unlimited |
| `gemini-2.5-flash-lite` | Text-out | 4K | 4M | Unlimited |
| `gemini-2.0-flash` | Text-out | 2K | 4M | Unlimited |
| `gemini-2.0-flash-lite` | Text-out | 4K | 4M | Unlimited |

## 🎯 Key Differences

### Live Models:
- ✅ **Unlimited RPM** (Requests Per Minute)
- ✅ **Unlimited RPD** (Requests Per Day)
- ⚠️ Lower TPM (1M-4M Tokens Per Minute)
- 🔄 Use `bidiGenerateContent` API (bidirectional streaming)

### Non-Live Models:
- ⚠️ Limited RPM (2K-4K Requests Per Minute)
- ✅ Unlimited RPD (Requests Per Day)
- ✅ Higher TPM (4M Tokens Per Minute)
- 🔄 Use `generateContent` API (REST API)

## 📊 Model Selection Priority

Updated code now tries in this order:

1. **`gemini-2.5-flash-live`** - Best choice (unlimited RPM/RPD, 1M TPM)
2. **`gemini-2.5-flash-live-preview`** - Fallback preview version
3. **`gemini-2.0-flash-live`** - Alternative (unlimited RPM/RPD, 4M TPM)
4. **`gemini-2.0-flash-live-001`** - Fallback version
5. **`gemini-2.5-flash`** - Final fallback (2K RPM limit)

## 💡 Recommendations

### For High-Volume Scraping:
- ✅ Use **live models** (`gemini-2.5-flash-live`)
- ✅ Unlimited RPM/RPD perfect for scraping many providers
- ⚠️ Watch TPM limits (1M tokens/minute)

### For Single Requests:
- ✅ Use **non-live models** (`gemini-2.5-flash`)
- ✅ Higher TPM (4M vs 1M)
- ⚠️ RPM limits (2K/minute)

## 🔧 Implementation

The code automatically:
1. Tries live models first (if `USE_GEMINI_LIVE=true`)
2. Falls back to non-live models if live models fail
3. Uses correct API (`bidiGenerateContent` for live, `generateContent` for non-live)

## ✅ Status

- ✅ Live models confirmed to have unlimited RPM/RPD
- ✅ Code updated to use correct model names
- ✅ Fallback chain implemented
- ✅ Ready for unlimited scraping!

