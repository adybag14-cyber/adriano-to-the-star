# Agent 3 – Caching Strategy Overview

This note summarizes the client-side caching strategy currently in use, especially where Agent 3 added structure (namespaces, tags, metrics) and concrete consumers.

It is intentionally practical rather than academic: enough detail for future Agents and maintainers to extend caching safely.

---

## 1. Caching Layers

### 1.1 Legacy API Cache – `api-cache.js`

**Purpose:** Simple response cache for fetch requests.

Key characteristics:

- Backed by an in-memory `Map` with TTL and a max size.
- Persists cache entries to `localStorage` (`api-cache` key).
- Cache key: `"<METHOD>:<url>:<body>"` via `generateKey(url, options)`.
- Only caches successful `GET` responses by default.
- Invalidation:
  - `invalidate(pattern)` – regex against cache keys.
  - `clear()` – clears all.
- Metrics:
  - Tracks `hitCount` / `missCount`.
  - Logs via `window.apiCacheStats.events`.
  - Sends analytics events `API Cache Hit` and `API Cache Miss` when `window.analytics.track` exists.

This layer is **still supported**, but Agent 3 favors the newer `api-cache-system.js` for new work.

### 1.2 Unified API Cache System – `api-cache-system.js`

**Purpose:** A more structured cache layer with metadata and **namespaces/tags**.

Core features:

- Two `Map`s:
  - `cache`: key → response payload.
  - `cacheMetadata`: key → `{ expiresAt, createdAt, url, options, tags, namespace }`.
- TTL and size management:
  - `defaultTTL` (5 minutes by default, configurable via `init(options)`).
  - `maxCacheSize` (100 entries by default) with oldest-eviction.
  - Periodic cleanup of expired entries.
- Persistence:
  - Saves `{ cache, metadata }` to `localStorage` (`api-cache` key) on writes.
  - Loads on init and prunes expired entries.

#### 1.2.1 Namespaces and Tags

Each cached entry can belong to a **namespace** and carry **tags**:

- `set(url, options, response, cacheOptions)` attaches:
  - `namespace: cacheOptions.namespace || cacheOptions.ns || 'default'`.
  - `tags: [...(cacheOptions.tags), "ns:<namespace>"]`.
- Invalidation helpers:
  - `invalidateByTags(tags)` – removes entries whose metadata `tags` intersect with given tags.
  - `invalidateByPattern(pattern)` – removes entries whose metadata `url` matches a regex.
  - `invalidateNamespace(namespace)` – removes entries whose metadata `.namespace === namespace`.

Agent 3 added a **namespace helper API**:

```js
const ns = window.apiCache.namespace('my-feature');

// Namespaced cached fetch
ns.cachedFetch(url, options?, { ttl?, tags? });

// Invalidate everything in this namespace
ns.invalidate();

// Invalidate tags (automatically includes ns:<namespace>)
ns.invalidateTags(['tag-a', 'tag-b']);

// Clear = namespace-scoped clear
ns.clear();
```

Internally, this wraps the existing `cachedFetch` / invalidation primitives while auto-injecting the namespace and `ns:<namespace>` tag.

#### 1.2.2 `cachedFetch`

`cachedFetch(url, options = {}, cacheOptions = {})` works as:

1. Generate a cache key from `(url, options)`.
2. If metadata entry exists and is not expired → return a synthetic `Response` built from the cached JSON payload.
3. Otherwise perform a real `fetch(url, options)` and `response.json()`:
   - If `response.ok` and `cacheOptions.enabled !== false`, store the JSON payload via `set()`.
   - Return the **original** `Response` so callers can `.json()` as usual.

Metrics:

- Every `get` hit/miss records an event in `window.apiCacheSystemStats.events` and optionally sends analytics events (`API CacheSystem Hit/Miss`).

---

## 2. Real Consumers

Agent 3 made sure that the unified cache system is not just theoretical.

### 2.1 NASA API Integration – `nasa-api-integration.js`

**Use case:** Astronomy Picture of the Day (APOD).

- Constructor:

  ```js
  this.apiCacheNamespace = null;
  ```

- `init()` attempts to register a namespace:

  ```js
  if (window.apiCache && typeof window.apiCache.namespace === 'function') {
    this.apiCacheNamespace = window.apiCache.namespace('nasa');
  }
  ```

- `fetchAPOD()` logic:

  ```js
  const cacheKey = 'apod-' + new Date().toDateString();
  const url = `${this.baseUrl}/planetary/apod?api_key=${this.apiKey}`;

  // Preferred: unified cache namespace
  if (this.apiCacheNamespace && typeof this.apiCacheNamespace.cachedFetch === 'function') {
    const response = await this.apiCacheNamespace.cachedFetch(url, {}, {
      ttl: 24 * 60 * 60 * 1000,      // 1 day
      tags: ['apod', cacheKey]
    });
    const data = await response.json();
    return data;
  }

  // Fallback: simple in-memory Map cache by date
  if (this.cache.has(cacheKey)) {
    return this.cache.get(cacheKey);
  }

  const response = await fetch(url);
  const data = await response.json();
  this.cache.set(cacheKey, data);
  return data;
  ```

