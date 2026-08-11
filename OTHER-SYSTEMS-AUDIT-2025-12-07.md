# Other Systems Audit – Adriano To The Star

**Date:** 2025-12-07  
**Auditor:** Cascade (AI Assistant)  
**Audience:** Lead Developer / Tech Lead

This document covers an in-depth review of “other” systems and pages in the repo, beyond the core planet catalog and AI/database flows. Focus areas:

- Secure Chat (E2E messaging)
- Two-Factor Authentication (2FA) modules
- File Storage (Supabase storage + integrations)
- Monitoring & performance telemetry
- VR/AR planet viewing, push notifications
- Marketplace, shop, workflow automation

The emphasis is on **security, correctness, and design risks**, not cosmetic UX.

---

## 1. Executive Summary

### 1.1 Overall state

- **Secure by design in most areas.**
  - Supabase RLS, storage bucket paths, and auth usage are generally solid.
  - File storage and marketplace UIs correctly escape user-facing strings.
- **One critical security bug identified:**
  - **Secure Chat XSS in decrypted messages** (see §2.4).
- **2FA modules are demos, not real security.**
  - Frontend-only, placeholder verification logic; safe as a prototype, **not** as real second factor.
- **Integrations and workflow engine introduce power features that must be admin-only.**
  - `runScript` in workflow automation effectively allows `eval` of arbitrary code.
  - Dropbox/Drive integrations assume access tokens in frontend.

### 1.2 Priority recommendations

Order of importance:

1. **Fix Secure Chat XSS vulnerability** (`secure-chat.js` `addMessageToUI`).
2. **Clarify 2FA status and harden before treating it as real security**.
3. **Lock down integrations & workflow engine to admin-only usage**; avoid long-lived tokens in frontend.
4. **Optionally optimize file storage metrics and add small hardening improvements.**

---

## 2. Secure Chat System

**Files:**
- `secure-chat.html`
- `secure-chat.js`
- `SUPABASE-SECURE-CHAT-SETUP.sql`
- `secure-crypto.js` (indirectly, for key and message crypto)

### 2.1 Architecture & Supabase data model

- **Profiles:** `public.profiles`
  - RLS: public read, self insert/update only.
  - `handle_new_user` trigger creates a profile row whenever a new auth user is created, using user metadata.
- **Message metadata:** `public.secure_messages_metadata`
  - Columns: `id`, `sender_id`, `receiver_id`, `storage_path`, `created_at`.
  - RLS:
    - Select only where `auth.uid()` is sender or receiver.
    - Insert only where `auth.uid() = sender_id`.
- **Storage bucket:** `secure-files`
  - Public keys:
    - World-readable files under `keys/*/public.json`.
  - Private keys:
    - Read/write only for authenticated owner under `keys/{uid}/private.enc`.
  - Messages:
    - Encrypted message payloads under `messages/{receiver_id}/{sender_id}_timestamp.json`.
    - RLS allows any authenticated sender to upload under `messages/%`, and only recipients to read files in their own `messages/{auth.uid()}/%` folder.

**Assessment:**
- **Confidentiality is strong:** Only sender and receiver see metadata + encrypted payloads.
- **Integrity vs spam:** Any authenticated user can upload encrypted blobs to someone’s inbox. That’s acceptable for a chat system but could be abused for storage spam.

### 2.2 Key management & E2E encryption (`secure-chat.js`)

- **Auth integration:**
  - Waits for `authManager` to be ready (`auth:ready` event + polling).
  - Uses `authManager.getCurrentUser()` and `isAuthenticated()`.
- **Key generation:**
  - Generates key pair via `window.secureCrypto.generateKeyPair()`.
  - Exports public JWK and encrypts private key with a **user-chosen password** using `secureCrypto.encryptPrivateKey`.
  - Uploads to Supabase Storage:
    - `keys/{userId}/public.json` (public, RLS-controlled)
    - `keys/{userId}/private.enc` (private, RLS-controlled)
