# Audit Continuation Report – Non-API-Key Fixes & Further Findings

**Date:** 2025-12-11  
**Scope:** Continuation of expert audit with explicit instruction to **ignore API key issues**. This report focuses on **all other issues** discovered and fixed.

---

## 1. Summary (What Changed)

This continuation session implemented concrete remediations for several **high-impact non-key issues** identified in runtime entry points:

- Hardened backend JWT handling by disallowing a default secret in production.
- Tightened CORS for backend auth + planet claim servers (production allowlist support).
- Fixed Supabase Edge Function `verify-2fa` to perform **real TOTP verification** (no longer “any 6 digits”).
- Reduced 2FA secret persistence risk by preventing client-side `localStorage` persistence when Supabase is available.
- Removed duplicate `/api/cli/download` endpoint and added an optional production auth gate.
- Hardened Cloudflare Worker CORS behavior by adding preflight handling and allowing origin allowlists.
- Hardened `/api/secure/ping` by removing a default token fallback and disabling unless `API_TOKEN` is set.

---

## 2. Fixes Implemented (File-by-file)

### 2.1 Require explicit JWT secret in production

**Files:**
- `backend/auth-server.js`
- `backend/planet-server.js`

**Issue:**
- Both servers used a production-dangerous fallback:
  - `process.env.JWT_SECRET || 'your-secret-key-change-in-production'`

**Fix:**
- In production, the fallback is removed and the server fails fast:
  - `JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV==='production' ? null : '...')`
  - Throws on startup if missing.

**Impact:**
- Prevents trivial token forgery in misconfigured deployments.

---

### 2.2 Tighten backend CORS behavior (production allowlist)

**Files:**
- `backend/auth-server.js`
- `backend/planet-server.js`

**Issue:**
- Both servers used `cors()` for all origins unconditionally.

**Fix:**
- Added `CORS_ORIGINS` allowlist support for production:
  - If `CORS_ORIGINS` is set and `NODE_ENV==='production'`, only those origins are allowed.
  - Otherwise, keeps permissive behavior (dev friendliness).

---

### 2.3 Supabase Edge Function `verify-2fa`: real TOTP verification

**File:** `supabase/functions/verify-2fa/index.ts`

**Issue:**
- Verification previously accepted any 6 digits:
  - `code.length === 6 && /^\d{6}$/`.

**Fix:**
- Implemented a minimal RFC6238-style TOTP verifier using WebCrypto:
  - Base32 decode
  - HMAC-SHA1
  - Dynamic truncation
  - 30-second time step
  - +/- 1 time-step window

**Also changed:**
- Secret generation now uses `crypto.getRandomValues` rather than `Math.random`.
- CORS is now:
  - `*` if no env allowlist is provided
  - restricted when `ALLOWED_ORIGINS` is provided.

**Impact:**
- Prevents immediate 2FA bypass while keeping the “single edge function” architecture.

---

### 2.4 Reduce risk of leaking 2FA secrets into localStorage

**File:** `two-factor-auth.js`

**Issue:**
- The client stored `2fa-secret` in localStorage even when Supabase was available.

**Fix:**
- Only persist to localStorage when Supabase is not available:
  - If Supabase exists, rely on server persistence only.

**Impact:**
- Reduces exposure of 2FA secret material in the browser.

---

### 2.5 Remove duplicate `/api/cli/download` handler + add optional prod auth gate

**File:** `backend/stellar-ai-server.js`

**Issue:**
- `/api/cli/download` was defined twice.
- One handler also executed a subprocess to generate a zip on demand.

**Fix:**
- Removed the duplicate handler.
- Added an optional production gate:
  - If `NODE_ENV==='production'` and `API_TOKEN` exists, requests must send `Authorization: Bearer <API_TOKEN>`.

**Impact:**
- Reduces ambiguity and limits easy abuse in production.

---

### 2.6 Cloudflare Worker: preflight + origin allowlisting support

**File:** `worker.js`

**Issue:**
- Always returned wildcard CORS (`*`) and did not explicitly handle `OPTIONS`.

**Fix:**
- Added preflight response handling (`OPTIONS`).
- Added allowlist support with `env.ALLOWED_ORIGINS`.
  - If allowlist not configured, behavior remains permissive.

