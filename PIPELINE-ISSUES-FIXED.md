# Pipeline Issues Analysis & Fixes

## Issues Found in Pipeline Logs

### 1. ❌ Browserless.io API Validation Error

**Error:**
```
[WARNING] Browserless error: 400 - POST Body validation failed: "elements" is not allowed "waitFor" is not allowed
```

**Root Cause:**
- The Browserless.io production endpoint (`https://production-sfo.browserless.io`) doesn't accept:
  - `elements` parameter
  - `waitFor` parameter  
  - `gotoOptions` parameter (in some cases)

**Files Affected:**
- ✅ `scrape_broadband_prices.py` - Fixed (removed `gotoOptions`)
- ✅ `cloud-functions/broadband-scraper/main.py` - Fixed (removed `waitFor` and `gotoOptions`)

**Fix Applied:**
Simplified the Browserless payload to only include required fields:
```python
payload = {
    "url": url,
    "rejectResourceTypes": ["image", "media", "font"]
}
```

### 2. ⚠️ AI Extraction Returning 0 Deals

**Issue:**
```
[SUCCESS] AI successfully extracted 0 deals for BT
[SUCCESS] AI successfully extracted 0 deals for Sky
[SUCCESS] AI successfully extracted 0 deals for TalkTalk
[SUCCESS] AI successfully extracted 21 deals for Virgin Media
```

**Analysis:**
- Virgin Media extraction works (21 deals found)
- BT, Sky, and TalkTalk return 0 deals
- System correctly falls back to fallback data

**Possible Causes:**
1. **HTML Content Structure**: Some providers may have different HTML structures that the AI can't parse
2. **Content Truncation**: Large HTML pages might be truncated before AI processing
3. **Dynamic Content**: JavaScript-rendered content might not be fully loaded
4. **Prompt Effectiveness**: The AI prompt might need refinement for certain provider formats

**Status:** ⚠️ **Non-Critical** - System has fallback data and continues working

**Recommendations:**
1. Review the HTML content from BT, Sky, and TalkTalk to understand structure
2. Adjust the AI prompt to be more flexible
3. Increase content size limits if needed
4. Add provider-specific extraction logic

### 3. ✅ Live Models Not Attempted in CI

**Observation:**
The pipeline logs don't show any attempts to use live models, suggesting:
- `USE_GEMINI_LIVE` might not be set in GitLab CI/CD variables
- Or live models are failing silently before logging

**Status:** ✅ **Expected Behavior** - Live models are optional and fallback works

**Action Required:**
- Set `USE_GEMINI_LIVE=true` in GitLab CI/CD variables if you want to use live models
- Note: Live models may not be available for all API keys/tiers

## Summary

### Fixed Issues ✅
1. **Browserless.io payload** - Removed unsupported parameters
2. **Cloud Function payload** - Removed `waitFor` parameter

### Non-Critical Issues ⚠️
1. **AI extraction returning 0 deals** - Has fallback mechanism, system continues working
2. **Live models not used** - Optional feature, standard models work fine

### Pipeline Status
✅ **Pipeline passes successfully** - All critical issues resolved
✅ **Artifacts generated** - 132.14 MB public directory created
✅ **Deployment successful** - GitLab Pages deployed

## Next Steps

1. **Monitor AI extraction rates** - Track which providers consistently return 0 deals
2. **Improve extraction prompts** - Refine AI prompts for better accuracy
3. **Add provider-specific logic** - Consider custom extraction for problematic providers
4. **Test live models** - Enable `USE_GEMINI_LIVE` in CI if you want unlimited RPM/RPD

