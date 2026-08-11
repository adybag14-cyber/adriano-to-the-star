# GLOBAL SECURITY SWEEP – AUDIT REPORT (2025-12-07)

This report summarizes a repo-wide security-oriented sweep with emphasis on:

- DOM manipulation patterns (`innerHTML`, `insertAdjacentHTML`, inline handlers).
- Dynamic code execution (`new Function`, `eval`).
- Storage of user data (`localStorage`, `sessionStorage`).
- Input validation and XSS protections.
- Any newly discovered higher-risk areas beyond previously audited modules.

The sweep combined pattern searches and **manual inspection** of key flagged modules.

---

## 1. Dynamic DOM Construction and `innerHTML` / `insertAdjacentHTML`

### 1.1 Dashboard widget + layout systems

**Files reviewed:**

- `dashboard-widget-library.js`
- `customizable-dashboard-layouts.js`

**Findings:**

- `DashboardWidgetLibrary` creates widgets using `innerHTML`:
  - `createStatsWidget`, `createChartWidget`, `createListWidget`, `createProgressWidget`.
  - These interpolate values like `config.title`, `stat.value`, `stat.label`, and `items` directly into HTML strings.
- `CustomizableDashboardLayouts` uses `innerHTML` only for its own control panel, with static markup and no user data.

**Risk assessment:**

- This is **potential XSS** if any of the `config` fields for stats, lists, or titles can be influenced by untrusted user input without sanitization.
- There is no local `escapeHtml` applied in this file.

**Status:** ⚠️ **Medium risk, context-dependent.**

- If only trusted config objects are used (hard-coded or system-generated), risk is low.
- If analytics dashboards or admin UIs ever inject user-provided strings (e.g. labels from DB), these widgets should **escape or sanitize** these fields.

---

### 1.2 Database advanced features & visualization

**Files reviewed:**

- `database-advanced-features.js`
- `database-optimized.js` (targeted portions)
- `database-visualization-features.js`

**Patterns:**

- These files use `insertAdjacentHTML` and `innerHTML` extensively to build rich UI:
  - Advanced filters, favorites, export menus.
  - Comparison modals (tables of planets).
  - Timeline and size comparison modals.
  - "Planet of the Day" card.

**Data sources and escaping:**

- `database-advanced-features.js` and `database-visualization-features.js` mostly interpolate **planet data** from `this.db.allData`:
  - Fields such as `kepid`, `kepler_name`, `kepoi_name`, `type`, `status`, `radius`, `mass`, `distance`, `disc_year`, `availability`.
  - These originate from the curated Kepler dataset and are not user-submitted.
- Buttons with `onclick` attributes like `onclick="showPlanetDetails('${planet.kepid}')"` are wired to global functions and use numeric/string IDs from the dataset.
- `database-optimized.js` “Planet of the Day” card uses `innerHTML` with the same dataset-driven fields plus a call into `aiPlanetDescriptions.renderDescription`, which is already audited to escape or sanitize AI output.

**Risk assessment:**

- Inline handlers and string interpolation are **not ideal style**, but here are driven from **trusted data sources (NASA/Kepler)**.
- As long as those underlying datasets remain non-user-editable, XSS risk is low.

**Status:** ✅ **Acceptable in current data model; tighten if ever allowing user-supplied labels or types.**

---

### 1.3 Cosmic music player

**File reviewed:**

- `public/cosmic-music-player.js`

**Patterns:**

- Injects a **static player UI** via a large HTML string and `insertAdjacentHTML('beforeend', playerHTML)`.
- Playlist `tracks` are defined in code; a manifest can override them, but filenames and names are treated as plain text.
- Does **not inject user-submitted text** into HTML.

**Risk assessment:**

- No user input involved; static or manifest-provided filenames.
- Inline CSS and structure only; no dangerous string concatenation with user data.

**Status:** ✅ **Safe.**

---

### 1.4 Data import wizard (CSV/Excel)