**Impact:**
- Improves correctness and lets production deployments restrict cross-origin reads.

---

### 2.7 Remove default token fallback for `/api/secure/ping`

**File:** `backend/server.js`

**Issue:**
- Endpoint could be enabled with a default `test-token` in non-production.

**Fix:**
- Endpoint is disabled unless `API_TOKEN` is explicitly set.

---

## 3. Additional Findings (Non-API-Key) – Not Yet Fixed

### 3.1 Backend `server.js` provides many mock endpoints without auth

**File:** `backend/server.js`

**Observation:**
- Many routes return “mock” data and accept writes without authentication.

**Risk:**
- If this server is ever deployed publicly and used as a real backend, it creates a large attack surface.

**Recommendation:**
- Add an explicit “mock mode” flag and disable these endpoints in production.

---

### 3.2 Two-factor auth client still has a demo/offline branch

**File:** `two-factor-auth.js`

**Observation:**
- Some fallback behaviors remain for offline/demo usage.

**Recommendation:**
- Ensure production pages never use demo auth paths for real security decisions.

---

## 4. What You Should Configure (Non-Key)

- **JWT secret:** set `JWT_SECRET` in production for:
  - `backend/auth-server.js`
  - `backend/planet-server.js`

- **CORS allowlists:** set `CORS_ORIGINS` for the backend services if deploying publicly.

- **Supabase Edge function CORS:** optionally set `ALLOWED_ORIGINS` for `verify-2fa`.

- **Stellar AI CLI download protection:** optionally set `API_TOKEN` to protect `/api/cli/download`.

- **Cloudflare Worker CORS:** optionally set `ALLOWED_ORIGINS` in Worker environment.

---

## 5. Change Log (Audit Continuation)

- Updated: `backend/auth-server.js`
- Updated: `backend/planet-server.js`
- Updated: `backend/stellar-ai-server.js`
- Updated: `backend/server.js`
- Updated: `supabase/functions/verify-2fa/index.ts`
- Updated: `two-factor-auth.js`
- Updated: `worker.js`

---

## 6. Status

- **Non-key fixes implemented:** ✅
- **Audit continuation report generated:** ✅ (`AUDIT-CONTINUATION-2025-12-11.md`)
- **Remaining non-key audit items:** listed in Section 3.

---

## 7. Additional Audit Continuation (Later on 2025-12-11)

### 7.1 Messaging page runtime-breaker fixed (`messaging.js`)

**Files:**
- `messaging.js`
- `public/messaging.js`

**Issue:**
- `DirectMessaging` had a broken method structure where `trackEvent` was accidentally nested inside `init()` and an `else if` was injected at the wrong indentation level.
- This would prevent the script from parsing, causing the Direct Messages page to fail entirely.

**Fix:**
- Reconstructed `init()` so it closes correctly.
- Restored `trackEvent()` as a proper class method.

**Impact:**
- Restores runtime stability for `messaging.html`.

---

### 7.2 Reduced unauthenticated production surface by gating mock APIs

**File:** `backend/server.js`

**Issue:**
- The "Frontend Compatibility API" block exposed multiple unauthenticated endpoints that return mock data and accept writes.

**Fix:**
- These endpoints are now only enabled when:
  - `NODE_ENV` is not `production`, or
  - `ENABLE_MOCK_APIS === 'true'`.

**Impact:**
- Prevents accidental exposure of broad unauthenticated endpoints in production deployments.

---

### 7.3 Feature flag query override restricted to localhost

**File:** `feature-flags.js`

**Issue:**
- `enable_all_features=true` in `window.location.search` enabled all feature flags unconditionally.

**Fix:**
- This override is now only honored on:
  - `localhost`
  - `127.0.0.1`
  - `0.0.0.0`

**Impact:**
- Prevents feature escalation via URL query in production.

---

### 7.4 OAuth integration gated to localhost and state cleared after use

**Files:**
- `oauth-integration-system.js`
- `public/oauth-integration-system.js`

**Issue:**
- The OAuth demo attempted client-side token exchange and stored token/user info in browser storage.

**Fix:**
- OAuth init and token exchange are now gated to localhost only.
- After successful state validation, the stored state value is removed from `sessionStorage`.

**Impact:**
- Prevents accidental production execution of an unsafe client-side OAuth flow.

