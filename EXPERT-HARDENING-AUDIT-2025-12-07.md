# Expert Hardening Audit – What to Fix Next

**Date:** 2025-12-07  
**Scope:** Entire frontend codebase (JS/HTML) + selected Supabase schema / integrations  
**Goal:** Merge all prior audit findings into a single, prioritized expert-level hardening plan focused on **what to fix next**.

This document assumes the earlier audits have already been read:

- `FEATURE-MODULES-AUDIT-2025-12-07.md`
- `OTHER-SYSTEMS-AUDIT-2025-12-07.md`
- `GLOBAL-SWEEP-AUDIT-2025-12-07.md`
- `OTHER-SYSTEMS-VERIFICATION-2025-12-07.md`
- `ADVANCED-AUDIT-VERIFICATION-2025-12-07.md`
- `NEXT-STEPS-TODO-2025-12-07.md`

It focuses on **actionable fixes** and **design-level improvements** that move the system closer to production-grade security.

---

## 1. Highest-Priority Fixes (Critical / High)

These are the **must-fix** items before treating the system as secure for untrusted users.

### 1.1 Secure Chat – XSS & Cryptographic Hardening

**Files:**
- `secure-chat.js`
- `secure-chat.html`
- `SUPABASE-SECURE-CHAT-SETUP.sql`

**Current issues (summary):**
- **XSS:** Decrypted message content is rendered with `innerHTML` without robust escaping. A malicious sender could inject HTML/JS into the recipient’s chat window.
- **Crypto design (high-level):**
  - Encryption appears to be handled on the client; keys and ciphertext are stored in Supabase.
  - Need stronger guarantees around key generation, storage, and destruction (per-conversation keys, forward secrecy, IV/nonce uniqueness, etc.).
  - Metadata (sender/receiver/timestamps) is visible to Supabase and potentially correlatable.

**What to fix next:**

- **1.1.1 Eliminate XSS in decrypted message rendering (Critical)**
  - Replace any `innerHTML` usage for decrypted messages with either:
    - `textContent` on a created element, or
    - a safe escaping helper (e.g. `escapeHTML`) before inserting.
  - Ensure **all** user-controlled text in chat (messages, display names, optional attachments metadata) flows through escaping before DOM insertion.

- **1.1.2 Clarify and harden key management (High)**
  - Move toward **per-conversation** or **per-session** keys, not a single long-lived key per user.
  - Ensure keys are stored only in memory or in a secure keystore where possible; avoid long-term, unencrypted storage in localStorage.
  - Document clearly:
    - Key generation mechanism (CSPRNG, length, algorithm).
    - IV/nonce policy (unique per message, never reused with the same key).
    - How keys are rotated and destroyed (on logout, on device change, etc.).

- **1.1.3 Strengthen Supabase schema and RLS (High)**
  - Validate that message metadata tables enforce:
    - `sender_id`/`receiver_id` checks tied to `auth.uid()`.
    - No cross-tenant leakage (only sender or receiver can read a message row).
  - Add explicit **unit tests** or simple SQL assertions for RLS:
    - “User A cannot read messages where neither sender nor receiver is A.”

- **1.1.4 Threat model documentation (Medium/High)**
  - Document clearly:
    - What Supabase can see (metadata, ciphertext sizes, timing).
    - What is protected (message plaintext) and under which attacker assumptions (honest-but-curious backend, compromised client, etc.).
  - Use this as the baseline to discuss future enhancements (e.g., deniable messaging, forward secrecy, multi-device key sync).

---

### 1.2 CSV/Excel Import Preview – Escape Untrusted Cells

**File:** `data-import-csv-excel-mapping.js`

**Issue:**
- CSV/Excel **headers** and **cell values** from user-uploaded files are rendered into a preview table using `innerHTML` with no escaping.
- This is a classic XSS vector: a malicious spreadsheet can contain `<img onerror=...>`, `<script>`, or event handler attributes.

**What to fix next:**

- Introduce a small, centralized `escapeHtml` helper (or reuse an existing one) and ensure **all** untrusted CSV/Excel content is escaped before DOM insertion.
- Preferably, build the preview table via DOM APIs:
  - `document.createElement('tr')`, `document.createElement('td')`;
  - Set `textContent` for headers and cells instead of building HTML strings.
- Add a short section in developer docs: “**CSV/Excel content is untrusted HTML – always escape or use textContent.**”

---

### 1.3 Planet Photo Gallery – Escape Descriptions

**Files:**
- `planet-photo-gallery.js`
- `public/planet-photo-gallery.js` (if present)

**Issue:**
- `photo.description` is entered by users via `prompt()` and interpolated **directly** into HTML via `innerHTML`.
- This allows a user to inject arbitrary HTML/JS whenever a description is rendered.

**What to fix next:**

- Escape `photo.description` everywhere it is rendered, using either:
  - `textContent` on created elements, or
  - a shared `escapeHTML` helper.
- Defensively also escape `photo.planetName` when used in HTML, even if currently constrained to known planet labels.
- Consider adding **length limits** and optional moderation hooks for descriptions.

---

