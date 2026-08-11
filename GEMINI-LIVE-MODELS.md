# Gemini Live Models - Unlimited RPM/RPD

This document explains how to use Gemini's live models for unlimited requests per minute (RPM) and requests per day (RPD) when scraping broadband prices.

## Overview

Gemini Live models offer:
- **Unlimited RPM** (Requests Per Minute)
- **Unlimited RPD** (Requests Per Day)
- **Larger input windows** for processing more content
- **Bidirectional streaming** via `bidiGenerateContent` API

## Available Live Models

The following live models are supported (in order of preference):
1. `gemini-2.5-flash-live-preview`
2. `gemini-live-2.5-flash-preview`
3. `gemini-2.0-flash-live-001`

## Enabling Live Models

### For Local Development

Set the environment variable:
```bash
# Windows PowerShell
$env:USE_GEMINI_LIVE = "true"

# Windows CMD
set USE_GEMINI_LIVE=true

# Linux/Mac
export USE_GEMINI_LIVE=true
```

### For GitLab CI/CD

Live models are **enabled by default** in the CI pipeline. To disable them, set the `USE_GEMINI_LIVE` variable in GitLab CI/CD settings to `false`.

### For Google Cloud Functions

Set the environment variable in your Cloud Function configuration:
```bash
gcloud functions deploy price-scraper \
  --set-env-vars USE_GEMINI_LIVE=true
```

Or via the Google Cloud Console:
1. Go to Cloud Functions
2. Select your function
3. Edit → Environment variables
4. Add `USE_GEMINI_LIVE` = `true`

## How It Works

### Python Scraper (`scrape_broadband_prices.py`)

When `USE_GEMINI_LIVE=true`:
1. The scraper first attempts to use live models via the Google Generative AI Python SDK
2. If live models are unavailable, it automatically falls back to the standard REST API (`gemini-2.5-flash`)
3. The SDK handles streaming internally

### Cloud Function (`cloud-functions/price-scraper/main.py`)

When `USE_GEMINI_LIVE=true`:
1. The function attempts to call live models via REST API endpoints
2. If a live model returns 404 (not found), it tries the next one
3. If all live models fail, it falls back to `gemini-2.5-flash`

## API Differences

### Standard Models (REST API)
- Endpoint: `generateContent`
- Rate limits: 15 RPM, 1,500 RPD (free tier)
- Uses standard HTTP POST requests

### Live Models (Streaming API)
- Endpoint: `bidiGenerateContent` (bidirectional streaming)
- Rate limits: **Unlimited** RPM/RPD
- Uses Server-Sent Events (SSE) or WebSocket connections
- The Python SDK abstracts this complexity

## Troubleshooting

### Error: "404 models/gemini-2.5-flash-live is not found"

**Cause**: Live models use different API endpoints. The model name might be incorrect or the API version doesn't support it.

**Solution**: 
- The code automatically tries multiple live model names
- If all fail, it falls back to the standard REST API
- Check that your API key has access to preview models

### Error: "Model not available"

**Cause**: The specific live model might not be available in your region or API tier.

**Solution**: The code automatically tries alternative live models. If all fail, it uses the standard model.

### Live Models Not Working

If live models consistently fail:
1. Check your API key permissions
2. Verify you're using the latest `google-generativeai` SDK version
3. Try disabling live models: `USE_GEMINI_LIVE=false`
4. Check Google's API status page for service issues

## Benefits for Broadband Scraping

With unlimited RPM/RPD, you can:
- **Scrape all providers simultaneously** without rate limit concerns
- **Process larger HTML content** with bigger input windows
- **Run more frequent updates** without hitting daily limits
- **Scale to more providers** without API throttling

## Rate Limit Comparison

| Model Type | RPM (Free) | RPD (Free) | RPM (Paid) | RPD (Paid) |
|------------|------------|------------|------------|------------|
| Standard Flash | 15 | 1,500 | 1,000 | 50,000 |
| Live Models | **Unlimited** | **Unlimited** | **Unlimited** | **Unlimited** |

## Notes

- Live models are currently in **preview** and may have different behavior than standard models
- The bidirectional streaming API (`bidiGenerateContent`) is more complex but offers better performance
- The Python SDK handles the complexity of streaming automatically
- Always test with a small number of requests first to verify your setup

## References

- [Gemini API Rate Limits](https://ai.google.dev/gemini-api/docs/rate-limits)
- [Gemini Live Models Documentation](https://ai.google.dev/gemini-api/docs/models/gemini-live)
- [Google Generative AI Python SDK](https://github.com/google/generative-ai-python)

