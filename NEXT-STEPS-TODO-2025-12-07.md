# Next Steps TODO – Post-Audit

**Author:** Cascade (Audit Assistant)  
**Date:** 2025-12-07  
**Audience:** Lead Developer / Tech Lead

This file summarizes the **next concrete TODOs** after the current round of audits and fixes. All critical and recommended items have been addressed; the items below are **future enhancements**, not blockers.

---

## 1. Blockchain Verification – Real On-Chain Logic

- **File:** `blockchain-verification-system.js`
- **Current state:**
  - Generates a local verification record and (optionally) logs to Supabase.
  - On-chain verification is intentionally left as a `// TODO` with comments.
- **TODO:**
  - Design and implement the real blockchain integration for `verifyClaim(verificationId)`:
    - Choose network(s) (e.g. Polygon, Ethereum testnet).
    - Define how `verificationHash` + `metadata` are anchored on-chain (contract or existing service).
    - Implement a call that:
      - Looks up the transaction by `verification.blockchainTxHash`.
      - Confirms that the on-chain payload matches the local `verification` metadata.
    - Update `verification.status` and `verifiedAt` accordingly.
- **Priority:** Medium–High (feature-level, not a bug).

---

## 2. Advanced Accessibility & UX Polish (Optional)

These are **non-blocking** but will move the UX toward a more polished, A11y-friendly product.

### 2.1 Theme Selector A11y

- **File:** `theme-toggle.js`
- **Current state:**
  - Good ARIA labels on the toggle button.
  - Keyboard activation works via native `<button>` behavior.
- **TODO (optional):**
  - Add `role="menu"` to `#theme-selector-menu` and `role="menuitemradio"` + `aria-checked` to `.theme-option` buttons.
  - Manage focus when opening/closing the selector:
    - On open: move focus into the first `.theme-option`.
    - On close: restore focus to the toggle button.

### 2.2 Comment Section ID Scoping

- **File:** `community-ui.js`
- **Current state:**
  - Comment section uses fixed IDs (`comments-list`, `comment-form`, `comment-text`).
  - Safe as long as only **one** comment section is rendered per page.
- **TODO (optional):**
  - Refactor `renderCommentsSection(container, planetName)` to use **container-scoped selectors** instead of global IDs:
    - Replace `document.getElementById(...)` with `container.querySelector(...)`.
    - Generate IDs or use classes/data attributes unique to the container.

---

## 3. Replace `alert()` with In-App Notifications (Optional)

- **Files (examples):**
  - `ai-planet-habitability-analysis.js`
  - `ai-predictions-ui.js`
  - `ar-planet-viewing.js`
  - `astronomy-courses.js`
  - Various AI tools / demo modules.
- **Current state:**
  - User feedback is often given via `alert('...')`.
- **TODO (optional):**
  - Gradually migrate user-facing alerts to the existing in-app notification system (e.g., `databaseAdvancedFeatures.showNotification` or a shared toast component).
  - Keep `alert()` usage only for debug/demo or very early prototypes.

---

## 4. Documentation & Testing Enhancements (Ongoing)

- **Documentation TODOs** (from existing markdown such as `DOCUMENTATION-STATUS-REPORT.md`):
  - Add missing JSDoc for core public modules (`auth-supabase.js`, `supabase-config.js`, etc.).
  - Ensure `STORAGE-KEYS` and `FEATURE-FLAGS` sections are documented (keys like `planet-bookmarks`, `planet-wishlist`, `ita_flight_recorder`, `ai-planet-descriptions`, `blockchain-verifications`).
- **Testing TODOs:**
  - Add targeted tests (unit/integration) around:
    - `database-optimized.js` pagination and filters.
    - AI description cache behavior and size limiting.
    - Blockchain verification creation and Supabase logging.
    - Bookmark/wishlist add/remove + rendering with edge inputs.

---

## 5. Status

- **Current audit status:**
  - All **critical** and **recommended** issues from the advanced audits have been fixed and verified.
  - Remaining items in this file are **future improvements** that can be scheduled as capacity allows.

---

