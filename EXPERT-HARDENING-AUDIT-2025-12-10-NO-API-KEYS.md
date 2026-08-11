# Expert Security Hardening Roadmap (API Key Issues Omitted)

**Project:** Stellar AI / LiveKit / Supabase / Scrapers Monorepo  
**Date:** 2025-12-10  
**Scope:** Hardening actions for non–API-key risks identified in `EXPERT-CODEBASE-SECURITY-AUDIT-REPORT-2025-12-10-NO-API-KEYS.md`

---

## 1. Scope and Guiding Principles

This roadmap focuses on **implementation steps** for the following areas:

- LiveKit token issuance and room access control (no unauthenticated token minting).
- 2FA architecture and server-side enforcement.
- Supabase RLS, especially `trade_offers` ownership rules.
- SSRF and uncontrolled navigation in scrapers (Browserless / Puppeteer).
- JWT signing configuration and CORS.
- Logging, error handling, and observability (without discussing secrets).
- Client-side cryptography and secure chat UX.
- Docker / infrastructure hardening.
- Dependency and supply-chain hygiene.

**Principles:**

- **Least privilege:** Minimize what each token, service, and container can do.
- **Defense in depth:** Combine RLS, backend checks, and frontend validation.
- **Fail closed:** On misconfiguration, services should refuse to run rather than run insecurely.
- **Observability:** Log and alert on behaviors that indicate attack or misconfiguration.

---

## 2. Risk Baseline (Summarized)

From the NO-API-KEYS audit, the main non-secret risks are:

- Unauthenticated or weakly controlled LiveKit token issuance.
- Client-side-only 2FA with no server-side enforcement.
- Supabase `trade_offers` RLS allowing any user to modify any open offer.
- Potential SSRF / uncontrolled navigation in scrapers.
- Weak default JWT signing configuration and permissive CORS.
- Insecure or demo-only client-side authentication fallbacks (e.g., localStorage-based auth, Starsector page auth) that must not be used in production.
- Logging and security tooling that are currently client-side only and not centralized (audit logging, security scanner).
- Complexity and UX risks in client-side cryptography and secure chat.
- Service worker caching and session recovery behaviors that could mishandle authenticated responses or sensitive UI state.
- Docker images that can be further minimized and locked down.
- Unscanned dependencies and supply-chain exposure.

The following phases translate these into concrete action items.

---

## 3. Phase 0 – Immediate (Same Day)

### 3.1 Lock Down LiveKit Token Issuance

- **Implement authentication requirement** for all LiveKit token endpoints:
  - In `token_server.py`, require a valid session/JWT (from your auth backend or Supabase) before issuing any token.
  - In `backend/stellar-ai-server.js`, ensure LiveKit token routes are behind auth middleware.
- **Enforce authorization checks**:
  - Add a mapping from user identity to allowed rooms or room patterns.
  - Reject token requests for rooms the user is not allowed to join.
- **Restrict token capabilities**:
  - Use minimal grants (e.g., join specific room only, no admin privileges).
  - Set short expirations and rely on refresh logic as needed.
- **Tighten CORS on token endpoints**:
  - Limit allowed origins to your production and staging frontends.

### 3.2 Fix Supabase `trade_offers` RLS

- **Replace status-based update policy** with ownership-based rules:
  - Only the offer owner (`seller_id` or equivalent) can update or cancel their offers.
- **Add separate policies per operation**:
  - Insert: authenticated user can create offers where `seller_id = auth.uid()`.
  - Update: only owner (and possibly agreed counterparty) can update open offers.
  - Select: configure read access as desired (public/limited).
- **Test with real Supabase sessions**:
  - Verify that a user cannot modify another user’s offers, regardless of status.

### 3.3 Mitigate SSRF and Uncontrolled Navigation in Scrapers

- **Enforce domain allow-lists** in:
  - `cloud-functions/broadband-scraper/main.py`.
  - `cloud-functions/price-scraper/main.py`.
  - `cloud-run/headless-scraper/index.js`.
