# Browserless.io API Fix

## Issue
The Browserless.io `/content` endpoint was rejecting the payload with error:
```
400 - POST Body validation failed: "elements" is not allowed "waitFor" is not allowed
```

## Root Cause
The `/content` endpoint has a minimal payload requirement - it only accepts the `url` parameter. Additional parameters like `rejectResourceTypes`, `gotoOptions`, `waitFor`, and `elements` are not supported by this endpoint.

## Solution
Simplified the payload to only include the required `url` parameter:

**Before:**
```python
payload = {
    "url": url,
    "rejectResourceTypes": ["image", "media", "font"],
    "gotoOptions": {
        "waitUntil": "networkidle2"
    }
}
```

**After:**
```python
payload = {
    "url": url
}
```

## Files Updated
1. ✅ `scrape_broadband_prices.py` - Simplified payload
2. ✅ `cloud-functions/broadband-scraper/main.py` - Simplified payload
3. ✅ `cloud-functions/price-scraper/main.py` - Already correct (uses different endpoint)

## Browserless.io API Endpoints

### `/content` Endpoint
- **Purpose**: Returns fully rendered HTML of a page, including JavaScript-generated content
- **Payload**: Minimal - only `{"url": "..."}`
- **Use Case**: When you need the full HTML content for parsing

### `/scrape` Endpoint  
- **Purpose**: Extracts structured JSON data using CSS selectors
- **Payload**: `{"url": "...", "elements": [{"selector": "..."}]}`
- **Use Case**: When you need specific elements extracted as structured data

### Other Endpoints
- `/screenshot` - Capture screenshots
- `/pdf` - Generate PDFs
- `/function` - Execute custom Puppeteer scripts
- `/performance` - Run Lighthouse audits

## Testing
The simplified payload should now work correctly with the `/content` endpoint without validation errors.

## References
- [Browserless REST APIs Documentation](https://docs.browserless.io/rest-apis/intro)
- [Browserless /content Endpoint](https://docs.browserless.io/rest-apis/content)