## 6. Global Sweep Fix Checklist (New)

These are **concrete follow-ups** from the `GLOBAL-SWEEP-AUDIT-2025-12-07.md` report. They are the main places where untrusted data or dynamic code deserve extra hardening.

### 6.1 CSV/Excel Import Preview – Escape Untrusted Cells

- **File:** `data-import-csv-excel-mapping.js`
- **Issue (High):**
  - CSV/Excel headers and cell values from user-uploaded files are rendered into a preview table using `innerHTML` without escaping.
  - Malicious CSV content (e.g. `<img onerror=...>`, `<script>...`) could execute in the browser.
- **TODO:**
  - Introduce a small `escapeHtml` helper (or reuse an existing one) and ensure all header and cell values are escaped before insertion.
  - Alternatively, build preview tables via DOM APIs and `textContent` instead of raw HTML strings.

### 6.2 Planet Photo Gallery – Escape Descriptions

- **Files:** `planet-photo-gallery.js`, `public/planet-photo-gallery.js`
- **Issue (High):**
  - `photo.description` (entered by users via `prompt()`) is interpolated directly into HTML.
  - A user could inject arbitrary markup or scripts into the description field.
- **TODO:**
  - Escape `photo.description` (and defensively `photo.planetName`) before rendering into the gallery card HTML.
  - Prefer using `textContent` for descriptions when possible.

### 6.3 Dynamic Code Execution – Gate as Admin-Only

- **Files:**
  - `feature-store-ml.js`
  - `public/custom-metric-calculation-builder.js`
  - `public/offline-first-system.js`
  - (Previously noted) `workflow-automation-system.js`
- **Issue (Medium–High, design):**
  - These modules intentionally use `new Function(...)` or reconstruct functions from strings, which is equivalent to `eval`.
  - Safe only if **trusted admins/devs** control the inputs; unsafe if arbitrary end-users can define or modify formulas/scripts.
- **TODO:**
  - Explicitly gate the UIs and APIs for these features behind an **admin/owner role**.
  - Document in code comments that these are **not** for untrusted users and should not be exposed on public-facing flows.
  - Consider, longer term, replacing raw JS formulas with a safe expression language if you want to democratize their use.

### 6.4 Export-to-PDF Table HTML – Defensive Escaping

- **File:** `export-multi-format.js`
- **Issue (Medium, context-dependent):**
  - `exportPDF` writes a print-friendly HTML document and inserts values into table cells from arbitrary data objects.
  - If ever used to export raw user-generated text, this could render unescaped HTML.
- **TODO:**
  - When formatting printable tables, escape all text fields before including them in `<td>` cells, or generate cells via DOM nodes and `textContent`.
  - Clarify in comments whether this exporter is intended only for trusted/system data (e.g. Kepler dataset, analytics).

### 6.5 Dashboard Widget Configs – Treat Text as Untrusted

- **File:** `dashboard-widget-library.js`
- **Issue (Medium, future-proofing):**
  - Widget renderers (`createStatsWidget`, `createChartWidget`, `createListWidget`, etc.) use `innerHTML` with `config` values (titles, labels, list items).
  - If those configs ever contain user-provided text (e.g. from a DB/tenant configuration UI), they could carry XSS payloads.
- **TODO:**
  - Either ensure `config` objects are always system-generated and never contain raw user text, **or** start escaping those text fields when building widget HTML.
  - For new features that allow user-driven dashboard configs, plan to use `textContent` or an escaping helper by default.

### 6.6 Template & Analytics Labels – Escape if User-Defined (Short)

- **Files:** `template-system.js`, `analytics-dashboard.js`
- **Issue (Medium, future-proofing):**
  - Today, template names/categories and analytics labels come from trusted config/datasets and are safe.
  - If you ever let end users define template names/categories or arbitrary metric labels, those strings will be rendered into the UI.
- **TODO:**
  - If/when template or analytics labels become user-editable, escape those label strings when building their lists/cards (or switch to DOM APIs + `textContent` as in the template form builder).

Use this appendix together with the earlier sections as the **starting TODO list** for the next hardening cycle.
