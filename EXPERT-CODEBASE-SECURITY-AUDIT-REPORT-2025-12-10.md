# Expert Codebase Security Audit Report

**Project:** Stellar AI / LiveKit / Supabase / Scrapers Monorepo  
**Date:** 2025-12-10  
**Auditor:** Cascade (AI assistant)  

---

## 1. Scope and Methodology

- **Scope**
  - Frontend browser code (auth, secure chat/crypto, 2FA, Supabase integration)
  - Node.js backends (`backend/` servers, `tracker-api/`)
  - Python services (`token_server.py`, Gemini Live helper scripts, Cloud Functions)
  - Cloud Run services (`cloud-run/livekit-agent`, `cloud-run/headless-scraper`)
  - Supabase schema and RLS policies
  - Dockerfiles and environment/secret handling
- **Out of scope (by design)**
  - Live production secrets and runtime infra (only static repo contents audited)
  - External dependencies’ internal implementations (treated via manifest review)

**Methodology**

- Manual, line-by-line review of key files listed in the audit notes.
- Focus on:
  - Secrets management and environment usage
  - Authentication, authorization, and session/token handling
  - Input validation and output encoding
  - Cryptography correctness and key handling
  - Logging, error handling, and observability
  - Infrastructure (Docker, Cloud Run, Cloud Functions) and SSRF risks
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
  - `stellar-ai-server.js`: core AI backend (file uploads, LiveKit token issuing, Gemini Live proxy).
  - `planet-server.js`: planet-claiming using JWT and local JSON storage.

- **Python / AI services**
  - `live-api-service.py`, `live-api-python-service.py`: Gemini Live API helper processes.
  - `token_server.py`: Flask LiveKit token server.

- **Cloud Functions (`cloud-functions/`)**
  - `broadband-scraper/main.py` and `price-scraper/main.py`: broadband scrapers using Browserless + Gemini.

- **Cloud Run (`cloud-run/`)**
  - `livekit-agent/`: LiveKit agent running Gemini Live model, with its own Dockerfile.
  - `headless-scraper/`: Puppeteer + Gemini scraper, with Dockerfile.

- **Tracker API (`tracker-api/`)**
  - Express + PostgreSQL API using API key authentication.

- **Supabase**
  - `supabase_schema.sql`: tables, RLS policies, triggers.
  - `supabase-config.js`, `supabase-integration.js`: client-side config and high-level integration.

---

## 3. Critical Findings (P0 – Immediate Risk)

### 3.1 Hardcoded Secrets and Keys in Source

**Files / Examples**

- Root `.env` and `backend/.env` contain committed values like:
  - `GEMINI_API_KEY=...`
  - `https://sepesbfytkmbgjyfqriw.supabase.co` and related keys.
- `token_server.py`:
  - `LIVEKIT_API_KEY = os.environ.get("LIVEKIT_API_KEY", "API2L4oYScFxfvr")`
  - `LIVEKIT_API_SECRET = os.environ.get("LIVEKIT_API_SECRET", "vgdeTSniXEACMV4tLePmPEGw48HIEPL8xsxDKKlwJ8U")`
- `backend/stellar-ai-server.js` LiveKit token endpoint:
  - Hardcoded default `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET` if env vars missing.
- `cloud-functions/broadband-scraper/main.py` and `cloud-functions/price-scraper/main.py`:
  - Fallbacks that embed `GEMINI_API_KEY` directly when env var is absent.
- `cloud-run/livekit-agent/livekit_agent.py` + Dockerfile:
  - Python script uses a default `GOOGLE_API_KEY` if env missing.
  - Dockerfile sets `ENV GOOGLE_API_KEY=...` (bakes the key in the image).
- `cloud-run/headless-scraper/index.js`:
  - Default `GEMINI_API_KEY` in code when env missing.

**Risk**

- If this repo or built images are exposed, all listed secrets are effectively **compromised**.
- Attackers can:
  - Abuse Gemini / Google APIs for free compute.
  - Mint arbitrary LiveKit tokens (impersonation / conference takeover).
  - Access Supabase project if service-level keys are present elsewhere.

