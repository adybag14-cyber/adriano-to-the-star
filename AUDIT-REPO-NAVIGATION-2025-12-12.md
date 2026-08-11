# Repo Navigation Audit Log (2025-12-12)

## Scope / rules
- Ignore API key issues (explicitly requested).
- Goal: understand the site’s “navigation button” behavior and map navigation destinations to the repo files/modules to audit.

## Navigation button implementation (authoritative)
- **File**: `navigation.js` (duplicated at `public/navigation.js`)
- **Behavior**:
  - Dynamically creates (or reuses) a top-right fixed hamburger button with id `menu-toggle`.
  - Dynamically injects a full-screen overlay with id `menu-overlay` containing navigation links.
  - Event handlers:
    - Click `#menu-toggle` => `openMenu()` (adds `.active` classes and locks body scroll)
    - Click `#menu-close` => `closeMenu()`
    - Click on overlay background => `closeMenu()`
    - `Escape` key while open => `closeMenu()`
  - Adds runtime CSS via a `<style id="navigation-styles">` tag to force button visibility/position.
  - Initializes on DOM ready and keeps the toggle button alive via `MutationObserver`.

## Pages that load the navigation system
- `index.html` (root) includes: `<script src="navigation.js" defer></script>`
- Many pages include the same script tag; examples observed:
  - `dashboard.html`
  - `public/dashboard.html`
  - (grep shows `navigation.js` included across many pages in both root and `public/`)

## Navigation menu destinations (from `navigation.js` overlay)
The overlay currently hardcodes links to (non-exhaustive excerpt):
- `index.html`
- `business-promise.html`
- `education.html`
- `projects.html`
- `about.html`
- `database.html`
- `stellar-ai.html`
- `secure-chat.html`
- `messaging.html`
- `marketplace.html`
- `badges.html`
- `analytics-dashboard.html`
- `event-calendar.html`
- `newsletter.html`
- `tracker.html`
- `file-storage.html`
- `games.html`
- `total-war-2.html`
- `gta-6-videos.html`
- `broadband-checker.html`
- `dashboard.html`
- `forum.html`
- `blog.html`
- `hiv-market-analysis.html`
- `star-maps.html`
- `space-dashboard.html`
- `ai-metrics-dashboard.html`
- `ai-fairness.html`
- `database-analytics.html`
- `offline.html`
- `test-index.html`

## Key routed features + initial repo mapping

### Dashboard
- **Page**: `dashboard.html` (also mirrored at `public/dashboard.html`)
- **Notable**:
  - Page includes `navigation.js` and also contains its own static `#menu-toggle` button in markup.
  - Fetches dashboard stats from backend at:
    - `GET http://localhost:3002/api/dashboard/stats` (only when hostname is localhost/127.0.0.1)
  - Uses localStorage fallback when on GitLab Pages.
- **Related scripts included** (audit targets):
  - `auth-supabase.js`
  - `csrf-protection.js`
  - `security-audit-logging.js`
  - `dashboard-widgets.js`
  - `analytics-dashboard-widgets.js`
  - `advanced-analytics-widgets.js`
  - `customizable-dashboard-layouts.js`
  - `core-web-vitals-monitoring.js`
  - `core-web-vitals-dashboard.js`
  - `core-web-vitals-alerts.js`
  - `performance-budgets-system.js`
  - `performance-metrics-export.js`

### Tracker
- **Page**: `tracker.html` (also mirrored at `public/tracker.html`)
- **Notable**:
  - Stores an “unlocked console” state in `localStorage` (`trackerConsoleUnlocked`).
  - Uses WebCrypto (`crypto.subtle.digest('SHA-256', ...)`) to validate a passphrase client-side.
  - When enabled, calls a tracker API service:
    - `POST {baseUrl}/tracker/update`
    - `GET {baseUrl}/tracker/status?deviceId=...`
  - Script defines `window.TRACKER_API_CONFIG` with `baseUrl` and uses it to build requests.
- **Related scripts included** (audit targets):
  - `i18n.js`
  - `animations.js`
  - `navigation.js`
  - `universal-graphics.js`
  - `theme-toggle.js`
  - `accessibility.js`
  - `pwa-loader.js`
