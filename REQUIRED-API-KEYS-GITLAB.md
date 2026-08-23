#  Required API Keys for GitLab Project Settings

**Last Updated:** November 27, 2025  
**Purpose:** List all API keys used in code that need to be added to GitLab CI/CD Variables

---

## [OK] **Already Configured in GitLab**

These API keys are **already set up** in your GitLab project settings:

1. [OK] **`GEMINI_API_KEY`** - Already configured
2. [OK] **`STRIPE_PUBLIC_KEY`** - Already configured
3. [OK] **`PINATA_API_KEY`** - Already configured
4. [OK] **`PINATA_SECRET_KEY`** - Already configured
5. [OK] **`BROWSERLESS_API_KEY`** - Already configured
6. [OK] **`USE_GEMINI_LIVE`** - Already configured (environment flag, not API key)

---

## [NOT SET] **Missing from GitLab (Need to Add)**

These API keys are **used in the code** but **NOT yet in GitLab project settings**:

### 1. **`WEB3_STORAGE_API_KEY`** [WARNING] **OPTIONAL**
- **Status:** [NOT SET] Not in GitLab
- **Used in:** `blockchain-nft-integration.js` (line 144, 194)
- **Purpose:** Alternative IPFS storage for NFT metadata (alternative to Pinata)
- **Where to Get:** https://web3.storage/
- **Priority:**  **LOW** - Only needed if using Web3.Storage instead of Pinata
- **Action:** Only add if you want to use Web3.Storage as an alternative to Pinata

**Code Reference:**
```javascript
// blockchain-nft-integration.js
if (window.WEB3_STORAGE_API_KEY) {
    return await this.uploadToWeb3Storage(metadata);
}
```

---

### 2. **`NFT_CONTRACT_ADDRESS`** [WARNING] **OPTIONAL**
- **Status:** [NOT SET] Not in GitLab
- **Used in:** `blockchain-nft-integration.js` (referenced in GITLAB-API-KEYS-SETUP.md)
- **Purpose:** Deployed ERC-721 NFT smart contract address on blockchain
- **Where to Get:** After deploying NFT contract to Ethereum/Polygon/etc.
- **Format:** `0x...` (Ethereum address format)
- **Priority:**  **LOW** - Only needed if using blockchain NFT features
- **Action:** Only add if you've deployed an NFT contract

---

##  **Backend-Only Variables (NOT for GitLab Pages)**

These are used in **backend services** (Node.js/Python), not in the frontend GitLab Pages build:

### **Tracker API** (Backend Only)
- `TRACKER_API_KEY` - Used in `tracker-api/index.js`
- `DB_USER`, `DB_PASS`, `DB_NAME`, `DB_HOST`, `DB_PORT`, `DB_SSL` - Database credentials
- **Note:** These are for backend services, not GitLab Pages CI/CD

### **Backend Services** (Not for GitLab Pages)
- `JWT_SECRET` - Used in `backend/planet-server.js`, `backend/auth-server.js`
- `STELLAR_AI_PORT`, `PLANET_PORT`, `AUTH_PORT` - Backend service ports
- **Note:** These are for local/cloud backend services, not GitLab Pages

---

##  **Summary**

### **For GitLab CI/CD Variables (Frontend Build):**

**Already Added:**
- [OK] `GEMINI_API_KEY`
- [OK] `STRIPE_PUBLIC_KEY`
- [OK] `PINATA_API_KEY`
- [OK] `PINATA_SECRET_KEY`
- [OK] `BROWSERLESS_API_KEY`
- [OK] `USE_GEMINI_LIVE`

**Optional (Not Required):**
- [WARNING] `WEB3_STORAGE_API_KEY` - Only if using Web3.Storage instead of Pinata
- [WARNING] `NFT_CONTRACT_ADDRESS` - Only if using blockchain NFT features

**Excluded (As Requested):**
- [NOT SET] `PAYPAL_CLIENT_ID` - Excluded per your request

---

##  **Recommendation**

**You have all required API keys configured!** [OK]

The only optional ones you might want to add are:
1. **`WEB3_STORAGE_API_KEY`** - If you want an alternative to Pinata for IPFS
2. **`NFT_CONTRACT_ADDRESS`** - If you deploy NFT contracts

**Current Status:** [OK] **All essential APIs are configured**

---

##  **How to Add Optional Keys (If Needed)**

### **WEB3_STORAGE_API_KEY:**
1. Go to GitLab: **Settings → CI/CD → Variables**
2. Click **"Add variable"**
3. **Key:** `WEB3_STORAGE_API_KEY`
4. **Value:** Your Web3.Storage API token
5. **Type:** Variable
6. **Masked:** [OK] Yes
7. **Protected:** [OK] Optional
8. Click **"Add variable"**

### **NFT_CONTRACT_ADDRESS:**
1. Go to GitLab: **Settings → CI/CD → Variables**
2. Click **"Add variable"**
3. **Key:** `NFT_CONTRACT_ADDRESS`
4. **Value:** `0x...` (your contract address)
5. **Type:** Variable
6. **Masked:** [NOT SET] No (addresses are public anyway)
7. **Protected:** [OK] Optional
8. Click **"Add variable"**

---

## [OK] **Final Checklist**

- [x] `GEMINI_API_KEY` - [OK] Configured
- [x] `STRIPE_PUBLIC_KEY` - [OK] Configured
- [x] `PINATA_API_KEY` - [OK] Configured
- [x] `PINATA_SECRET_KEY` - [OK] Configured
- [x] `BROWSERLESS_API_KEY` - [OK] Configured
- [x] `USE_GEMINI_LIVE` - [OK] Configured
- [ ] `WEB3_STORAGE_API_KEY` - [WARNING] Optional (only if using Web3.Storage)
- [ ] `NFT_CONTRACT_ADDRESS` - [WARNING] Optional (only if using blockchain NFTs)

**Status:** [OK] **All required API keys are configured!**

---

**Note:** NASA API key is hardcoded in `nasa-api-config.js` and doesn't need to be in GitLab variables (it's a public demo key).