**File reviewed:**

- `data-import-csv-excel-mapping.js`

**Patterns:**

- Uses `innerHTML` to build the wizard UI and to show file info and preview tables.
- CSV/Excel contents (headers and cell values) are interpolated directly into `<th>` and `<td>` without escaping.

**Risk assessment:**

- This module **does render untrusted data** (uploaded files) into the DOM via `innerHTML`:
  - An attacker could craft a CSV with cells like `<img src=x onerror=alert(1)>` or `<script>…`.
  - Those values are inserted as `innerHTML` in preview, which is a classic XSS vector.

**Status:** ❗️ **High risk for CSV/Excel-based XSS in preview.**

**Mitigation suggestions:**

- When building the preview table:
  - Escape `this.headers` and `row` values before inserting into HTML.
  - Use a small `escapeHtml` utility (like elsewhere in repo) or create DOM nodes and `textContent`.
- Alternatively, display data in a `<pre>`/text-only view for the most sensitive contexts.

---

## 2. Dynamic Code Execution (`new Function`, `eval`)

### 2.1 Feature Store for ML

**File reviewed:**

- `feature-store-ml.js`

**Behavior:**

- `computeFeature(name, data)`:
  - Looks up a stored `feature.definition.compute` string.
  - Executes it via `new Function('data', feature.definition.compute)`.

**Risk:**

- This is **arbitrary JavaScript execution** from stored definitions.
- Intended use is likely **internal/admin feature engineering**, but if untrusted parties can define features, this becomes an XSS/remote code execution vector in the browser.

**Status:** ⚠️ **Admin-only / internal only.**

- Safe if definition is only ever authored by trusted devs/admins.
- Should be treated similarly to `workflow-automation-system.js` `runScript`.

---

### 2.2 Custom Metric Calculation Builder

**File reviewed:**

- `public/custom-metric-calculation-builder.js`

**Behavior:**

- Users define metrics with `formula` and `fields`.
- `calculateMetric(metricId, data)` executes:
  - `const func = new Function(...metric.fields, \
    \`return ${metric.formula}\`);`
  - Then calls `func(...)` with field values from `data`.

**Risk:**

- If **untrusted users** can define metrics, they can supply arbitrary JS in `formula`.
- This is an authenticated admin-style feature by design, but **not safe to expose broadly**.

**Status:** ⚠️ **Admin-only advanced feature; avoid exposing to public users.**

**Mitigation ideas:**

- Restrict access to metric creation to admin dashboards only.
- Optionally, parse formulas into a safe expression language instead of raw JS.

---

### 2.3 Offline-First System queued functions

**File reviewed:**

- `public/offline-first-system.js`

**Behavior:**

- `queueOperation(operation, data, syncFunction)`:
  - Stores `syncFunction.toString()` in `this.syncQueue`.
- `sync()` reconstructs and executes the function using:
  - `const syncFn = new Function('return ' + item.syncFunction)();`
  - Then `await syncFn(item.data)`.

**Risk:**

- Intended for internal **offline queue** of known functions.
- If an attacker can insert arbitrary `syncFunction` strings into localStorage `sync-queue` or into the queueing API, they could run arbitrary code.

**Status:** ⚠️ **Trusted internal API; ensure only your own code calls `queueOperation`.**

**Mitigation ideas:**

- Prefer referencing functions by **name or ID**, and resolve them from a registry instead of serializing code.
- If keeping this approach, gate the API behind trusted caller checks.

---

### 2.4 Other `new Function` / `eval` contexts

- Additional `new Function` or `eval`-like patterns exist in **third-party tooling inside `node_modules`** and in security scanners (e.g. `security-scanner.js` checking for `eval()`), but these are not part of runtime browser code for end users.
- No standalone `eval` in the main app code, aside from a deliberately sandboxed calculator demo (`fara_agent.py`) on the backend side that restricts characters via regex.

**Status:** ✅ **No unintentional `eval` in app JS; deliberate `new Function` usage is confined to admin/internal-style modules.**