- **Key unlock:**
  - Downloads `private.enc` and decrypts with password.
  - Also pulls and imports `public.json` for local use.

**Strengths:**
- Private keys are **never stored unencrypted** server-side.
- Clear separation between public identity (public key) and private key material.
- Uses Storage RLS effectively to enforce per-user confidentiality.

### 2.3 Messaging flow

- **Sending:**
  1. Require selected recipient and unlocked private key.
  2. Fetch recipient’s public key from `secure-files/keys/{recipientId}/public.json`.
  3. Encrypt message text with recipient’s public key via `secureCrypto.encryptMessage`.
  4. Upload encrypted payload JSON to `secure-files/messages/{receiverId}/{senderId}_{timestamp}.json`.
  5. Insert metadata row into `secure_messages_metadata` with `storage_path` and timestamps.
  6. Optimistically show message in sender UI.

- **Receiving:**
  1. Query `secure_messages_metadata` for all messages where current user is sender or receiver.
  2. For **sent** messages:
     - UI currently shows placeholder “🔒 Encrypted Message Sent” rather than decrypting a local copy. (Design tradeoff; acceptable for MVP.)
  3. For **received** messages:
     - Downloads encrypted JSON from `secure-files`.
     - Decrypts with current user’s private key.
     - Displays decrypted plaintext in the UI via `addMessageToUI(text, 'received')`.

### 2.4 Critical issue: XSS in decrypted message display

**Code path:** `secure-chat.js` → `downloadAndDecryptMessage()` → `addMessageToUI(text, type)`

```js
addMessageToUI(text, type) {
    const container = document.getElementById('messages-container');
    const el = document.createElement('div');
    el.className = `message ${type} encrypted`;
    el.innerHTML = `<span class="message-lock-icon">🔒</span> ${text}`;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
}
``

- `text` here is **decrypted plaintext** from the sender.
- Because it’s inserted directly via `innerHTML`, a malicious sender can craft a message like:

  ```html
  <img src=x onerror="alert('XSS')">
  ```

  or more serious payloads (session theft, DOM manipulation) which will execute **in the recipient’s browser** when decrypted and rendered.
- Encryption does not protect against this; it only hides the payload in transit.

**Threat model:**
- Any user you chat with can run arbitrary JS in your browser when you view their messages.
- Given this is explicitly marketed as “Secure Chat”, this is a **major trust violation**.

**Recommended fix:**

- Treat decrypted message text as plain text, not HTML.
- Options:
  - **Option A (simple, preferred):**

    ```js
    addMessageToUI(text, type) {
        const container = document.getElementById('messages-container');
        const el = document.createElement('div');
        el.className = `message ${type} encrypted`;

        const lock = document.createElement('span');
        lock.className = 'message-lock-icon';
        lock.textContent = '🔒';

        const body = document.createElement('span');
        body.textContent = text; // no HTML interpretation

        el.appendChild(lock);
        el.appendChild(body);
        container.appendChild(el);
        container.scrollTop = container.scrollHeight;
    }
    ```

  - **Option B:** Use a trusted `escapeHtml` helper before using `innerHTML`.
    - There is already an `escapeHtml` helper in `SecureChatApp` for other fields; re-use that here.

**Additional hardening:**
- Add a sanity limit on `text` length (e.g. 8–16 KB) to avoid massive payloads.
- Consider basic content rules (e.g. disallow control characters) if desired.

### 2.5 Other Secure Chat observations

- **Login/dependency checks:** graceful handling when `authManager` or Supabase client aren’t ready; UI shows “Login Required” state instead of crashing.
- **Profiles:** When displaying usernames in the sidebar, names are escaped via `escapeHtml`, so directory listing itself is not XSS-prone.
- Overall, **once the XSS bug is fixed**, the design is robust and *substantially* better than many DIY “secure chat” demos.

---

## 3. Two-Factor Authentication (2FA) Modules

**Files:**
- `two-factor-auth.js` → `TwoFactorAuth`
- `two-factor-authentication.js` → `TwoFactorAuthentication`

These appear to be **duplicate / parallel 2FA prototypes** used in different contexts.

### 3.1 Current behavior

Common behaviors across the two implementations:

- Generate a **base32-ish TOTP secret** entirely on the client.
- Generate **backup codes** and display them to the user.
- Show a QR code (either via an external QR image service or a stub placeholder) with an `otpauth://` URL.
- Ask the user to enter a 6-digit code to “verify” and then store:
  - The secret and backup codes in **Supabase table `user_2fa`**.
  - Copies in `localStorage` as a fallback.