- **Related backend/service code** (audit targets):
  - `tracker-api/index.js` (Express + Postgres)

### Stellar AI
- **Page**: `stellar-ai.html`
- **Notable**:
  - Sets `window.STELLAR_AI_BACKEND_URL`:
    - `http://localhost:3001` on localhost
    - Cloud Run URL on production-like hosts
  - LiveKit voice integration:
    - Loads `https://unpkg.com/livekit-client@latest/dist/livekit-client.umd.js`
    - Uses `livekit-voice-integration.js` (local file) to connect to LiveKit rooms and handle audio tracks.
  - Backend proxy is expected to mint LiveKit tokens and/or proxy Gemini Live WebSocket usage.
- **Related scripts included** (audit targets):
  - `livekit-voice-integration.js`
  - plus a large set of performance/security UX scripts (rate limiting, caching, SW registration, audit logging, etc.) included in-page.
- **Related backend/service code** (audit targets):
  - `backend/gemini-live-direct-websocket.js` (Gemini Live direct WS)
  - **Authoritative backend entrypoint**: `backend/stellar-ai-server.js`
    - Listens on `process.env.PORT || process.env.STELLAR_AI_PORT || 3001`
    - Serves static site assets via `express.static(path.join(__dirname, '..'))`
    - Key endpoints:
      - `POST /api/livekit/token` (generates LiveKit JWT using `livekit-server-sdk`)
      - `POST /api/chats/:userId` and `GET /api/chats/:userId` (chat persistence to `backend/stellar-ai-data/chats`)
      - `POST /api/upload` and `GET /api/images/:filename` (image upload/serve under `backend/stellar-ai-data/images`)
      - `GET /api/cli/download` (on-demand CLI zip generation)
    - WebSocket proxy initialization:
      - Creates an HTTP server and calls `createGeminiLiveProxy(server)` from `backend/gemini-live-proxy`.
  - Related helper modules used by the Stellar AI backend:
    - `backend/gemini-live-proxy` (WS proxy hook)
    - `backend/debug-monitor`, `backend/error-handler`, `backend/debug-endpoint`, `backend/auto-recovery`

### Secure Chat
- **Page**: `secure-chat.html`
- **Notable**:
  - Uses `secure-crypto.js` + `secure-chat.js` and Supabase for encrypted messaging flows.
  - Loads auth + audit helpers.
- **Related scripts included** (audit targets):
  - `supabase-config.js`
  - `auth-supabase.js`
  - `csrf-protection.js`
  - `security-audit-logging.js`
  - `secure-crypto.js`
  - `secure-chat.js`

### Direct Messages
- **Page**: `messaging.html`
- **JS entrypoint**: `messaging.js`
- **Notable**:
  - Prefers Supabase table `direct_messages` for message history + realtime, with a localStorage fallback.
  - Uses Supabase realtime channel:
    - `.channel('direct_messages').on('postgres_changes', { event: 'INSERT', table: 'direct_messages', filter: receiver_id=eq.<currentUserId> })`
- **Related scripts included** (audit targets):
  - `supabase-config.js`
  - `auth-supabase.js`
  - `csrf-protection.js`
  - `security-audit-logging.js`
  - `messaging.js`

### File Storage
- **Page**: `file-storage.html`
- **JS entrypoint**: `file-storage.js`
- **Notable**:
  - Uses Supabase Storage with bucket name `user-files`.
  - Enforces client-side limits:
    - 1GB total (`storageLimit`)
    - 100MB per file (`maxFileSize`)
  - Uses Supabase Storage APIs:
    - `storage.listBuckets()`
    - `storage.from(bucket).download(path)`
    - `storage.from(bucket).remove([path])`
    - (upload/listing functions exist in `file-storage.js` and should be audited for pathing/ACLs)
- **Related scripts included** (audit targets):
  - `file-storage.js`
  - `supabase-config.js`
  - `auth-supabase.js`
  - `csrf-protection.js`
  - `security-audit-logging.js`

### Marketplace
- **Page**: `marketplace.html`
- **Notable**:
  - Uses Supabase table `planet_listings` for listings.
  - Loads additional marketplace components (rentals, investments, crowdfunding, notifications, analytics).