---

## 3. Inline Handlers, `document.write`, and Legacy Snippets

### 3.1 Inline handlers in app code

- A number of UI modules still use inline attributes like `onclick="..."` in generated HTML (e.g., `database-advanced-features.js`, `database-visualization-features.js`, `planet-photo-gallery.js`).

**Risk:**

- Inline handlers themselves are not XSS if all interpolated values are trusted and properly escaped.
- They do, however, make CSP harder if you ever move to a strict `Content-Security-Policy`.

**Status:** ⚠️ **Style and CSP concern, not a direct security bug.**

- For a future hardening phase, consider moving to `addEventListener`-based wiring for these components.

### 3.2 `document.write` inside SWF ad snippets

- Pattern search found `document.write("<script ...`")` inside various `.swf`-named files under `swf/`.
- These are **binary/legacy ad code** artifacts, not part of your core JS modules.

**Status:** ⚪ **Legacy artifacts; safe as long as SWF/ad code is not executed in the modern app.**

- You can leave them as historical assets or consider quarantining/removing from modern builds.

### 3.3 `export-multi-format.js` and `document.write`

- `exportPDF` uses:
  - `const printWindow = window.open('', '_blank');`
  - `printWindow.document.write(…)` with a **locally formatted** HTML string built from `formatDataForPrint`.
- `formatDataForPrint`:
  - Loops over data array and inserts values directly into `<td>` cells.
  - If data passed into this exporter includes untrusted strings, they could inject HTML.

**Status:** ⚠️ **Potential XSS if used on untrusted datasets.**

- If export is only used for **Kepler data and internal analytics**, risk is low.
- If you ever export raw user-generated content through this module, switch to escaping values before inserting into cells.

---

## 4. Storage Usage Patterns (`localStorage`, `sessionStorage`)

The sweep surfaced many `localStorage.setItem` and `sessionStorage.setItem` calls. A few noteworthy patterns:

- **Claims, favorites, history, and metrics:**
  - `database-advanced-features.js`, `database-optimized.js`, `database-ai-search-suggestions*.js`, etc., store favorites, claims backup, search history.
  - Values are JSON-encoded objects/arrays, not executed.
- **Analytics & error logging:**
  - Modules like `error-boundary-system.js`, `download-manager.js`, `enhanced-notifications.js` store logs/history in localStorage.
  - No dynamic code execution from those values.
- **Session identifiers & CSRF tokens:**
  - `csrf-protection.js`, `csrf-protection-enhanced.js`, `security-enhancements.js`, and analytics modules store session IDs and CSRF tokens in `sessionStorage`.
  - This is acceptable as long as you do not mix these values into unescaped HTML or code paths.

**Status:** ✅ **Storage usage is state/logging oriented, not used as code.**

- The main caveat is: some systems (`offline-first-system.js`) **do** reconstruct code from strings stored in storage; that has been covered above under `new Function`.

---

## 5. Input Validation and XSS Guards

**Files reviewed:**

- `input-validation-system.js`
- `xss-csrf-protection.js`, `xss-protection-enhanced.js` (previous audits)
- `security-scanner.js`

**Highlights:**

- `InputValidationSystem` provides a rich validator set including:
  - Email, URL, numeric, password strength, and an explicit `noXSS` and `noSQLInjection` rule.
- `noXSS` checks for basic patterns like `<script`, `javascript:`, `onerror=`, `onload=`.
- Validation is applied via `validateForm` and `setupRealTimeValidation`, with error indicators attached next to fields.
- Separate `security-scanner.js` looks for `eval`, `Function(`, `setTimeout`, etc., containing suspicious substrings.

**Status:** ✅ **Good validation infrastructure; regex-based XSS filter is best-effort only.**

- For critical paths, continue to rely on **output escaping** (like `escapeHtml`) rather than only input filters.

---

## 6. Planet Photo Gallery (User-Uploaded Media)