### 3.2 Major limitation: Verification is client-only, and intentionally weak

- `TwoFactorAuth.verifyTOTP(code, secret)`:
  - Comment explicitly says: “In production, use a proper TOTP library … For now … accept any 6-digit code.”
  - Actual logic: returns `true` for any 6-digit numeric string.
- `TwoFactorAuthentication.verifyTOTP(code, secret)`:
  - Similarly a placeholder that only checks basic format, not the real TOTP value.

**Implications:**

- 2FA **does not actually protect account login** in a cryptographically meaningful way.
- If UI language or documentation ever implies “Your account is now protected by 2FA”, that would be misleading.

### 3.3 Recommendations

- Treat these as **demo-only** until fully hardened:
  - Keep clearly marked as “experimental” or “visual prototype”.
  - Do not wire them into any real security-critical flow (e.g. as a gate before privileged operations) without backend support.

- When you’re ready to make 2FA real:
  - Move TOTP verification logic to the backend (Supabase functions or your own service):
    - Generate and store secrets server-side,
    - Validate codes server-side for each login attempt.
  - Use a standard TOTP library (e.g. `otplib`, `speakeasy`) in the backend.
  - Use these frontend components only to display QR codes and capture codes to send to the backend.

- Until then: **be explicit in UI copy** that this is a preview/learning tool, not production account protection.

---

## 4. File Storage Systems

### 4.1 Supabase File Storage Manager (`file-storage.js`)

**Overview:**
- Per-user file storage on Supabase bucket `user-files`.
- 1 GB per-user logical limit, 100 MB per file.
- Requires **authenticated** user; otherwise shows login-required state.

**Key behaviors:**

- Auth integration:
  - Waits for `authManager` to exist and be initialized.
  - Checks both `getCurrentUser()` and `isAuthenticated()`.
  - If not authenticated, does not attempt Supabase operations and shows “Login Required”.

- Upload flow:
  - Validates each selected file:
    - Size ≤ 100 MB.
    - Won’t exceed current logical storage limit.
  - Uploads to path `${userId}/${Date.now()}_${file.name}` in bucket `user-files`.
  - Shows upload progress UI per file.

- Listing & download:
  - Uses `supabase.storage.from(bucket).list(this.userId)` to enumerate user files.
  - Renders file cards with icons, size, date.
  - Filenames are escaped using `escapeHtml` before being inserted into HTML (good XSS hygiene).
  - Downloads use `download(filePath)`, then create a blob URL and anchor click.

**Security:**

- No obvious XSS: all user-controlled text (filenames) is escaped before rendering.
- Assumes bucket has correct RLS (configured outside this file); code-side usage is per-user path.

**Performance/robustness notes (non-blocking):**

- `calculateStorageUsed()` loops over files and calls `list()` per file to get metadata; this is O(n²) at worst.
  - For a large number of files, this could be slow/unnecessary.
  - Improvement: cache sizes from the initial `list` call or use a custom table that tracks per-user usage.

### 4.2 File Storage Services & Integrations

**`file-storage-service.js` – `FileStorageService`**
- Pure in-memory Maps for `files` and `folders`.
- No DOM injection, no network I/O.
- Used as a logical abstraction / demo; no security concerns.

