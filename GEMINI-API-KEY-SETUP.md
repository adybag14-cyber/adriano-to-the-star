# 🔑 Gemini API Key Setup

## ✅ Free Tier Benefits

**Great news!** The Gemini free tier includes **unlimited requests** on the live model (`gemini-2.5-flash-live`). This means you can use AI features without worrying about rate limits!

## 📝 Setup Instructions

### Step 1: Get Your API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy your API key (starts with `AIza...`)

### Step 2: Configure the API Key

**Option A: Update `gemini-config.js` (Recommended)**

Open `gemini-config.js` and replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key:

```javascript
const GEMINI_API_KEY = 'AIzaSy...your-actual-key-here';
```

**Option B: Set in HTML (Alternative)**

Add this script tag **before** any AI-related scripts in your HTML:

```html
<script>
    window.GEMINI_API_KEY = 'AIzaSy...your-actual-key-here';
</script>
```

**Option C: Environment Variable (For CI/CD)**

In GitLab CI/CD variables:
- **Key:** `GEMINI_API_KEY`
- **Value:** Your API key
- **Protected:** ✅ Yes
- **Masked:** ✅ Yes

## 🎯 Features Using Gemini Live Model

The following features use the live model with unlimited requests:

1. **AI Planet Descriptions** (`ai-planet-descriptions.js`)
   - Generates detailed descriptions for exoplanets
   - Uses `gemini-2.5-flash-live:generateContent`
   - Caches results in localStorage

2. **Broadband Price Scraper** (Cloud Function)
   - AI-enhanced web scraping
   - Uses live model for content extraction
   - Unlimited requests on free tier

## 🔒 Security Notes

- ✅ **Safe for frontend:** The API key can be used in browser code
- ⚠️ **Rate limits:** Free tier has unlimited requests on live model only
- 🔐 **Protect your key:** Don't commit it to public repositories
- 📝 **Use GitLab variables:** For CI/CD, use masked variables

## 🚀 Verification

After setting up your API key, verify it works:

1. Open browser console
2. Check: `console.log(window.GEMINI_API_KEY)` should show your key
3. Visit database page and try generating an AI description
4. Check console for: `✅ AI description generated successfully`

## 📊 Model Information

- **Model:** `gemini-2.5-flash-live`
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-live:generateContent`
- **Free Tier:** ✅ Unlimited requests
- **Rate Limits:** None on live model (free tier)

## 🐛 Troubleshooting

### "API key not found"
- Check `gemini-config.js` is loaded before `ai-planet-descriptions.js`
- Verify `window.GEMINI_API_KEY` is set in console
- Ensure script tag order is correct in HTML

### "API error: 400"
- Verify API key is correct
- Check key hasn't been revoked
- Ensure key has access to Gemini API

### "API error: 429"
- This shouldn't happen on free tier with live model
- If it does, check your API key tier/plan
- Verify you're using `gemini-2.5-flash-live` model

---

**Last Updated:** January 2025  
**Model:** gemini-2.5-flash-live  
**Free Tier:** ✅ Unlimited requests