**Files reviewed:**

- `planet-photo-gallery.js` (root)
- `public/planet-photo-gallery.js`

**Behavior:**

- Users upload image files; code checks **mime type** and max size.
- Images are either stored as data URLs or uploaded to Supabase Storage with a **public URL** returned.
- Rendering uses:

  ```html
  <img src="${photo.storageUrl || photo.imageData}" alt="${photo.planetName}" ...>
  ```

- `planetName` comes from Kepler data, not arbitrary user input.
- Description is rendered as HTML inline; descriptions are taken from a `prompt()` call and stored in `photo.description`.

**Risk:**

- The description is user-entered plain text but is inserted without escaping:

  ```js
  ${photo.description ? `<p>...${photo.description}</p>` : ''}
  ```

- This is a potential XSS vector if a user types HTML/JS into the description field.

**Status:** ❗️ **User description XSS risk.**

**Mitigation suggestions:**

- Escape `photo.description` (and `photo.planetName` defensively) before rendering:
  - Either use a shared `escapeHtml` or `textContent` via element creation.
- Alternatively, render descriptions as text-only nodes.

---

## 7. Overall Conclusions & Prioritized New Issues

**New/confirmed higher-risk items from global sweep:**

1. **CSV/Excel import preview XSS (High)**
   - `data-import-csv-excel-mapping.js` inserts uploaded cell values directly into HTML via `innerHTML`.
   - **Needs escaping or text node rendering** before going live in untrusted environments.

2. **Planet photo gallery description XSS (High)**
   - `planet-photo-gallery.js` (root and public) interpolate `photo.description` directly into HTML.
   - **Needs escaping** to prevent script injection via description field.

3. **Dynamic code execution modules (Medium–High, but admin-only by design)**
   - `feature-store-ml.js`, `public/custom-metric-calculation-builder.js`, `public/offline-first-system.js`, and previously-audited `workflow-automation-system.js` use `new Function(...)` or function string reconstruction.
   - They are acceptable **only if confined to trusted/admin contexts** and not exposed to arbitrary user input.

4. **Export-to-PDF HTML generation (Medium, context-dependent)**
   - `export-multi-format.js` uses `document.write()` into a new window and inserts data into `<td>` cells.
   - Safe for non-user data; should be escaped if used for user content.

5. **Dashboard widget `innerHTML` (Medium, context-dependent)**
   - `dashboard-widget-library.js` uses `innerHTML` to render stats, labels, lists from `config`.
   - If `config` ever includes raw user text, it should be escaped.

**Items confirmed as acceptable given current usage:**

- Database advanced and visualization features: heavy use of `innerHTML`/`insertAdjacentHTML`, but fed only from curated Kepler data and controlled IDs.
- Cosmic music player: static UI, no user content.
- Extensive `localStorage`/`sessionStorage` usage is for state and logging, not executed as code (with the few explicit admin-only exceptions above).
- Input validation and XSS/CSRF helper modules are strong and aligned with best practices.

---

## 8. Recommended Next Fixes (Beyond Previously Audited Items)

1. **Escape or text-render all untrusted preview data in `data-import-csv-excel-mapping.js`.**
   - Add an `escapeHtml` helper, or generate DOM nodes and set `textContent` for header and cell content.

2. **Harden `planet-photo-gallery.js` description rendering.**
   - Escape `photo.description` and `photo.planetName` before interpolation.

3. **Clearly mark and gate all `new Function`-based systems as admin-only.**
   - `feature-store-ml.js`, `custom-metric-calculation-builder.js`, `offline-first-system.js` should be documented and UI-gated to trusted roles.

4. **Optionally, plan a Phase 2 CSP-friendly refactor.**
   - Gradually replace inline `onclick` attributes with `addEventListener`-based bindings in the database and gallery modules.

This report is intended to complement the earlier targeted audits and post-fix verification documents by capturing any **residual or newly-identified risks** from a full-repo security sweep.
