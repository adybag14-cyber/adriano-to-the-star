# Agent 3 – AI/ML Scripts Survey

High-level survey of AI/ML-related scripts currently in use, their roles, and where Agent 3 has integrated logging, fairness, or governance.

This is **not** an exhaustive audit, but a practical map for future Agents and maintainers.

---

## 1. Core AI Usage & Governance

### 1.1 AI Usage Logging

- **`ai-usage-logger.js`**  
  Creates `window.aiUsageLogger` and `window.aiUsageEvents`.
  - Each event: `{ feature, model, context, url, timestamp }`.
  - Also forwards minimal metadata to `window.analytics.track('AI Usage', ...)` when available.
  - Dev helpers:
    - `showAIUsageSummary(limit)` – recent AI usage.
    - `showAIFairnessSummary(limit)` – subset with `context.fairness`.

### 1.2 Bias/Fairness Helpers

- **`ai-model-bias-detection.js`**  
  Lightweight bias detection utility:
  - `detectBias(modelId, testData)` with simple grouping over a `sensitiveAttributes` field.
  - Produces `overallBias` and per-attribute disparity.
  - Emits metrics via `performanceMonitoring` and `analytics`.

- **`fairness-bias-detection.js`**  
  UI-oriented fairness checker driven by `[data-fairness-bias-detection]` containers.  
  Intended for manual fairness checks on uploaded models.

- **`fairness-metrics-tracking.js`**  
  Defines a simple registry for fairness metrics and measurements.  
  Not heavily used yet; suitable for future deeper audits.

- **`model-fairness.js`**, **`model-governance.js`**, **`responsible-ai-framework.js`**  
  Higher-level governance scaffold:
  - Encodes fairness/accuracy/privacy/documentation as policies.
  - Not deeply wired into runtime flows yet; good candidates for future expansion.

### 1.3 Where Governance Is Actively Used (Agent 3)

- **`stellar-ai.js`**  
  For each successful chat turn:
  - Uses `textClassification` to categorize the prompt.
  - Uses `aiModelBiasDetection.detectBias(...)` to compute a small fairness summary.  
  - Logs via `aiUsageLogger` with `context.fairness`.

- **`database-optimized.js`** (planet search)  
  For debounced planet search queries:
  - Logs via `aiUsageLogger` (`feature: 'planet-search'`).
  - Attaches a fairness summary using `aiModelBiasDetection` when available.

- **`natural-language-queries.js`**  
  For NL queries executed against Supabase:
  - Logs via `aiUsageLogger` (`feature: 'planet-search-nl'`).
  - Attaches a fairness summary.

- **`database-ai-search-suggestions-enhanced.js`**  
  For AI suggestion generation and clicks:
  - Logs via `aiUsageLogger` (`feature: 'planet-search-ai-suggestions'` and `'-click'`).
  - Attaches fairness summaries.

- **`computer-vision-capabilities.js`**  
  For image-gallery ML classification:
  - Logs via `aiUsageLogger` (`feature: 'image-gallery-ml'`).
  - Attaches a fairness summary.

---

## 2. Text Classification & NLP

### 2.1 Text Classification

- **`text-classification.js`**  
  Simple classifier used to categorize:
  - Stellar AI prompts.
  - Database planet search queries.
  - Natural-language queries.
  - AI search suggestions and suggestion clicks.

Agent 3 ensured that calls are **throttled** to avoid excessive logging, and that classification results are always optional in the logging context.

### 2.2 Natural-Language Queries

- **`natural-language-queries.js`**  
  Parses planet-related queries into structured filters:
  - Distance (ly/pc), size, temperature, habitable zone, confirmation status, etc.
  - Executes against Supabase (`planet_claims`).
  - Logs usage and fairness context via `ai-usage-logger.js` and `ai-model-bias-detection.js`.

---

## 3. Recommendation & Search Helpers

- **`recommendation-engine-planets.js`**  
  Planet recommendation logic:
  - Cold-start recommendations (popular + trending planets).
  - Strategy flag via `PLANET_RECOMMENDATION_STRATEGY`.

- **`database-ai-search-suggestions-enhanced.js`**  
  AI-powered search suggestions for planet search:
  - Uses Gemini (via `gemini-live-helper`) when API key is present.
  - Mixes history + semantic + LLM suggestions.
  - Logs generation and click events with classification and fairness summaries.

- **`database-optimized.js`**  
  Core search + filter UI:
  - Indexed search for planets.
  - AI usage logging on search queries.
  - Slow-query hint line driven by `slow-api-logger.js`.

---

## 4. Image / Computer Vision

- **`computer-vision-capabilities.js`**  
  Central CV helper:
  - Object detection (real or placeholder).
  - Image classification (Mobilenet or simple fallback).
  - Optional face detection, OCR, and edge detection.

- **`planet-discovery-image-gallery.js`**  
  Image gallery integration:
  - Uses real `<img>` elements with `data-cv-classify` / `data-cv-detect-objects`.
  - Shows ML summary per card (top class + confidence).
  - Provides a per-image **"Re-run ML analysis"** control.

Agent 3 added AI usage logging + fairness summaries for gallery classifications.

---

## 5. Other AI/ML Utility Families

The project includes additional AI/ML-flavored modules for future work (many are scaffolding rather than fully wired):

- **Model/ML families**: `machine-learning-analytics.js`, `deep-learning-analytics.js`, `neural-network-analytics.js`, `ml-model-registry.js`, `model-registry.js`, `model-versioning-registry.js`, `mlaas.js`, `multimodal-ai-models-integration.js`.
- **Domain-specific analytics**: `fraud-detection-ml.js`, `demand-forecasting.js`, `predictive-maintenance.js`, `price-optimization.js`, `resource-scheduling-ml.js`, `customer-churn-prediction.js`.
- **Language/vision**: `language-translation.js`, `named-entity-recognition.js`, `sentiment-analysis-advanced.js`, `image-classification.js`, `image-segmentation.js`, `image-recognition-analytics.js`, `image-generation-models.js`, `document-understanding.js`, `speech-recognition.js`.

Most of these are designed as **example or future expansion modules**. Agent 3 did **not** deeply integrate them into the live UI or governance flows; they are good candidates for future Agents to:

- Register in a central model registry.
- Attach consistent AI usage logging.
- Attach fairness/bias metrics where appropriate.

---

## 6. Recommendations for Future Agents

- **Consolidate Governance**  
  Consider using `model-governance.js` + `responsible-ai-framework.js` to define a single source of truth for fairness, accuracy, privacy, and documentation requirements across all active AI/ML features.

- **Deepen Fairness Audits**  
  Current fairness summaries are lightweight. A future pass could:
  - Use real protected attributes in `testData`.
  - Store and visualize fairness trends per model in a dedicated dashboard.

- **Complete AI/ML Script Survey**  
  This document is intentionally high-level. If stricter compliance is needed, expand it into a formal inventory including:
  - Data sources.
  - Model versions.
  - Training/evaluation notes.
  - Owners / responsible maintainers.
