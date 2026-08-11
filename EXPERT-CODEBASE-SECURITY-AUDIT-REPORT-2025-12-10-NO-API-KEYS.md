# Expert Codebase Security Audit Report (API Key Issues Omitted)

**Project:** Stellar AI / LiveKit / Supabase / Scrapers Monorepo  
**Date:** 2025-12-10  
**Auditor:** Cascade (AI assistant)  

---

## 1. Scope and Methodology

- **Scope**
  - Frontend browser code (auth, secure chat/crypto, 2FA, Supabase integration).
  - Node.js backends (`backend/` servers, `tracker-api/`).
  - Python services (`token_server.py`, Gemini Live helper scripts, Cloud Functions).
  - Cloud Run services (`cloud-run/livekit-agent`, `cloud-run/headless-scraper`).
  - Supabase schema and Row-Level Security (RLS) policies.
  - Dockerfiles and infrastructure behavior.

- **Focus areas (API key exposure explicitly excluded)**
  - Authentication, authorization, and token/room access control.
  - Session and JWT handling.
  - 2FA design and enforcement.
  - Input validation and output encoding (especially in scrapers and chat).
  - Cryptography usage and key management on the client side.
  - RLS and database access control.
  - CORS, logging, error handling, and SSRF.

- **Methodology**
  - Manual review of key files (listed in prior notes) with emphasis on logic and access control rather than secrets.
  - Cross-reference with existing reports:
    - `EXPERT-CODEBASE-SECURITY-AUDIT-REPORT-2025-12-07.md`
    - `EXPERT-HARDENING-AUDIT-2025-12-07.md`

---

## 2. High-Level Architecture

- **Frontend (browser)**
  - Supabase-based authentication (`auth.js`, `supabase-config.js`, `supabase-integration.js`).
  - Secure chat and client-side cryptography (`secure-chat.js`, `secure-crypto.js`).
  - Client-side 2FA demos (`two-factor-auth.js`, `two-factor-authentication.js`).

- **Backend Node.js services (`backend/`)**
  - `server.js`: general API/middleware, music streaming, monitoring, mock endpoints.
  - `auth-server.js`: JSON-file-based user auth with JWT.
  - `stellar-ai-server.js`: core AI backend (file uploads, LiveKit integration, Gemini Live proxy).
  - `planet-server.js`: planet-claiming using JWT and local JSON storage.

- **Python / AI services**
  - `live-api-service.py`, `live-api-python-service.py`: Gemini Live API helper processes.
  - `token_server.py`: Flask LiveKit token server.

- **Cloud Functions (`cloud-functions/`)**
  - `broadband-scraper/main.py` and `price-scraper/main.py`: broadband scrapers using Browserless + Gemini.

- **Cloud Run (`cloud-run/`)**
  - `livekit-agent/`: LiveKit agent running Gemini Live model.
  - `headless-scraper/`: Puppeteer + Gemini scraper.

- **Tracker API (`tracker-api/`)**
  - Express + PostgreSQL API using API key–based authentication (risk analysis of key exposure omitted here).

- **Supabase**
  - `supabase_schema.sql`: tables, RLS policies, triggers.
  - `supabase-config.js`, `supabase-integration.js`: client-side config and high-level integration.

---

## 3. Critical Findings (P0 – Immediate Risk)

### 3.1 Unauthenticated LiveKit Token Minting and Room Access Control

**Files**

- `token_server.py` (Flask LiveKit token server).
- LiveKit-related endpoints in `backend/stellar-ai-server.js` (for real-time features).

**Behavior**

- `token_server.py` exposes `/api/livekit/token` that accepts `roomName` and `participantName` and returns a valid access token.
- CORS is globally enabled for this service.
- There is **no authentication or authorization check** before issuing tokens.

**Risk**

- Anyone with network access to the endpoint can mint tokens for arbitrary rooms and participant identities.
- This enables:
  - Eavesdropping on LiveKit rooms.
  - Impersonation and disruption of sessions.
  - Abuse of media resources.

**Recommendations (Immediate)**

- Require caller authentication (e.g., JWT from your auth system) before issuing any token.
- Enforce strong access control:
  - Only allow tokens for rooms the authenticated user is permitted to join.
  - Limit grants to just what is needed (no admin/host privileges unless necessary).
- Short token lifetimes with refresh mechanisms.
- Restrict CORS to trusted frontends.
- Add structured audit logging for token issuance (user, room, IP, timestamp).

---

### 3.2 Client-Side 2FA Only (No Server Enforcement)

**Files**

- `two-factor-auth.js` (current demo implementation).
- `two-factor-authentication.js` (deprecated, older version).

**Behavior**

- Implements Time-based One-Time Password (TOTP) flows entirely in the browser.
- Generates and verifies TOTP codes on the client side.
- Stores and manages some 2FA state through Supabase but does **not** perform secure, server-side verification of codes.

