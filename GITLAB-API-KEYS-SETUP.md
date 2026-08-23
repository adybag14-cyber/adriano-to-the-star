# 🔑 GitLab CI/CD Variables - API Keys Setup Guide

**Last Updated:** January 2025  
**Purpose:** Configure all required API keys as GitLab CI/CD variables for secure deployment

---

## 📋 Required API Keys

### 🔴 **REQUIRED** (Core Features)

#### 1. **Gemini API Key** ✅ **REQUIRED**
- **Variable Name:** `GEMINI_API_KEY`
- **Purpose:** AI planet descriptions, habitability analysis, broadband scraper
- **Where to Get:** https://aistudio.google.com/app/apikey
- **Free Tier:** ✅ Unlimited requests on live model (`gemini-2.5-flash-live`)
- **Format:** `AIzaSy...` (starts with `AIza`)
- **Protected:** ✅ Yes
- **Masked:** ✅ Yes
- **Scope:** All environments

**How to Add:**
1. Go to GitLab Project → Settings → CI/CD → Variables
2. Click "Add variable"
3. **Key:** `GEMINI_API_KEY`
4. **Value:** Your Gemini API key from Google AI Studio
5. ✅ Check "Protect variable"
6. ✅ Check "Mask variable"
7. Click "Add variable"

---

### 🟡 **OPTIONAL** (Enhanced Features)

#### 2. **NASA API Key** ⚠️ **OPTIONAL**
- **Variable Name:** `NASA_API_KEY`
- **Purpose:** Real-time planet discovery updates, Astronomy Picture of the Day
- **Where to Get:** https://api.nasa.gov/
- **Free Tier:** ✅ Free (rate limited)
- **Format:** Alphanumeric string
- **Protected:** ✅ Yes
- **Masked:** ✅ Yes
- **Note:** Can use `DEMO_KEY` for testing (limited)

**How to Add:**
1. Go to https://api.nasa.gov/
2. Fill out the form to get your API key
3. Add to GitLab: `NASA_API_KEY` = your NASA API key

---

#### 3. **Supabase Credentials** ✅ **ALREADY CONFIGURED**
- **File:** `supabase-config.js`
- **Status:** Already configured in code
- **Note:** No GitLab variable needed (configured in `supabase-config.js`)

**Current Configuration:**
- URL: `https://sepesbfytkmbgjyfqriw.supabase.co`
- Anon Key: Already set in `supabase-config.js`

---

### 🟢 **OPTIONAL** (Advanced Features)

#### 4. **Stripe Public Key** ✅ **CONFIGURED** (For Payments)
- **Variable Name:** `STRIPE_PUBLIC_KEY`
- **Purpose:** Payment processing in planet trading marketplace
- **Where to Get:** https://dashboard.stripe.com/apikeys
- **Format:** `pk_test_...` (test) or `pk_live_...` (production)
- **Protected:** ✅ Yes
- **Masked:** ✅ Yes
- **Status:** ✅ **Already added to GitLab CI/CD**
- **Note:** Key is automatically injected into `stripe-config.js` during build

**How to Add:**
1. Go to Stripe Dashboard → Developers → API keys
2. Copy "Publishable key"
3. Add to GitLab: `STRIPE_PUBLIC_KEY` = your Stripe publishable key
4. ✅ **Already configured:** `pk_live_51MqMskC7XtJZK01IulzGo8IItJE6NE8RmgoXhCizcLxbbDxit8VxQekWUpQbHSdlw14B2Geay5xVKYrBGPMgGPAl00lr0OvaIv`

---

#### 5. **PayPal Client ID** ⚠️ **OPTIONAL** (For Payments)
- **Variable Name:** `PAYPAL_CLIENT_ID`
- **Purpose:** Payment processing in planet trading marketplace
- **Where to Get:** https://developer.paypal.com/dashboard/
- **Format:** Alphanumeric string
- **Protected:** ✅ Yes
- **Masked:** ✅ Yes
- **Note:** Only needed if using PayPal payments

**How to Add:**
1. Go to PayPal Developer Dashboard
2. Create an app
3. Copy "Client ID"
4. Add to GitLab: `PAYPAL_CLIENT_ID` = your PayPal client ID

---

#### 6. **Pinata API Key** ⚠️ **OPTIONAL** (For NFTs/IPFS)
- **Variable Name:** `PINATA_API_KEY`
- **Purpose:** Upload NFT metadata to IPFS
- **Where to Get:** https://app.pinata.cloud/keys
- **Format:** Alphanumeric string
- **Protected:** ✅ Yes
- **Masked:** ✅ Yes
- **Note:** Only needed for blockchain/NFT features