- **Implementation steps**:
  - Introduce a central, version-controlled list of allowed provider hostnames.
  - Reject any requested target that is not in this list.
  - Normalize URLs (scheme, host, port) before checking.
- **Basic network-level hardening**:
  - Where possible, restrict outbound egress for these services to known broadband provider ranges or public internet, blocking access to internal metadata or admin endpoints.

### 3.4 Disable Insecure Client-Side Auth Paths (Production)

- **Disable localStorage-based auth fallback in production**:
  - In `auth-supabase.js`, gate the offline/demo auth mode behind an explicit development flag.
  - Ensure production builds always rely on Supabase or a backend-authenticated session/JWT.
- **Demote Starsector client-side password auth to demo-only**:
  - Treat `starsector-auth.js` as a legacy/demo mechanism; do not use it to protect sensitive or multi-user content.
  - If access control is needed, enforce it on the server (Supabase RLS or backend auth).
- **Document the intended use**:
  - Clearly label all client-only auth flows as non-production in code comments and docs so they are not mistaken for secure authentication.

---

## 4. Phase 1 – Short Term (1–2 Weeks)

### 4.1 Implement Server-Side 2FA Enforcement

- **Design server-side TOTP storage and verification**:
  - Store TOTP secrets server-side (e.g., Supabase Edge Functions + secure table or backend server) rather than only in the client.
  - Implement endpoints for:
    - Enrolling 2FA (generating and storing a new secret).
    - Verifying TOTP codes during login or sensitive operations.
- **Integrate with login flow**:
  - After primary password-based auth, require a valid TOTP code when 2FA is enabled for a user.
  - Only complete session/JWT issuance if TOTP is verified.
- **Update client code** (`two-factor-auth.js`):
  - Use server-side verification endpoints instead of local verification logic.
  - Clearly distinguish between demo mode and enforced mode in the UI.

### 4.2 Harden JWT Signing Configuration

- **Configuration rules** for `backend/auth-server.js` and `backend/planet-server.js`:
  - Prohibit use of weak default signing values in any non-development environment.
  - On missing/weak signing configuration, **fail startup** with a clear error.
- **Implementation details**:
  - Add environment checks: e.g., if `NODE_ENV !== 'development'` and `JWT_SECRET` is default or missing, throw on boot.
  - Centralize JWT configuration (algorithm, expiry, issuer/audience) where possible.

### 4.3 Tighten CORS Across Services

- **Create a shared CORS policy document** defining allowed origins per service and environment.
- **Apply to**:
  - `token_server.py` (limit origins instead of global default).
  - `backend/server.js` (ensure prod/staging origin lists are explicit and small).
  - `tracker-api/index.js` (restrict to known dashboards/clients).
- **Verification**:
  - Automated tests or a small script to validate that production CORS responses match the expected allow-list.

### 4.4 Logging and Observability Improvements

- **Introduce structured logging** in backends:
  - Use a common logger (e.g., Pino/Winston) for `backend/*.js` servers.
  - Prefer JSON logs for easier aggregation and filtering.
- **Redaction / hygiene**:
  - Ensure that user identifiers, room names, and error details are logged at appropriate levels.
  - Avoid logging full request bodies for sensitive endpoints; log metadata only.
- **Monitoring & alerts**:
  - Set up alerts on:
    - Repeated LiveKit token issuance failures.
    - Frequent 4xx/5xx spikes on auth and scraper endpoints.
    - RLS violation attempts, if exposed via logs.
  - Decide which client-side security events (from `security-audit-logging.js` and the `security-scanner*` tooling) should be forwarded to a backend logging endpoint or Supabase table, with strict redaction of secrets and sensitive payloads.
  - Gate verbose security scanning and logging behind an explicit debug flag so that production users are not impacted and sensitive data is not over-logged.

---

## 5. Phase 2 – Medium Term (2–6 Weeks)

### 5.1 Docker and Runtime Hardening

- **Use minimal base images** where possible:
  - Evaluate replacing full Node/Python images with slimmer or distroless variants.
- **Reduce tooling in runtime images**:
  - Ensure build tools and debuggers are not present in final container images.