**Recommendations (Immediate)**

- **Rotate all exposed secrets**:
  - Gemini / Google API keys.
  - LiveKit API keys and secrets.
  - Any Supabase service keys, if ever committed.
- **Remove defaults that embed real keys**:
  - Replace default literals with `None`/error conditions.
  - Fail fast if required env vars are missing, instead of falling back to demo keys.
- **Use secret managers**:
  - For Cloud Run / Cloud Functions, use Google Secret Manager or environment configuration, never Dockerfile `ENV` for sensitive values.
- **Scan history**:
  - Use git secret scanning tools to identify all historical leaks, invalidate/rotate all of them.

---

### 3.2 Unauthenticated Token Minting (LiveKit)

**Files**

- `token_server.py` (Flask):
  - `/api/livekit/token` endpoint issues room-join tokens based on caller-provided `roomName` and `participantName`.
  - CORS is wide open (`flask-cors` applied globally).
  - No authentication or authorization; any caller can mint tokens for any room.
- `backend/stellar-ai-server.js` LiveKit integration appears to use similar semantics with default keys.

**Risk**

- Anyone who discovers the token endpoint can:
  - Generate valid LiveKit tokens for arbitrary rooms.
  - Eavesdrop on calls, impersonate participants, or disrupt conferences.

**Recommendations (Immediate)**

- **Require authentication**:
  - Restrict token minting to authenticated users (JWT, session, or API gateway).
  - Enforce access control: only allow tokens for rooms the user is authorized to join.
- **Constrain grants**:
  - Scope tokens to specific room, limited permissions (no admin unless necessary).
  - Add short expiry and refresh mechanisms.
- **Tighten CORS**:
  - Restrict allowed origins to trusted frontends.
- **Audit logs**:
  - Log token issuance with user identity, room, and IP for forensics.

---

### 3.3 Client-Side 2FA (TOTP) Without Server Verification

**Files**

- `two-factor-auth.js`:
  - Explicitly described as a **client-side demo**.
  - Generates TOTP secrets, backup codes, and validates codes entirely in the browser.
  - Stores state in Supabase but does **not** implement secure, server-side verification.
- `two-factor-authentication.js`:
  - Marked as **DEPRECATED** but still present.
  - Similar client-side verification logic.

**Risk**

- 2FA is effectively **cosmetic**:
  - A determined attacker can bypass/disable client JS and still authenticate.
  - Users may have a false sense of security.

**Recommendations (Immediate)**

- **Label clearly in UI**: “Demo only, not real 2FA security.”
- **Server-side enforcement** (short term):
  - Implement TOTP secret storage and verification via Supabase Edge Functions or a backend service.
  - Enforce 2FA completion before issuing or honoring session tokens.
- **Consider disabling the feature** in production until server-side 2FA is implemented.

---

### 3.4 Supabase RLS Policy Weakness (Trade Offers)

**File**

- `supabase_schema.sql`:
  - `trade_offers` table with RLS enabled.
  - Policy allowing updates where `status = 'open'`.

**Risk**

- Any authenticated user can update **any open trade offer**, regardless of ownership.
- This enables:
  - Hijacking others’ offers.
  - Market manipulation.

**Recommendations (Immediate)**

- Replace `status = 'open'` policy with ownership-based checks:
  - Example: `auth.uid() = seller_id` (and/or allowed counterparty fields).
- Add separate policies for:
  - Creating offers (seller only).
  - Updating/canceling offers (seller or authorized roles only).

---

### 3.5 SSRF Risk in Scrapers (Browserless, Puppeteer, Cloud Functions)

**Files**

- `cloud-functions/broadband-scraper/main.py` and `price-scraper/main.py`.
- `cloud-run/headless-scraper/index.js` (Puppeteer-based scraper).

**Risk**

- If any of these endpoints accept **arbitrary URLs** from client input (directly or indirectly), then:
  - Attackers can perform SSRF:
    - Access internal HTTP endpoints (metadata server, internal admin panels).
    - Reach services on private networks.
  - Puppeteer/Browserless will follow redirects and load arbitrary content.

**Recommendations (Immediate)**