**How to Add:**
1. Go to Pinata Dashboard → API Keys
2. Create new API key
3. Copy "API Key" and "Secret API Key"
4. Add to GitLab:
   - `PINATA_API_KEY` = your Pinata API key
   - `PINATA_SECRET_KEY` = your Pinata secret key

---

#### 7. **Pinata Secret Key** ⚠️ **OPTIONAL** (For NFTs/IPFS)
- **Variable Name:** `PINATA_SECRET_KEY`
- **Purpose:** Upload NFT metadata to IPFS
- **Where to Get:** Same as Pinata API Key
- **Format:** Alphanumeric string
- **Protected:** ✅ Yes
- **Masked:** ✅ Yes

---

#### 8. **Web3.Storage API Key** ⚠️ **OPTIONAL** (Alternative to Pinata)
- **Variable Name:** `WEB3_STORAGE_API_KEY`
- **Purpose:** Alternative IPFS storage for NFT metadata
- **Where to Get:** https://web3.storage/
- **Format:** Alphanumeric string
- **Protected:** ✅ Yes
- **Masked:** ✅ Yes
- **Note:** Alternative to Pinata, choose one

**How to Add:**
1. Go to Web3.Storage
2. Sign up and create API token
3. Add to GitLab: `WEB3_STORAGE_API_KEY` = your Web3.Storage token

---

#### 9. **NFT Contract Address** ⚠️ **OPTIONAL** (For Blockchain)
- **Variable Name:** `NFT_CONTRACT_ADDRESS`
- **Purpose:** Deployed ERC-721 NFT smart contract address
- **Where to Get:** After deploying NFT contract to blockchain
- **Format:** `0x...` (Ethereum address format)
- **Protected:** ✅ Yes
- **Masked:** ❌ No (addresses are public)
- **Note:** Only needed if deploying smart contracts

**How to Add:**
1. Deploy NFT contract to blockchain (Polygon, Ethereum, etc.)
2. Copy contract address
3. Add to GitLab: `NFT_CONTRACT_ADDRESS` = your contract address

---

## 📝 Quick Setup Checklist

### **Minimum Required (Core Features):**
- [ ] `GEMINI_API_KEY` - **REQUIRED** for AI features

### **Recommended (Enhanced Features):**
- [ ] `NASA_API_KEY` - For NASA API integration

### **Optional (Advanced Features):**
- [x] `STRIPE_PUBLIC_KEY` - ✅ **CONFIGURED** - For payment processing
- [ ] `PAYPAL_CLIENT_ID` - For PayPal payments
- [ ] `PINATA_API_KEY` + `PINATA_SECRET_KEY` - For NFT/IPFS
- [ ] `WEB3_STORAGE_API_KEY` - Alternative IPFS storage
- [ ] `NFT_CONTRACT_ADDRESS` - For blockchain features

---

## 🔧 How to Add Variables in GitLab

### **Step-by-Step:**

1. **Navigate to CI/CD Variables:**
   - Go to your GitLab project
   - Click **Settings** → **CI/CD**
   - Expand **Variables** section
   - Click **Add variable**

2. **For Each API Key:**
   - **Key:** Enter variable name (e.g., `GEMINI_API_KEY`)
   - **Value:** Paste your API key
   - ✅ **Protect variable:** Check this (only available in protected branches)
   - ✅ **Mask variable:** Check this (hides value in logs)
   - **Environment scope:** Leave blank (all environments) or specify
   - Click **Add variable**

3. **Repeat for all required keys**

---

## 🔒 Security Best Practices

### **✅ DO:**
- ✅ Use **Masked** variables for sensitive keys
- ✅ Use **Protected** variables for production keys
- ✅ Use different keys for test/production
- ✅ Rotate keys periodically
- ✅ Use environment-specific scopes when needed

### **❌ DON'T:**
- ❌ Commit API keys to code
- ❌ Share API keys in public repositories
- ❌ Use production keys in development
- ❌ Expose keys in logs or error messages

---

## 📋 Variable Reference Table

