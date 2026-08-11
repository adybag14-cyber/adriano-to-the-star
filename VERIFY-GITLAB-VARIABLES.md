# GitLab CI/CD Variables Verification Guide

## ✅ Current Variables Status

Based on your GitLab CI/CD Variables page, you have:

| Variable | Status | Notes |
|----------|--------|-------|
| `BROWSERLESS_API_KEY` | ✅ Protected, Masked | For JavaScript rendering |
| `GEMINI_API_KEY` | ✅ Protected, Masked | Should be: `GEMINI_API_KEY_2` |
| `USE_GEMINI_LIVE` | ✅ Protected, Visible | Should be: `true` |

## 🔍 How to Verify Values

Since variables are masked/protected, you can verify them by:

### Method 1: Edit to View (Recommended)

1. Go to **Settings → CI/CD → Variables**
2. Click the **Edit icon** (pencil) next to each variable
3. Check the **Value** field:
   - `GEMINI_API_KEY` should be: `GEMINI_API_KEY_2`
   - `USE_GEMINI_LIVE` should be: `true` (lowercase, no quotes)

### Method 2: Test in Pipeline

Add a temporary job to your `.gitlab-ci.yml` to echo the values:

```yaml
test-vars:
  stage: .pre
  script:
    - echo "GEMINI_API_KEY is set: $([bool]$env:GEMINI_API_KEY)"
    - echo "USE_GEMINI_LIVE = $env:USE_GEMINI_LIVE"
  tags:
    - windows
    - shell
```

⚠️ **Remove this job after testing** - it will expose masked values in logs!

## ✅ Correct Configuration

### GEMINI_API_KEY
- **Key**: `GEMINI_API_KEY`
- **Value**: `GEMINI_API_KEY_2`
- **Type**: Variable
- **Visibility**: Masked ✅
- **Protect variable**: ✅ (optional, but recommended)
- **Expand variable reference**: ❌ (unchecked)

### USE_GEMINI_LIVE
- **Key**: `USE_GEMINI_LIVE`
- **Value**: `true` (lowercase, no quotes)
- **Type**: Variable
- **Visibility**: Visible (cannot mask - too short)
- **Protect variable**: ✅ (optional)
- **Expand variable reference**: ❌ (unchecked)

### BROWSERLESS_API_KEY
- **Key**: `BROWSERLESS_API_KEY`
- **Value**: Your Browserless API key
- **Type**: Variable
- **Visibility**: Masked ✅
- **Protect variable**: ✅ (optional)

## 🎯 What the Code Expects

The `main.py` file will:

1. **Check environment variables first**:
   ```python
   GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'GEMINI_API_KEY_2')
   USE_LIVE_MODEL = os.environ.get('USE_GEMINI_LIVE', 'true').lower() == 'true'
   ```

2. **Use defaults if not set**:
   - If `GEMINI_API_KEY` is not set → uses hardcoded default
   - If `USE_GEMINI_LIVE` is not set → defaults to `'true'`

3. **Priority order**:
   - Environment variable (from GitLab CI/CD) → **Highest priority**
   - Hardcoded default in code → **Fallback**

## 🚀 Deployment Scripts Updated

All deployment scripts have been updated to use the correct API key:

- ✅ `DEPLOY-AUTO.ps1` - Updated
- ✅ `DEPLOY-NOW.ps1` - Updated  
- ✅ `deploy.sh` - Updated

## 📋 Verification Checklist

- [ ] `GEMINI_API_KEY` value matches: `GEMINI_API_KEY_2`
- [ ] `USE_GEMINI_LIVE` value is exactly: `true` (lowercase)
- [ ] Both variables are set to "All (default)" environments
- [ ] `GEMINI_API_KEY` is masked (shows `•••••`)
- [ ] `USE_GEMINI_LIVE` is visible (shows `true` or `***`)
- [ ] Both are protected (if you want them only on protected branches)

## 🔧 How to Update Variables

If you need to update a variable:

1. Go to **Settings → CI/CD → Variables**
2. Click the **Edit icon** (pencil) next to the variable
3. Update the **Value** field
4. Click **"Update variable"**

## ⚠️ Important Notes

1. **Case Sensitivity**: `USE_GEMINI_LIVE` must be lowercase `true`, not `True` or `TRUE`
2. **No Quotes**: Don't put quotes around the value in GitLab
3. **Masking**: `USE_GEMINI_LIVE` cannot be masked (too short), but that's OK - it's not sensitive
4. **API Key**: The API key IS sensitive - must be masked
5. **Environments**: "All (default)" means the variable is available in all pipeline jobs

## 🧪 Testing

After verifying variables, test by:

1. Running a pipeline job
2. Checking logs for: `"Gemini API configured. Live models enabled: True"`
3. Verifying the function uses `gemini-2.5-flash-live` model
4. Confirming unlimited RPM/RPD requests work

## 📞 Troubleshooting

### Variable not found in pipeline
- Check variable name spelling (case-sensitive)
- Verify it's set to "All (default)" environments
- Check if "Protect variable" is blocking access

### Wrong value being used
- Edit the variable and verify the value
- Check for extra spaces or quotes
- Ensure value matches exactly (case-sensitive for `true`)

### API key not working
- Verify the API key is correct: `GEMINI_API_KEY_2`
- Check if it's masked correctly (should show `•••••` in UI)
- Test the API key directly with Google's API