**Risk**

- 2FA is not enforced at a trust boundary.
- An attacker can bypass 2FA by:
  - Disabling or modifying client-side code.
  - Calling backend APIs directly without ever passing through the 2FA UI.
- Users may believe they have strong 2FA when in fact the protection is cosmetic.

**Recommendations (Immediate)**

- Clearly label current 2FA as **demo-only** in the UI.
- Implement a server-side 2FA flow:
  - Store TOTP secrets securely on the server or via Supabase Edge Functions.
  - Verify TOTP codes server-side before issuing or honoring sessions/JWTs.
  - Enforce 2FA as part of login and sensitive operations.
- Consider disabling or hiding client-only 2FA in production until proper enforcement is in place.

---

### 3.3 Supabase RLS Policy Weakness on `trade_offers`

**File**

- `supabase_schema.sql`.

**Behavior**

- `trade_offers` table has RLS enabled.
- At least one policy allows updates to rows where `status = 'open'` without tying that to the authenticated user.

**Risk**

- Any authenticated user can update **any open offer**, regardless of whether they created it.
- Enables:
  - Hijacking other users’ offers.
  - Arbitrary modification of offer details.

**Recommendations (Immediate)**

- Replace the generic `status = 'open'` condition with user-aware checks:
  - Example: `auth.uid() = seller_id` (or equivalent ownership field).
- Design separate policies for:
  - Creation (seller only).
  - Update/cancel (seller and/or designated counterparties only).
  - Read access (broader audience if appropriate).

---

### 3.4 Potential SSRF and Uncontrolled Navigation in Scrapers

**Files**

- `cloud-functions/broadband-scraper/main.py`.
- `cloud-functions/price-scraper/main.py`.
- `cloud-run/headless-scraper/index.js` (Puppeteer backend).

**Behavior**

- These components fetch and render broadband provider pages (via Browserless/Puppeteer) and then use AI or regex to extract pricing data.
- Depending on how URLs are passed in (provider selection vs raw URL), there is potential for user input to control scraping targets.

**Risk**

- If an attacker can influence target URLs directly, they may be able to:
  - Perform Server-Side Request Forgery (SSRF) to internal resources.
  - Access metadata endpoints or internal admin panels.
  - Use headless browsers to execute scripts against internal systems.

**Recommendations (Immediate)**

- Enforce strict allow-lists for target domains:
  - Only scrape explicitly enumerated broadband provider hosts.
  - Reject any unrecognized domains.
- Normalize and validate URLs:
  - Require HTTPS.
  - Strip or tightly validate query parameters.
- Where possible, restrict outbound network access from these functions/services to known provider IP ranges or domains.

---

## 4. High/Medium Findings (P1–P2)

### 4.1 Weak Default JWT Signing Configuration

**Files**

- `backend/auth-server.js`.
- `backend/planet-server.js`.

**Behavior**

- Both servers use `JWT_SECRET` (or equivalent) for signing tokens.
- There are hardcoded **default** values used when environment variables are missing (intended for development).

**Risk**

- If deployed without proper configuration, these defaults make it easy for an attacker to forge or tamper with JWTs.
- Even though this is primarily a configuration risk, it is easy to misconfigure in practice.

**Recommendations**

- Fail fast in non-development environments when `JWT_SECRET` is not explicitly configured.
- Use strong, random values for signing secrets.
- Clearly separate dev/test and production configurations.

---

### 4.2 CORS Configuration Risks

**Files**

- `token_server.py` (global CORS via `flask-cors`).
- `backend/server.js` (CORS handling for main backend).
- `tracker-api/index.js` (CORS for tracker API).

**Behavior**

- In development, CORS tends to be open or loosely configured.
- In production, `backend/server.js` uses a curated allow-list, but misconfigurations remain possible.

**Risk**

- Overly permissive CORS rules can let arbitrary websites call sensitive APIs from a user’s browser context.

**Recommendations**

- Maintain per-environment CORS allow-lists with explicit origins.
- Avoid wildcard `*` in production for routes that accept credentials or sensitive operations.
- Centralize and document CORS configuration so it is easy to audit.

---

### 4.3 Logging and Error Handling

**Files**

- `backend/error-handler.js`.
- `backend/gemini-live-proxy.js`.
- `backend/gemini-live-direct-websocket.js`.
- `backend/google-cloud-backend.js`.
- `live-api-service.py`, `live-api-python-service.py`.

**Findings**

- Logging and retry logic are generally robust and detailed.
- There is a risk that verbose logs may include sensitive user data or identifiers.

**Recommendations**

- Introduce log levels and structured logging.
- Ensure that sensitive user data and tokens are redacted before logging.
- Add monitoring/alerting on recurring 5xx errors, connection failures, and auth failures.

