# Agent 3 – Performance Utilities Index

Central index for the performance, Web Vitals, caching, and monitoring utilities touched by Agent 3.

## Core Web Vitals & Budgets

- **core-web-vitals-monitoring.js**  
  Collects Core Web Vitals (LCP, FID, CLS, FCP, TTI, TBT) on heavy pages (e.g. `database.html`, `stellar-ai.html`, `dashboard.html`). Provides the floating Web Vitals overlay with a live snapshot.

- **core-web-vitals-dashboard.js**  
  Renders the Web Vitals dashboard view, including trends and the **Recent Budget Breaches** panel.

- **core-web-vitals-alerts.js**  
  Listens to Web Vitals events and raises alerts when thresholds are exceeded.

- **performance-budgets-system.js**  
  Defines performance budgets for key metrics (FCP/LCP/FID/CLS/TTI). Logs budget breaches to console and, when available, to analytics.

### Quick Web Vitals Usage

On heavy pages where these scripts are loaded (such as `database.html` and `stellar-ai.html`):

- Use the floating **📊 Web Vitals** toggle (when present) to show/hide current metrics and recent budget breaches.
- Web Vitals telemetry is automatically wired into the dashboard and alerts; no additional setup is required on those pages.

## Real User Monitoring & Exports

- **performance-monitoring-rum.js**  
  Collects navigation, resource, paint, long task, and memory metrics from real users. Controlled via `window.PERFORMANCE_MONITORING_RUM_CONFIG` and `window.ENABLE_RUM`.

- **performance-metrics-export.js**  
  Exposes `exportPerformanceMetrics()` to download a `performance-report.json` containing RUM metrics, Web Vitals snapshot, and budget breaches.

- **performance-summary-helper.js**  
  Exposes `showPerformanceSummary(limit)` for a quick console summary of current RUM keys, Web Vitals, and recent budget breaches.

## API Caching & Slow API Detection

- **api-cache.js**  
  Legacy API cache with TTL, localStorage persistence, and regex-based invalidation. Emits basic cache hit/miss analytics (`API Cache Hit/Miss`).

- **api-cache-system.js**  
  Advanced cache layer with:
  - Per-entry metadata (timestamps, tags, namespace).
  - TTL and size-based eviction.
  - `invalidateByTags`, `invalidateByPattern`, and `invalidateNamespace(namespace)` helpers.
  - A **namespaced helper API** via `window.apiCache.namespace(ns)`, providing:
    - `cachedFetch(url, options, cacheOptions)`
    - `invalidate()` and `invalidateTags(tags)`
    - `clear()`

  This is the preferred entry point for new caching work. Example consumers include:
  - `nasa-api-integration.js` (namespace: `nasa` for APOD).
  - `database-performance-optimizer.js` (namespace: `db-performance`).

- **endpoint-performance-config.js**  
  Defines `window.endpointPerformanceConfig` with per-endpoint `maxDuration` thresholds (e.g. `/api/dashboard`, `/api/planets`, `/api/ai`, `/api/auth`). Used by the slow API logger.

- **slow-api-logger.js**  
  Wraps `window.fetch` and:
  - Measures request duration against `endpointPerformanceConfig`.
  - Logs slow responses to console and analytics (`Slow API Response`).
  - Stores recent slow events in `window.slowApiEvents`.
  - Emits a `window` `CustomEvent('slow-api-response', { detail })` for client-side hooks.

  Example UI consumer:
  - `database-optimized.js` listens for `slow-api-response` and shows a brief warning line under the search bar when data requests are slower than expected.

## Database & UI Performance

- **database-performance-optimizer.js**  
  Provides generic client-side performance helpers:
  - A local Map-based cache for fetch results (now able to delegate to `api-cache-system` via the `db-performance` namespace when available).
  - Request queueing and simple batching.
  - Debounce helpers for expensive operations.
  - Basic stats on cache size and hit rate.

- **virtual-scrolling.js** / **virtual-scrolling-system.js**  
  Virtual scrolling helpers for large lists. Used where datasets can reach thousands of entries to reduce DOM cost.

- **lazy-loading-manager.js**  
  Manages lazy loading of expensive components and images.

- **code-splitting-optimizer.js**  
  Assists with splitting large bundles and deferring non-critical scripts.

- **database-optimized.js**  
  Core exoplanet database UI with:
  - Indexed search (`buildSearchIndex`, `indexPlanet`, `searchUsingIndex`) for fast lookups.
  - Single-pass filter application (`applyFilters`) and paginated rendering (`renderPage`).
  - A slow-query hint line that reacts to `slow-api-logger` events.

## How to Extend

- **Add a new cached API consumer**
  - Use `const ns = window.apiCache.namespace('my-feature');` when available.
  - Call `ns.cachedFetch(url, options, { ttl, tags })`.
  - Use `ns.invalidate()` or `ns.invalidateTags([...])` when data is invalidated.

- **Add a new slow-query UI hook**
  - Listen for `window.addEventListener('slow-api-response', handler)`.
  - Use `event.detail.duration` and `event.detail.threshold` to drive small, contextual UI hints.

- **Add a new performance view**
  - Prefer RUM + Web Vitals exports via `exportPerformanceMetrics()`.
  - Use `showPerformanceSummary(limit)` in dev tools for quick snapshots when building new dashboards.
