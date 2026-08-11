# AGENT 3 FOCUS

Agent 3 focuses on advanced Performance, Web Vitals, Caching, NLP search, Recommendations, and AI governance/logging on top of the existing project.

## Areas Touched

- Core Web Vitals monitoring, dashboard, and alerts
- Performance budgets and Real User Monitoring (RUM)
- API response caching and cache metrics
- Natural language search parsing for planet queries
- Planet recommendation engine (cold-start + strategy flags)
- AI usage logging and transparency helpers

## Key Files Updated

- core-web-vitals-monitoring.js
- core-web-vitals-dashboard.js
- core-web-vitals-alerts.js
- performance-budgets-system.js
- performance-monitoring-rum.js
- api-cache.js
- api-cache-system.js
- natural-language-queries.js
- recommendation-engine-planets.js
- ai-usage-logger.js
- ai-planet-descriptions.js
- stellar-ai.js
- performance-metrics-export.js
- performance-summary-helper.js
- slow-api-logger.js
- endpoint-performance-config.js

This file is intended as a quick map for future Agents to understand where Agent 3 concentrated work.

## Performance Monitoring & Exports (Quick Usage)

- Web Vitals dashboard:
  - Enabled on heavier pages such as `database.html`, `stellar-ai.html`, and `dashboard.html` via `core-web-vitals-monitoring.js` and `core-web-vitals-dashboard.js`.
  - Use the floating 📊 toggle to show/hide current LCP/FID/CLS/FCP/TTI/TBT and the **Recent Budget Breaches** panel.
- Performance budgets:
  - Defined and checked in `performance-budgets-system.js` for FCP/LCP/FID/CLS/TTI; breaches are logged to console and, if available, to `window.analytics.track('Performance Budget Exceeded', ...)`.
- RUM metrics:
  - `performance-monitoring-rum.js` collects navigation/resource/paint/longtask/memory metrics.
  - Controlled by `window.PERFORMANCE_MONITORING_RUM_CONFIG` and can be globally disabled with `window.ENABLE_RUM = false`.
- Export & summaries:
  - `performance-metrics-export.js` exposes `exportPerformanceMetrics()` which downloads `performance-report.json` (RUM + Web Vitals + budget breaches); wired to a dev-only button on `dashboard.html`.
  - `performance-summary-helper.js` exposes `showPerformanceSummary(limit)` for a quick console summary of current RUM keys, Web Vitals snapshot, and recent budget breaches.

## AI Usage Logging & Transparency (Quick Usage)

- Central logger:
  - `ai-usage-logger.js` creates `window.aiUsageLogger` and a rolling `window.aiUsageEvents` buffer.
  - Each event records `feature`, `model`, `url`, `timestamp`, and a `context` object.
- Where it is used:
  - `stellar-ai.js` logs each successful chat turn with context including:
    - `hasImages`, `hasFiles`, `messageLength`.
    - Basic text classification (`textCategory`, `textCategoryConfidence`) via `text-classification.js`.
    - A minimal fairness summary (`fairness.overallBias`, `fairness.metric`, `fairness.disparity`) via `ai-model-bias-detection.js` when available.
  - `ai-planet-descriptions.js` logs Gemini calls with `feature: 'ai-planet-descriptions'` and planet identifiers in context.
- How to inspect usage:
  - In DevTools console on any page with the logger loaded:
    - `showAIUsageSummary(limit)` prints a table of recent AI operations (feature, model, time, url).
    - `showAIFairnessSummary(limit)` prints recent entries that have a fairness context (feature, model, overallBias, metric, disparity, time).
  - On `stellar-ai.html`, a dev-only "🔍 AI Usage (Dev)" button toggles a small overlay showing the last few AI usage events.