**`file-storage-integrations.js` – simple integration stub**
- Allows `registerService(serviceName, config)` and `storeFile(serviceName, file, path)`.
- Returns fake URL like `https://{serviceName}.example.com/{path}`.
- No DOM usage; only in-memory maps.

**`file-storage-integrations-dropbox-drive.js` – real provider integration**

- Defines another `FileStorageIntegrations` class (name collision with the stub) that:
  - Maintains provider configs with **access tokens**.
  - Uploads to:
    - Dropbox: `https://content.dropboxapi.com/2/files/upload` with `Authorization: Bearer ${config.accessToken}`.
    - Google Drive: `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`.

**Risks & recommendations:**

- **Class name collision:**
  - Two different `FileStorageIntegrations` classes exist.
  - If both JS files are loaded on the same page, the last one wins, which can cause subtle runtime bugs.
  - Recommendation: rename one (e.g. `FileStorageIntegrationsCore` vs `FileStorageIntegrationsCloud`) or ensure only one is ever loaded.

- **Tokens in frontend:**
  - This design expects long-lived `accessToken`s in frontend config.
  - In production, **never embed long-lived Dropbox/Drive access tokens in frontend code**. Instead:
    - Use short-lived, user-specific tokens obtained via OAuth redirect.
    - Or proxy uploads through your backend where tokens are stored server-side.

- Treat this as **experimental / advanced integration**, not part of the critical security path, unless you add server-side mediation and better token management.

---

## 5. Monitoring & Performance Telemetry

### 5.1 API Request Monitoring (`api-request-monitoring.js`)

- Tracks:
  - Request counts,
  - Total/min/max/average duration,
  - Status code histogram,
  - Errors with timestamps.
- Supports alert rules:
  - `error_rate` – percent of requests with errors.
  - `response_time` – average duration.
  - `request_count` – volume thresholds.
- Triggering only logs to console by default.

**Assessment:**
- Fully client-side, no DOM injection.
- Can be wired into your fetch wrappers safely.
- No identified security risks.

### 5.2 Core Web Vitals Alerts (`core-web-vitals-alerts.js`)

- Listens to `window.coreWebVitalsMonitoring` and periodic snapshots.
- For non-good metrics (LCP, CLS, FID, FCP, TTI, TBT):
  - Shows Web Notification (if permission granted).
  - Shows toast via `window.toastNotificationQueue` when available.
  - Logs to console.
  - Optionally logs to analytics + Supabase table `web_vital_alerts`.
- Supabase insert is guarded by runtime checks and wrapped so that failed promises don’t crash the app.

**Assessment:**
- Designed as **best-effort telemetry**, never blocking.
- Will not break if Supabase or analytics are missing.

---

## 6. Other Feature Modules

### 6.1 VR/AR Planet Viewing (`vr-ar-planet-viewing.js`)

- Uses WebXR to start VR/AR sessions.
- Properly checks `navigator.xr` and support for `immersive-vr` / `immersive-ar`.
- On failure, shows alerts like “WebXR is not supported in this browser”.
- Rendering logic is intentionally placeholder (no untrusted data sources).

**Assessment:**
- No security concerns beyond simple `alert()` usage.
- Future work would be strictly in rendering fidelity and UX.

### 6.2 Push Notifications (`push-notifications.js`)

- Primary mode: Firebase Cloud Messaging (FCM) if `FIREBASE_CONFIG.enabled`.
- Fallback: Plain Web Push API (but explicitly warns that Web Push requires VAPID keys and recommends Firebase instead).
- Stores FCM token in `localStorage` and prints it to console.
- Actual network usage for tokens → backend is commented out; you need to implement your own call if desired.

**Assessment & guidance:**
- Conceptually sound; good separation between Firebase and Web Push.
- When going to production:
  - Remove noisy `console.log` of full tokens.
  - Ensure token is only sent over HTTPS to a trusted backend service.