### 1.4 Dynamic Code Execution – Gate as Admin-Only

**Files:**
- `feature-store-ml.js`
- `public/custom-metric-calculation-builder.js`
- `public/offline-first-system.js`
- `workflow-automation-system.js`

**Issue:**
- These modules either already support, or are designed to support, dynamic code execution (e.g. custom metric formulas, workflow actions like `runScript`).
- If exposed to regular users, they can easily become remote code execution/XSS vectors.

**What to fix next:**

- Ensure **only admin or trusted roles** can access:
  - UI surfaces for writing formulas or scripts.
  - APIs or persistence paths that store these rules.
- Enforce gating at **multiple layers**:
  - Frontend: hide/disable UI for non-admins.
  - Backend (Supabase): ensure tables that store script-like content have RLS that restricts reads/writes to admin users.
- Consider sandboxing or constraining the expression language:
  - Prefer a safe expression evaluator over `eval`/`new Function`.
  - Whitelist operations (e.g. arithmetic, safe math functions) and deny access to global objects (`window`, `document`).

---

### 1.5 Export-to-PDF / Printable Views – Escape Data in Generated HTML

**File:** `export-multi-format.js`

**Issue:**
- `exportPDF` uses `document.write` to create a new window and inject HTML generated from `formatDataForPrint`.
- `formatDataForPrint` interpolates data directly into `<td>` elements without explicit escaping.
- If any exported field can hold user-controlled text, this becomes a cross-window XSS vector.

**What to fix next:**

- Introduce HTML escaping in `formatDataForPrint` for **all** dynamic values.
- Better: build a safe serialized representation of the table and use `textContent` when constructing it, then stringify.
- Avoid `document.write` if possible; consider using a static printable template and populating via safe DOM APIs.

---

## 2. Important Medium-Priority Fixes

These are **strongly recommended** for a robust, production-like posture, but are slightly less urgent than the critical surface areas above.

### 2.1 Two-Factor Authentication – Move to Server-Side Verification

**Files:**
- `two-factor-auth.js`
- `two-factor-authentication.js`

**Issue:**
- 2FA implementation is **frontend-only** – TOTP secrets and verification live in the client.
- This is suitable for a demo but not for real account security: a user (or attacker) can bypass or tamper with verification logic.

**What to fix next:**

- Move TOTP secret generation and verification to the **backend**:
  - Secrets stored server-side, associated with `auth.uid()`.
  - Codes verified via a secure API endpoint with rate limiting.
- Keep the frontend limited to:
  - Displaying QR codes or manual setup keys.
  - Submitting codes to the server for verification.
- Implement **backup codes** as random, high-entropy tokens stored hashed on the server.

---

### 2.2 Third-Party Integrations & API Keys (Dropbox, Google Drive, FCM)

**Files:**
- `file-storage-integrations-dropbox-drive.js`
- `push-notifications.js`

**Issue:**
- Some integrations appear to rely on **frontend tokens/API keys**, which can be viewed by anyone with browser access.
- This is acceptable for some public keys (e.g. certain Firebase config) but dangerous for tokens that grant access to user files or messaging infrastructure.

**What to fix next:**

- Move sensitive OAuth flows to the **backend**:
  - Frontend requests uploads/downloads via your server.
  - Server holds the sensitive refresh/access tokens and exchanges them as needed.
- Where a key **must** be on the frontend (e.g., Firebase public config), document:
  - The exact privileges of that key.
  - Rate limiting and abuse detection you rely on.
- For FCM:
  - Ensure no server keys or privileged credentials are shipped to the browser.
  - Tokens used to identify devices should be treated as sensitive (e.g., avoid logging them in production).

---

### 2.3 Template System & Analytics Labels – Future-Proof Escaping

**Files:**
- `template-system.js`
- `analytics-dashboard.js`

**Current state:**
- Template names/categories and analytics labels currently come from **trusted configs/datasets**.
- Rendering uses `innerHTML` for some list/card layouts without escaping.

**Risk:**
- If you later allow **user-defined** templates or arbitrary metric labels, these become XSS vectors.

**What to fix next (or at least plan for):**

- Before introducing user-defined template metadata or labels, ensure:
  - All such fields are escaped via a shared `escapeHTML` helper.
  - Or the rendering paths use DOM creation + `textContent`.
- Add a short comment or doc note in these modules: “If names/labels become user-editable, escape before rendering.”

---

## 3. LocalStorage, Backups, and Data Lifecycle

**Files:**
- `user-data-export-import.js`
- `backup-restore-system.js`
- Various feature modules using `localStorage` (bookmarks, wishlist, comments, messages, claims, etc.).

**Observations:**
- LocalStorage is used heavily to cache or persist user data and preferences.
- Backups and user data exports are JSON-based and generally safe – they do not directly render HTML.
- Risk arises when **other modules** render text from these stores without escaping.

**What to fix/clarify next:**

- Maintain a **central registry** of storage keys and their semantics (already partly in TODO docs):
  - For each key, specify: “Contains HTML?”, “Contains user-entered text?”, “Must be escaped when rendered?”.