So APOD benefits from:

- A **long TTL (24h)**.
- Namespaced entries (`ns:nasa`) with explicit `apod` tags.
- Seamless fallback when `api-cache-system.js` is not present.

### 2.2 Database Performance Optimizer – `database-performance-optimizer.js`

**Use case:** Caching generic `cachedFetch` operations in the optimizer.

Original behavior:

- Local Map-based cache keyed by `"fetch:<url>:<JSON options>"`.
- TTL-based expiry.

Agent 3 extended `cachedFetch(url, options, ttl)` as:

```js
async cachedFetch(url, options = {}, ttl = 5 * 60 * 1000) {
  try {
    const cacheKey = `fetch:${url}:${JSON.stringify(options)}`;

    // Preferred: unified cache namespace when available
    if (window.apiCache && typeof window.apiCache.namespace === 'function') {
      const nsHelper = window.apiCache.namespace('db-performance');
      const response = await nsHelper.cachedFetch(url, options, {
        ttl,
        tags: ['db-performance', cacheKey]
      });
      const data = await response.json();
      return data;
    }

    // Fallback: local Map cache
    const cached = this.getCached(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await fetch(url, options);
    const data = await response.json();
    this.setCached(cacheKey, data, ttl);
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}
```

This makes the optimizer a **first-class user** of the unified cache when present, while preserving behavior if it is not loaded.

---

## 3. Strategy Guidelines for Future Work

### 3.1 When to Use `api-cache-system`

Use the unified cache for:

- Public, read-heavy API calls where **freshness windows** are well understood (e.g. APOD, catalog data, rarely-changing configs).
- Any feature that benefits from:
  - Per-feature invalidation (namespaces).
  - The ability to group keys by domain or purpose (tags).
  - Shared cache inspection across modules.

Prefer the legacy `api-cache.js` only when:

- You are patching older code that already uses it and there is no appetite to migrate yet.
- A light-weight, local-only cache is sufficient and central invalidation is not required.

### 3.2 Namespacing and Tagging Practices

General recommendations:

- Use short, descriptive namespace names (`'nasa'`, `'db-performance'`, `'news-feed'`, etc.).
- For tags:
  - Include a stable tag for the logical resource (`'apod'`, `'kepler-catalog'`, `'trending-planets'`).
  - Add more granular tags only when needed for selective invalidation (e.g. `'user:<id>'`).

Example for a new feature:

```js
const ns = window.apiCache.namespace('news-feed');

// Cache feed for 5 minutes, tagged by section
const response = await ns.cachedFetch('/api/news?section=space', {}, {
  ttl: 5 * 60 * 1000,
  tags: ['space-news', 'section:space']
});
const data = await response.json();
```

Invalidation patterns:

- Invalidate **all** news feed cache:

  ```js
  ns.invalidate();
  ```

- Invalidate just the "space" section across reloads:

  ```js
  ns.invalidateTags(['section:space']);
  ```

### 3.3 Relationship with Error Recovery & Slow API Logging

- **`error-recovery-system.js`** can consult cache layers as fallbacks when network requests fail; unified cache entries can be used here as well.
- **`slow-api-logger.js`** is **orthogonal** to caching:
  - It wraps `window.fetch` to measure durations vs `endpoint-performance-config.js`.
  - It does not change caching behavior, but its events can help tune TTLs and identify which endpoints are good candidates for caching.

### 3.4 Migration Considerations

For existing features using `api-cache.js`:

- Migration does **not** have to be all-or-nothing.
- You can:
  - Start by wrapping new endpoints in `api-cache-system.js`.
  - Gradually port old usages, especially where namespace-level invalidation is beneficial.
  - Keep `api-cache.js` active for legacy flows until they can be retired.

---

## 4. Summary

Agent 3’s caching strategy:

- Keeps `api-cache.js` as a simple, legacy-friendly cache.
- Promotes `api-cache-system.js` as the **unified, namespaced cache layer**, with:
  - A consistent keying model.
  - TTL + size management.
  - Namespace / tag-based invalidation.
  - Analytics and RUM hooks via metrics events.
- Demonstrates real usage via NASA APOD and the Database Performance Optimizer.

Future Agents can build on this by:

- Wiring additional API consumers through `apiCache.namespace(ns)`.  
- Using tags to ensure cache invalidation is **precise**, not global.  
- Leveraging slow API and performance metrics to continuously tune TTLs and caching behavior.