### 6.3 Marketplace UI Integration (`marketplace-ui-integration.js`)

- Integrates a `window.Marketplace` engine into the UI.
- Renders listing cards and details using `escapeHtml` on:
  - Planet names,
  - Types,
  - Seller names,
  - Descriptions.
- Uses DOM event listeners (not inline `onclick`) for actions.

**Assessment:**
- Correct XSS hygiene for marketplace user content.
- Remaining `alert/confirm` usage for purchase flows is UX-level only.

### 6.4 Shop (`shop.js`)

- Currently one free product (image download), with placeholder for paid products.
- Purchases are tracked in `localStorage` (`purchased_products`).
- Downloads:
  - Try local path via `fetch` and blob download.
  - Fall back to configured external URL (e.g. Google Drive) if local fails.

**Assessment:**
- No untrusted user inputs are injected into DOM.
- All messaging is static.
- Safe as implemented; payment integration is clearly marked as “coming soon”.

### 6.5 Workflow Automation System (`workflow-automation-system.js`)

- Rule engine: **conditions + actions** operating on a `context` object.
- Triggers: `dataChanged`, `userAction`, `timeBased` events.
- Actions include:
  - `sendNotification` via `window.notificationSystem` or `alert`.
  - Database updates via `window.database` if present.
  - Email sending via `window.emailService` if present.
  - Webhooks via `fetch(url, { method, headers, body })`.
  - **`runScript`**: executes arbitrary JS code via `new Function('context', script)`.

**Security posture:**

- As long as the **rule definitions are admin-controlled**, this is a powerful internal tool.
- If untrusted users can define or edit rules:
  - `runScript` becomes an arbitrary code execution vector in the browser.
  - `callWebhook` can be abused for SSRF-like patterns from the client side (hitting internal APIs or spam endpoints as the user’s browser).

**Recommendations:**

- Treat Workflow Automation as an **admin-only, internal feature**.
- Gate rule creation/editing UI behind:
  - Auth + role checks (e.g., `isAdmin` from Supabase user metadata).
  - Optional extra flags or environment-based guards.
- Consider disabling `runScript` entirely in production or limiting to pre-approved script snippets.

---

## 7. Recommended Next Steps (Lead Dev Checklist)

### 7.1 Critical

1. **Fix Secure Chat XSS**:
   - Escape or treat decrypted message text as plain text in `addMessageToUI`.
   - Regression test:
     - Send a message containing `<script>` and `<img ... onerror>` from one account to another.
     - Confirm that the message is displayed literally, and no script/handler runs.

### 7.2 High

2. **Clarify and harden 2FA**:
   - Mark current 2FA UI as **demo/preview** in copy.
   - When ready, move TOTP validation server-side and update flows accordingly.

3. **Review Workflow Automation and integrations access**:
   - Enforce that only admins can define or edit rules.
   - Avoid exposing `runScript` to any non-admin UI.
   - For Dropbox/Drive integrations, shift tokens to backend and use short-lived tokens.

### 7.3 Medium / nice-to-have

4. **Optimize file storage metrics**:
   - Avoid repeated `list()` calls when computing usage; instead rely on initial listing data or a dedicated “usage” table.

5. **Telemetry polish**:
   - Remove or downgrade noisy logs in production (e.g. printing full FCM tokens).
   - Decide which Core Web Vitals alerts feed into analytics vs Supabase tables.

---

## 8. Final Notes

- With the exception of the **Secure Chat XSS** and the intentionally weak 2FA verification, the codebase for these “other systems” shows **good security hygiene and thoughtful architecture**.
- Once the Secure Chat fix and 2FA clarifications are in place, the remaining work is mostly **polish and scaling**, not emergency security work.

This report is intended as a starting point for your next round of security and reliability improvements across these subsystems.