- **Strict allow-lists**:
  - Only allow known broadband provider domains (hard-coded list).
  - Reject any URL not matching expected hostnames and HTTPS.
- **Network-level egress control**:
  - For Cloud Run / Cloud Functions, configure VPC / firewall rules to prevent access to sensitive metadata endpoints (e.g., 169.254.169.254).
- **Sanitize and normalize URLs**:
  - Enforce HTTPS, validate host, and strip query params if not needed.

---

## 4. High/Medium Findings (P1–P2)

### 4.1 JWT Secrets with Insecure Defaults

**Files**

- `backend/auth-server.js`:
  - `JWT_SECRET` defaults to `'your-secret-key-change-in-production'` if env not set.
- `backend/planet-server.js`:
  - Similar default for `JWT_SECRET`.

**Risk**

- If deployed without correct env configuration, all JWTs are trivially forgeable.

**Recommendations**

- **Fail fast**:
  - If `process.env.JWT_SECRET` is missing, refuse to start in non-dev modes.
- **Use strong, rotated secrets** stored in secret manager or environment configuration only.

---

### 4.2 CORS Configurations Too Permissive

**Files**

- `token_server.py`: global CORS with `flask-cors`.
- `backend/server.js`: dev mode often effectively allows all origins; prod uses `allowedOrigins` list.
- `tracker-api/index.js`: CORS allows selected origins but may grow ad hoc.

**Risk**

- Overly broad CORS can let arbitrary websites interact with sensitive APIs using the user’s browser context.

**Recommendations**

- Maintain **strict, declarative allow-lists** per environment.
- Separate **dev** and **prod** CORS configs; avoid wildcard `*` in production.

---

### 4.3 Logging and Error Handling

**Files**

- `backend/error-handler.js`, `backend/gemini-live-proxy.js`, `backend/gemini-live-direct-websocket.js`, `live-api-*.py` scripts.

**Findings**

- Logging is generally extensive and helpful for debugging.
- Potential risk of **over-logging sensitive data** (e.g., keys, tokens, user input) if debug logs are enabled in production.

**Recommendations**

- Review all logging statements to ensure **no secrets or PII** are logged.
- Introduce log levels and scrubbers:
  - Mask tokens, API keys, auth headers, and user secrets.

---

### 4.4 Client-Side Cryptography: Key Management & UX

**Files**

- `secure-crypto.js`: Web Crypto API utilities (RSA-OAEP, AES-GCM, PBKDF2).
- `secure-chat.js`: Uses `SecureCryptoManager` for hybrid encryption of messages.

**Strengths**

- Uses modern primitives: RSA-OAEP, AES-GCM, PBKDF2.
- Encrypts private keys with password-derived keys; uses Supabase Storage for encrypted blobs.
- Uses `createTextNode` and sanitizes avatar URLs for primary message content (mitigates XSS).

**Risks / Gaps**

- Key recovery and password reset are tricky; users may lose access if they forget passphrases.
- Any plaintext usage of decrypted private keys must be carefully scoped and not persisted.

**Recommendations**

- Document the **threat model** clearly in UI and docs (end-to-end encryption vs. server-assisted).
- Consider optional **server-side secure backup** mechanisms if acceptable.
- Periodically review Web Crypto usage for parameter correctness and browser compatibility.

---

### 4.5 Tracker API Authentication Model

**File**

- `tracker-api/index.js`.

**Findings**

- Uses a shared `TRACKER_API_KEY` (Bearer token) for all clients.
- Good for simple single-tenant deployments.

**Risks**

- If the API key leaks, any holder can read/update all device data.
- No per-device or per-user auth; coarse-grained access control.

**Recommendations**

- For multi-tenant or production-grade use:
  - Integrate with a real auth system (JWT, OAuth, or Supabase auth).
  - Bind devices to user accounts; enforce per-user access policies.

---

## 5. Infrastructure & Docker Security

### 5.1 Dockerfiles

**Files**

- Root `Dockerfile` (Flask LiveKit token server).
- `backend/Dockerfile` (Node.js + Python backend).
- `cloud-run/livekit-agent/Dockerfile`.
- `cloud-run/headless-scraper/Dockerfile`.
- `tracker-api/Dockerfile`.