| Variable Name | Required | Purpose | Where to Get |
|---------------|----------|---------|--------------|
| `GEMINI_API_KEY` | ✅ **YES** | AI features | https://aistudio.google.com/app/apikey |
| `NASA_API_KEY` | ⚠️ Optional | NASA API | https://api.nasa.gov/ |
| `STRIPE_PUBLIC_KEY` | ⚠️ Optional | Payments | https://dashboard.stripe.com/apikeys |
| `PAYPAL_CLIENT_ID` | ⚠️ Optional | Payments | https://developer.paypal.com/ |
| `PINATA_API_KEY` | ⚠️ Optional | IPFS/NFTs | https://app.pinata.cloud/keys |
| `PINATA_SECRET_KEY` | ⚠️ Optional | IPFS/NFTs | https://app.pinata.cloud/keys |
| `WEB3_STORAGE_API_KEY` | ⚠️ Optional | IPFS/NFTs | https://web3.storage/ |
| `NFT_CONTRACT_ADDRESS` | ⚠️ Optional | Blockchain | After contract deployment |

---

## 🚀 Using Variables in Code

### **In JavaScript Files:**

Variables are automatically available in GitLab CI/CD. For frontend code, you'll need to inject them:

**Option 1: Inject in HTML (Recommended for GitLab Pages):**
```html
<script>
    // Inject from GitLab CI/CD variables
    window.GEMINI_API_KEY = '{{ GEMINI_API_KEY }}'; // Would need server-side rendering
    // OR use gemini-config.js for client-side
</script>
```

**Option 2: Use Config Files (Current Approach):**
- Update `gemini-config.js` with your API key
- File is already in `.gitignore` pattern (should be)
- Or use environment-specific config files

**Option 3: Build-Time Injection (For CI/CD):**
```yaml
# In .gitlab-ci.yml
script:
  - sed -i "s/YOUR_GEMINI_API_KEY_HERE/$GEMINI_API_KEY/g" gemini-config.js
```

---

## 📝 Configuration Files

### **Files That Need API Keys:**

1. **`gemini-config.js`** - Gemini API key
   ```javascript
   const GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY_HERE';
   ```

2. **`nasa-api-config.js`** - NASA API key (if exists)
   ```javascript
   const NASA_API_KEY = 'YOUR_NASA_API_KEY_HERE';
   ```

3. **`supabase-config.js`** - Already configured ✅

4. **Payment Keys** - Set in `marketplace-payment-integration.js`:
   ```javascript
   window.STRIPE_PUBLIC_KEY = 'your-stripe-key';
   window.PAYPAL_CLIENT_ID = 'your-paypal-client-id';
   ```

5. **IPFS Keys** - Set in `blockchain-nft-integration.js`:
   ```javascript
   window.PINATA_API_KEY = 'your-pinata-key';
   window.PINATA_SECRET_KEY = 'your-pinata-secret';
   window.WEB3_STORAGE_API_KEY = 'your-web3-storage-key';
   ```

6. **Blockchain** - Set in `blockchain-nft-integration.js`:
   ```javascript
   window.NFT_CONTRACT_ADDRESS = '0x...';
   ```

---

## 🎯 Recommended Setup

### **For Production:**
1. ✅ Add `GEMINI_API_KEY` (REQUIRED)
2. ✅ Add `NASA_API_KEY` (Recommended)
3. ⚠️ Add payment keys if using marketplace
4. ⚠️ Add IPFS keys if using NFTs
5. ⚠️ Add contract address if using blockchain

### **For Development:**
- Use same keys or separate test keys
- Consider using `.env` file locally (not committed)

---

## 🔍 Verification

### **Check Variables Are Set:**

1. **In GitLab:**
   - Go to Settings → CI/CD → Variables
   - Verify all variables are listed
   - Check "Masked" and "Protected" status

2. **In Code:**
   - Check browser console: `console.log(window.GEMINI_API_KEY)`
   - Should show your key (if not masked in logs)

3. **Test Features:**
   - Try generating AI planet description
   - Check NASA API integration
   - Test payment flow (if configured)

---

## 📚 Additional Resources

- **Gemini API:** https://aistudio.google.com/app/apikey
- **NASA API:** https://api.nasa.gov/
- **Stripe:** https://dashboard.stripe.com/apikeys
- **PayPal:** https://developer.paypal.com/
- **Pinata:** https://app.pinata.cloud/
- **Web3.Storage:** https://web3.storage/

---

## ⚠️ Important Notes

1. **Gemini API Key is REQUIRED** for AI features to work
2. **Supabase is already configured** in `supabase-config.js` (no GitLab variable needed)
3. **All other keys are OPTIONAL** - features will work with fallbacks if not set
4. **Never commit API keys** to the repository
5. **Use GitLab CI/CD variables** for secure key management

---

**Last Updated:** January 2025  
**Status:** ✅ Ready for configuration