---

### 4.4 Client-Side Cryptography and Secure Chat

**Files**

- `secure-crypto.js` (Web Crypto utility).
- `secure-chat.js` (chat application logic).

**Strengths**

- Uses modern algorithms: RSA-OAEP, AES-GCM, PBKDF2.
- Implements hybrid encryption for messages.
- Encrypts private keys with password-derived keys and stores only encrypted blobs.
- Uses `createTextNode` and sanitized avatar URLs for message display, significantly mitigating XSS.

**Risks / Gaps**

- Usability and recovery:
  - If users lose their passphrase, they likely lose access to their messages.
- Decrypted private keys exist in memory during active sessions; care must be taken not to persist them accidentally.

**Recommendations**

- Document the end-to-end encryption model clearly (what is and is not protected).
- Consider optional, opt-in recovery mechanisms if acceptable to your threat model.
- Periodically review the Web Crypto usage against current best practices and browser behavior.

---

## 5. Infrastructure & Docker Security (Non-Secret Aspects)

**Files**

- Root `Dockerfile`.
- `backend/Dockerfile`.
- `cloud-run/livekit-agent/Dockerfile`.
- `cloud-run/headless-scraper/Dockerfile`.
- `tracker-api/Dockerfile`.

**Strengths**

- Use of non-root users in multiple Dockerfiles (`agentuser`, `pptruser`, etc.).
- `tracker-api` uses a multi-stage build and sets `NODE_ENV=production`.

**Risks / Opportunities**

- Some images may include extra tooling or dependencies not needed at runtime.
- Container filesystem permissions should be reviewed to ensure least privilege.

**Recommendations**

- Prefer minimal base images (alpine/distroless) when compatible.
- Remove build-time tooling from final images where possible.
- Verify file permissions inside containers, especially for configuration files.

---

## 6. Supabase Schema & Access Control (Non-Secret Aspects)

**File**

- `supabase_schema.sql`.

**Strengths**

- RLS is enabled on core tables (`profiles`, `game_saves`, `leaderboards`, `trade_offers`).
- Most policies correctly scope access to `auth.uid()`.
- `handle_new_user` trigger automatically creates profiles.

**Primary Issue**

- `trade_offers` policy that allows updates to any row with `status = 'open'` (see §3.3).

**Recommendations**

- Tighten `trade_offers` policies to enforce ownership.
- Periodically run Supabase’s security advisor and apply suggested improvements.

---

## 7. Dependency & Supply Chain Considerations

**Files**

- `backend/package.json`, `backend/requirements.txt`, root `requirements.txt`, `tracker-api/package.json` (if present), etc.

**Findings**

- Uses widely adopted libraries such as `express`, `bcryptjs`, `jsonwebtoken`, `multer`, `ws`, `livekit-server-sdk`, and `google-genai`.

**Recommendations**

- Integrate dependency and vulnerability scanning (e.g., `npm audit`, `pip-audit`, or SCA tools) into CI.
- Regularly update and test dependencies, especially those related to authentication and cryptography.
- Review changelogs for breaking security changes.

---

## 8. Prioritized Remediation Roadmap (API Key Exposure Excluded)

### Phase 0 – Immediate (Same Day)

- Lock down LiveKit token issuance with proper authentication and authorization.
- Fix Supabase `trade_offers` RLS to enforce ownership.
- Add strict allow-lists and validation for all scraper targets to mitigate SSRF.

### Phase 1 – Short Term (1–2 Weeks)

- Implement server-side 2FA with TOTP verification at a trusted boundary.
- Harden CORS configurations across all services.
- Improve JWT signing configuration (strong secrets, fail-fast behavior in production).

### Phase 2 – Medium Term (2–6 Weeks)

- Harden Docker images (minimal bases, least privilege, reduced tooling).
- Enhance logging hygiene and observability with redaction and alerts.
- Periodically review client-side cryptography model and UX.

### Phase 3 – Ongoing

- Maintain dependency scanning and regular updates.
- Run periodic security reviews of RLS policies and backend access control.
- Refine internal secure coding guidelines based on these findings.

---

## 9. Conclusion

This variant of the audit focuses on **logic, access control, cryptography, and infrastructure** while intentionally **excluding API key exposure issues**.

The most pressing concerns center on:

- Unauthenticated or weakly controlled LiveKit token issuance.
- Client-side-only 2FA that does not enforce security at the server.
- A permissive Supabase RLS policy on `trade_offers`.
- Potential SSRF and uncontrolled navigation in headless scrapers.

Addressing these areas—especially LiveKit token access control, RLS fixes, robust 2FA, and SSRF hardening—will substantially strengthen the security posture of this codebase, independent of how API keys and other secrets are managed.