- **Primary JS entrypoints** (audit targets):
  - `planet-trading-marketplace.js` (reads/writes `planet_listings`)
  - `marketplace-payment-integration.js` (Stripe/PayPal client-side integrations)
  - `marketplace-ui-integration.js`
  - `planet-rental-leasing.js`
  - `planet-investment-portfolios.js`
  - `space-mission-crowdfunding.js`
  - `planet-trading-notifications.js`
  - `planet-trading-analytics.js`

### Analytics Dashboard
- **Page**: `analytics-dashboard.html`
- **JS entrypoint**: `analytics-dashboard.js`
- **Notable**:
  - Primarily uses Supabase + auth (`auth-supabase.js`) and reads analytics-related datasets.
  - Also integrates performance monitoring and fairness export widgets.
- **Related scripts included** (audit targets):
  - `analytics-dashboard.js`
  - `advanced-analytics-widgets.js`
  - `user-behavior-analytics.js`
  - `performance-monitoring.js`
  - `fairness-metrics-export.js`
  - `monitoring-audits.js`
  - `planet-claim-statistics.js`, `popular-planet-trends.js`, `discovery-rate-tracker.js`, etc.

### Database
- **Page**: `database.html` (also mirrored at `public/database.html`)
- **Primary JS entrypoint(s)**:
  - `database-optimized.js` (main database UI + claiming)
  - `kepler_data_parsed.js` (large data blob; provides `KEPLER_DATABASE` / `window.KEPLER_DATABASE`)
  - `large-exoplanet-loader-core-minimal.js` (provides `LargeExoplanetLoader` used by `database-optimized.js`)
- **Other notable scripts loaded in-page** (audit targets; high-impact subset):
  - Auth/Supabase: `supabase-config.js`, `auth-supabase.js`
  - Claim/reputation: `reputation-system.js`, `planet-ownership-transfer.js`
  - AI helpers: `gemini-live-helper.js`, `database-ai-search-suggestions-enhanced.js`
  - 3D viewer: `planet-3d-viewer.js` + Three.js CDN scripts
  - UX/system: `navigation.js`, `i18n.js`, `notifications.js`, `global-error-handler.js`
- **Endpoints / data sources used**:
  - **Backend API (localhost only)** used by `database-optimized.js`:
    - `GET http://localhost:3002/api/planets/my-claims`
    - `POST http://localhost:3002/api/planets/claim`
  - **Supabase tables used** (when `authManager.useSupabase && authManager.supabase`):
    - `planet_claims` (select/insert; status `active`)
  - **Local data files**:
    - `kepler_data_parsed.js` (Kepler dataset)
    - `data/exoplanets.jsonl` or `data/exoplanets.json` (optional; loaded via `LargeExoplanetLoader.loadLargeDataset(filePath)`)
  - **Browser storage**:
    - `localStorage.user_claims` (offline fallback for claims)
    - `sessionStorage.pendingClaim` (claim-after-login flow)

### Badges & Achievements
- **Page**: `badges.html` (also mirrored at `public/badges.html`)
- **JS entrypoint**: `badges-page.js`
- **Dependencies**:
  - `supabase-config.js` (sets `window.supabaseClient`)
  - `reputation-system.js` (`ReputationSystem` / `window.getReputationSystem()`)
- **Endpoints / data sources used**:
  - **Supabase tables**:
    - `badges_catalog` (`select('*').order('category').order('points_reward')`)
    - `user_badges` (`select('badge_id').eq('user_id', currentUser.id)`)

### Event Calendar
- **Page**: `event-calendar.html` (also mirrored at `public/event-calendar.html`)
- **JS entrypoint**: `event-calendar.js`
- **Dependencies**:
  - `space-api-integrations.js` (provides `SpaceAPIIntegrations`)
  - `supabase-config.js` (loaded but not directly used by `event-calendar.js`)