**Strengths**

- Most images create non-root users (`agentuser`, `pptruser`, etc.) and drop privileges.
- `tracker-api` uses multi-stage build and sets `NODE_ENV=production`.

**Risks / Gaps**

- `cloud-run/livekit-agent/Dockerfile` hardcodes `GOOGLE_API_KEY` as `ENV`.
- Some images may include dev tooling or unused packages, increasing attack surface.

**Recommendations**

- **Remove secrets from Dockerfiles**; rely on runtime env vars or Secret Manager.
- Use **minimal base images** (alpine/distroless) where compatible.
- Ensure file permissions prevent world-readable secrets inside containers.

---

## 6. Supabase Schema & Access Control

**File**

- `supabase_schema.sql`.

**Strengths**

- RLS enabled on:
  - `profiles`, `game_saves`, `leaderboards`, `trade_offers`.
- Policies generally scoped to `auth.uid()`, which is good.
- `handle_new_user` trigger auto-creates profiles.

**Main Issue**

- `trade_offers` RLS policy allowing update of any row where `status = 'open'`.

**Recommendations**

- Tighten RLS for `trade_offers` as described in §3.4.
- Regularly run Supabase security advisors and apply suggestions.

---

## 7. Dependency & Supply Chain Considerations

**Files**

- `backend/package.json`, `backend/requirements.txt`, root `requirements.txt`, `tracker-api/package.json` (if present), etc.

**Findings**

- Uses common, widely deployed libraries: `express`, `bcryptjs`, `jsonwebtoken`, `multer`, `ws`, `livekit-server-sdk`, `google-genai`, etc.

**Recommendations**

- Run automated vulnerability scanning (e.g., `npm audit`, `pip-audit`, or SCA tools).
- Pin critical dependencies to known-good versions; avoid loose `^` or `~` if supply-chain risk is a concern.
- Periodically review changelogs for `jsonwebtoken`, `bcryptjs`, and any cryptographic / auth-related libraries.

---

## 8. Logging, Monitoring, and Observability

**Findings**

- `backend/error-handler.js` and related modules provide robust retry and error categorization.
- Some services print structured JSON logs (e.g., `live-api-python-service.py`).

**Risks**

- Without strict log redaction, secrets or PII may end up in logs.

**Recommendations**

- Centralize logs and implement:
  - **Redaction filters** for tokens, keys, email addresses, etc.
  - Rate-limited alerting on recurring 5xx errors or auth failures.

---

## 9. Prioritized Remediation Roadmap

### Phase 0 – Emergency (Same Day)

- **Rotate all leaked secrets** and keys (Gemini, Google, LiveKit, Supabase, TRACKER_API_KEY).
- **Remove hardcoded secrets** from code and Dockerfiles.
- **Lock down LiveKit token endpoints** with authentication and strict grants.

### Phase 1 – Short Term (1–2 Weeks)

- Fix Supabase `trade_offers` RLS policies to enforce ownership.
- Implement strict URL validation and allow-lists for all scrapers.
- Tighten CORS configurations for all publicly exposed services.
- Review and sanitize logs across all services.

### Phase 2 – Medium Term (2–6 Weeks)

- Implement **server-side 2FA** and remove or clearly mark client-only demos.
- Improve Tracker API auth model (per-user/device, not only shared API key).
- Harden Docker images (minimal bases, no baked secrets, least privilege).

### Phase 3 – Ongoing

- Integrate dependency scanning (SCA) into CI.
- Regularly run Supabase and cloud security advisors.
- Maintain an internal **secure coding guideline** document aligned with these findings.

---

## 10. Conclusion

The codebase offers a rich set of AI, real-time comms, and gaming features, but currently exhibits several **critical security issues**, primarily around **secret management**, **token minting**, **SSRF exposure**, and **incomplete access control** in Supabase and certain backends.

By prioritizing the remediation steps above—starting with secret rotation, LiveKit token hardening, RLS fixes, and URL allow-lists—you can significantly strengthen the overall security posture while keeping the architecture largely intact.
