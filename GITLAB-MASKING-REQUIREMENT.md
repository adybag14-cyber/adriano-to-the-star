# GitLab Masking Requirement Fix

## ❌ Error You're Seeing

```
Unable to create masked variable because:
* The value must have 8 characters.
```

## 🔍 Root Cause

GitLab requires **masked variables to have at least 8 characters**. The value `true` is only 4 characters, so it cannot be masked.

## ✅ Solution

**Don't mask `USE_GEMINI_LIVE`** - it's not sensitive data!

### Correct Setup:

**Variable 1: USE_GEMINI_LIVE**
- **Key**: `USE_GEMINI_LIVE`
- **Value**: `true`
- **Visibility**: ✅ **"Visible"** (not masked - it's just a boolean flag, not sensitive)

**Variable 2: GEMINI_API_KEY**
- **Key**: `GEMINI_API_KEY`
- **Value**: `GEMINI_API_KEY_2`
- **Visibility**: ✅ **"Masked"** (required - this IS sensitive!)

## 📋 Why This is Safe

- `USE_GEMINI_LIVE=true` is **not sensitive** - it's just a configuration flag
- Anyone can see it's enabled - that's fine
- The **API key** is what needs to be protected (and it's long enough to mask)

## 🎯 Quick Fix

1. Change **Visibility** from "Masked" to **"Visible"** for `USE_GEMINI_LIVE`
2. Keep **"Masked"** for `GEMINI_API_KEY` (it's 39 characters, so it can be masked)
3. Click "Add variable"

## ✅ Result

- `USE_GEMINI_LIVE` = `true` (visible in logs - that's OK!)
- `GEMINI_API_KEY` = `***` (masked in logs - protected!)