- Enforce a rule: **Any module rendering text from localStorage must escape it or use `textContent`.**
- For backups and import:
  - Clearly document that imported text is treated as untrusted and must go through existing escaping paths when rendered.
  - Consider optional encryption of sensitive backup categories.

---

## 4. Authentication, Sessions, and Supabase RLS

**Files:**
- `auth-supabase.js`
- `supabase-config.js`
- Supabase SQL (RLS policies, `profiles`, secure chat tables, etc.).

**Current state:**
- Auth integration and RLS setup are generally robust.
- Some notes from audits around minor robustness (e.g., defensive checks on `getUser()` calls).

**What to fix or tighten next:**

- Add **small guardrails** in `auth-supabase.js`:
  - Fail fast with clear errors when `supabase.auth.getUser()` returns null.
  - Normalize usage patterns so every feature that requires auth:
    - Verifies the user is logged in.
    - Fails gracefully with a consistent error/UI path.
- For RLS:
  - Add simple tests (SQL or script-based) that assert key invariants (e.g., “no user can read another user’s private rows”).
  - Document the core RLS model in a short section: which tables are per-user, per-conversation, or global.

---

## 5. Content Moderation, Consent, and UI Safety

**Files:**
- `content-moderation-system.js`
- `consent-management-system.js`
- `community-ui.js`
- `messaging.js` / `messaging.html`

**Current state:**
- Moderation logic is logical-only (no direct DOM injection), so low risk.
- Consent banner uses static HTML, safe as written.
- Community UI and messaging both include dedicated escaping helpers for user-generated content and appear robust against XSS.

**What to keep doing / plan next:**

- Consolidate escaping helpers (`escapeHTML`, `escapeHtml`) into a **single, well-tested utility** used across modules.
- If moderation rules ever become **user-defined**, review them for potential ReDoS (regex) or logic abuse.
- Consider logging moderation outcomes to Supabase for auditability (with privacy in mind).

---

## 6. Dashboard Widgets, Visualizations, and Database Views

**Files:**
- `dashboard-widgets.js`
- `database-visualization-features.js`
- `database-advanced-features.js`
- `database-optimized.js`
- `analytics-dashboard.js`

**Current state:**
- These modules interpolate data primarily from **trusted datasets** (Kepler planets, internal stats, Supabase aggregates).
- Some use `innerHTML` and inline `onclick` handlers but only with trusted values.

**What to fix or improve next:**

- For future safety, standardize on:
  - DOM APIs + `textContent` for text.
  - Event listeners instead of inline `onclick` where feasible.
- Where planet or label names could become user-generated, plug into the central escaping utility.
- Add focused tests around:
  - Pagination and filters in `database-optimized.js`.
  - AI description caching behavior and size limits.
  - Planet availability logic when claims/bookmarks/wishlists are combined.

---

## 7. Central Coding Guidelines (Security)

To avoid repeating mistakes and to keep future features safe, adopt these **house rules**:

1. **DOM Insertion:**
   - Default to **DOM creation + `textContent`**.
   - Use `innerHTML` only for static templates or with pre-escaped data.

2. **Escaping:**
   - Centralize `escapeHTML` in a shared utility.
   - Mandate escaping for all user-generated or imported text before rendering.

3. **Dynamic Code:**
   - Forbid `eval`, `new Function`, or arbitrary script execution in user-facing contexts.
   - If a rules/expressions system is needed, use a constrained expression language with a whitelist.

4. **Storage:**
   - Treat all `localStorage` content as **untrusted** when rendering.
   - Avoid storing long-lived secrets or tokens in localStorage.

5. **Auth & Roles:**
   - Any feature that can affect other users (chat, dynamic scripts, admin dashboards) must:
     - Check authentication.
     - Respect roles (admin vs regular user) in both frontend and backend.

6. **Logging & Monitoring:**
   - Log security-relevant events (failed logins, 2FA setup/disable, admin changes to dynamic rules) to a secure backend store.

---

## 8. Recommended Implementation Order

To convert this into an implementation plan, tackle items in this order:

1. **Fix XSS and escaping issues:**
   - Secure chat message rendering.
   - CSV/Excel preview.
   - Planet photo gallery descriptions.
   - Export-to-PDF HTML generation.

2. **Lock down dynamic code paths:**
   - Gate dynamic rules/metrics/automation as admin-only.
   - Introduce or tighten sandboxing/whitelisting.

3. **Upgrade 2FA and auth robustness:**
   - Move TOTP verification server-side.
   - Harden `auth-supabase.js` flows and error handling.

4. **Secure third-party integrations:**
   - Move sensitive tokens/flows to the backend.

5. **Unify escaping and documentation:**
   - Central `escapeHTML` utility.
   - Short security guidelines doc for contributors.

6. **Longer-term design improvements:**
   - Crypto/key lifecycle improvements for secure chat.
   - Data lifecycle and backup encryption strategy.

This report should be read alongside `NEXT-STEPS-TODO-2025-12-07.md`, which already contains concrete checklist items mapped to specific files. Here, the focus is on **why** these fixes matter and how to approach them at an expert level.