- **Endpoints / data sources used**:
  - Via `SpaceAPIIntegrations`:
    - `GET https://api.spacexdata.com/v4/launches/upcoming?limit=...`
    - RSS feeds via `https://api.rss2json.com/v1/api.json?rss_url=...` (proxy)
      - `https://www.nasa.gov/rss/dyn/breaking_news.rss`
      - `https://www.space.com/feeds/all`
      - `https://spaceflightnow.com/feed/`
    - (Also implemented in the module, not necessarily called by the calendar UI):
      - `https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI`
      - `https://api.nasa.gov/planetary/apod`
      - `https://api.nasa.gov/neo/rest/v1/feed`
      - `https://hubblesite.org/api/v3/news`
      - `https://www.jwst.nasa.gov/content/webbLaunch/news.rss`

### Newsletter
- **Page**: `newsletter.html` (also mirrored at `public/newsletter.html`)
- **JS entrypoint**: `newsletter.js`
- **Dependencies**:
  - `supabase-config.js` (`window.supabaseClient`)
  - Supabase auth (`this.supabase.auth.getUser()`)
- **Endpoints / data sources used**:
  - **Supabase table**:
    - `newsletter_subscriptions` (insert/update/select; falls back if missing)
  - **Browser storage fallback**:
    - `localStorage.newsletter_subscriptions`

### AI & Fairness
- **Page**: `ai-fairness.html` (also mirrored at `public/ai-fairness.html`)
- **Notable**:
  - Appears to be informational/static (no page-specific JS entrypoint referenced).
  - Loads common site scripts (loader, navigation, theme, accessibility).
  - Mentions governance helpers (as described in text content): `runMonitoringPlacementAudit()`, `runRateLimitingAudit()`, `runAIFeaturePresenceAudit()`, `logAISafetyPostureSummary()`.

### Planet Analytics
- **Page**: `database-analytics.html` (also mirrored at `public/database-analytics.html`)
- **JS entrypoint**: `planet-statistics-dashboard.js`
- **Dependencies**:
  - `supabase-config.js` (`window.supabaseClient`)
  - Optional auth via `window.authManager.getCurrentUser()`
- **Endpoints / data sources used**:
  - **Supabase table**:
    - `planet_claims` (`select('*')` then client-side aggregation)

## Fixes applied (2025-12-12)
- **HTML script tag fixes (load-breaking)**:
  - `badges.html` + `public/badges.html`: fixed missing closing tag for `<script src="badges-page.js">`.
  - `event-calendar.html` + `public/event-calendar.html`: fixed missing closing tag for `<script src="event-calendar.js">`.
  - `newsletter.html` + `public/newsletter.html`: fixed missing closing tag for `<script src="newsletter.js">`.
  - `database-analytics.html` + `public/database-analytics.html`: removed extra stray `</script>` after the `accessibility.js` include.

### Backend (general)
- **File**: `backend/server.js`
- **Notes**:
  - Express server with a large set of optional endpoints.
  - Contains a token gate for some routes in production (`API_TOKEN`), but this audit is ignoring API key issues.
  - Contains many feature endpoints (notifications, docs search, analytics snapshot, perf evaluation, webhooks, etc.) and mock APIs.

### Tracker API
- **Service**: `tracker-api/index.js`
- **Notes**:
  - Express + Postgres.
  - Endpoints:
    - `POST /tracker/update`
    - `GET /tracker/status`
    - `GET /tracker/history`
  - Uses `TRACKER_API_KEY` bearer auth (ignored for this audit’s key-issue rule, but still relevant for behavior).

### Gemini Live (backend)
- **File**: `backend/gemini-live-direct-websocket.js`
- **Notes**:
  - Direct WebSocket integration with Vertex AI / Gemini Live.
  - Uses `gcloud` access token or `google-auth-library` fallback.
  - Has retry logic for model name formatting and client content formats.

## Anomalies / repo hygiene notes (not fixed yet)
- There is a file named `-dashboard.html index.html` (and a mirrored one under `public/`) that contains what appears to be a diff output, not HTML. This looks accidental and should be investigated before assuming it is used by the site.

## Next audit steps
- Enumerate each navigation destination page and capture:
  - The JS/CSS it loads
  - Any backend endpoints it calls
  - Any shared modules (auth, storage, chat, analytics)
- Validate navigation works end-to-end locally (optional) and confirm there are no missing pages/typos in `navigation.js` links.