- **Filesystem permissions**:
  - Confirm that application processes run as non-root (`agentuser`, `pptruser`, etc.).
  - Tighten permissions on config directories; ensure they are writable only by the service user where required.
- **Runtime security controls** (where supported):
  - Add container-level resource limits (CPU/memory) and process caps.
  - Consider read-only root filesystems where feasible.

### 5.2 Secure Chat & Client-Side Cryptography Refinements

- **Clarify threat model and UX**:
  - Document what end-to-end encryption means in this app.
  - Explain passphrase requirements and consequences of losing it.
- **Improve key handling ergonomics**:
  - Provide explicit user flows for key backup/export (if acceptable) and re-keying.
- **Review cryptographic parameters** in `secure-crypto.js`:
  - Ensure key sizes, iteration counts, and algorithm choices match current recommendations.
  - Add automated tests for encryption/decryption compatibility.

### 5.3 Tracker API Access Model

- **Evaluate multi-tenant / per-user design** for `tracker-api/index.js`:
  - Tie devices to user accounts in the database schema.
  - Gate access to device history and status via user identity instead of only a shared secret.
- **Introduce finer-grained roles** if needed:
  - Distinguish between device updaters and viewers.
  - Add audit fields (who updated what, when) for compliance.

### 5.4 CI/CD Security Gates

- **Make security-relevant checks blocking for protected branches**:
  - In `.gitlab-ci.yml`, `.gitlab-ci-enhanced.yml`, and `.github/workflows/ci-cd.yml`, ensure unit tests, linters, and dependency/security scans are required to pass before deploying to staging/production.
  - Avoid using `allow_failure: true` for jobs that should gate deployment (tests, lint, core security checks).
- **Add basic application security checks to CI**:
  - Run dependency vulnerability scanning and basic static analysis on each merge to main or other protected branches.
  - Optionally run lightweight dynamic checks against a staging environment before production deploys.
- **Environment-aware pipelines**:
  - Ensure CI distinguishes between development, staging, and production so that debug or demo-only features cannot be accidentally deployed to production without review.

---

## 6. Phase 3 – Ongoing Improvements

### 6.1 Dependency and Supply-Chain Management

- **Automate vulnerability scanning**:
  - Integrate `npm audit`/equivalents and `pip-audit` (or SCA tools) into CI.
- **Upgrade cadence**:
  - Define a monthly or quarterly dependency update cycle.
  - Prioritize updates for auth/crypto libraries (`jsonwebtoken`, `bcryptjs`, etc.).
- **Lock files and reproducibility**:
  - Maintain `package-lock.json`/`poetry.lock`/`requirements.txt` as appropriate.

### 6.2 Supabase Security Reviews

- **Periodic RLS audits**:
  - Re-check all policies (not just `trade_offers`) against current product requirements.
- **Advisors and tooling**:
  - Run Supabase’s advisor tools regularly and triage findings.
- **Change management**:
  - Require code review for schema and policy changes; include security sign-off where feasible.

### 6.3 Central Secure Coding Guidelines

- Create a short internal guideline document covering:
  - Token issuance and access control patterns (e.g., LiveKit, JWTs).
  - RLS best practices and pitfalls.
  - Rules for scrapers and external HTTP calls (allow-lists, timeouts, validation).
  - Logging hygiene and PII handling.
  - Safe usage patterns for service workers, web storage (`localStorage`/`sessionStorage`), and the existing client-side security tooling (XSS/CSRF helpers, security scanner, audit logger), including when these are demo/dev-only versus production-ready.
- Enforce guidelines via pull-request templates and code review checklists.

---

## 7. Summary

This roadmap turns the non–API-key findings from the NO-API-KEYS audit into a concrete, phased plan.

**Immediate wins** come from:

- Locking down LiveKit token flows.
- Correcting Supabase RLS on `trade_offers`.
- Eliminating SSRF vectors in scrapers.

**Short- and medium-term work**
strengthens 2FA, JWT usage, CORS, Docker security, logging/observability, and client-side cryptography.

Combined, these steps will significantly improve the security posture of the system, independent of how API keys and other secrets are managed, and provide a clearer foundation for future secure feature development.
