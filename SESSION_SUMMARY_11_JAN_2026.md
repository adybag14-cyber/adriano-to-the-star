# Session Summary: Starsector Web Debugging
**Date:** 11 January 2026

## 🎯 Objective
Resolve the `java.lang.NullPointerException` occurring in `com.fs.starfarer.settings.StarfarerSettings` when running Starsector 0.97 via CheerpJ 4.2 in a browser environment.

## 🛠️ Infrastructure Changes
### 1. Node.js Server (`server.js`)
- **Byte-Range Support:** Confirmed and optimized support for `Range` headers, critical for CheerpJ's JAR loading.
- **MIME Types:** Added explicit MIME mappings for Starsector specific extensions (`.ship`, `.variant`, `.wpn`, etc.) and `.wasm`/`.class`.
- **Directory Listings:** Implemented HTML-based directory listings to allow the JVM to scan directories (specifically for `data` and `config` access).
- **Path Handling:** Added logic to strip `/starsector-core/` prefixes to map requests correctly to the project root.
- **Headers:** Configured `Cross-Origin-Embedder-Policy: credentialless` and `Cross-Origin-Opener-Policy: same-origin` to support `SharedArrayBuffer`.

### 2. Game Entry Point (`debug_game.html`)
- **Runtime:** Switched to **CheerpJ 4.2 (CDN)** to support Java 17 (required by Starsector 0.97).
- **Filesystem Mount:** Configured `/app` (and attempted `/app/starsector-core`) as the virtual filesystem root backed by the local server.
- **Prefetching:** Implemented a JavaScript prefetcher to cache `settings.json`, `console_log4j.properties`, and other critical assets before JVM boot.
- **Properties:** Tuned system properties (`user.dir`, `fs.game.dir`, `log4j.configuration`) to align with the virtual path structure.

## 🔍 Investigation Findings
### The NullPointerException (NPE)
- **Location:** `com.fs.starfarer.settings.StarfarerSettings.ô00000(Unknown Source)` (obfuscated method).
- **Cause:** The JVM is unable to locate or read `data/config/settings.json` during static initialization.
- **Evidence:** Server logs show **no requests** from the JVM for `settings.json`, only from the prefetcher. This indicates the `File` or `ClassLoader` API call inside the game is returning `null` or an empty stream before it even hits the network layer.

### Blockers
1.  **Resource Discovery:** Despite the file existing and being served, the JVM's classloader cannot "see" loose files like `settings.json` or `console_log4j.properties` in the root of the mounted drive. It relies on directory listings, which might still be incompatible with what CheerpJ expects.
2.  **Cross-Origin Issues:** Using the CheerpJ 4.2 CDN with strict COOP/COEP headers resulted in `net::ERR_BLOCKED_BY_RESPONSE` for some resources, and `postMessage` origin mismatches.
3.  **Local Runtime Limitation:** The local `loader.js` and `cj3.js` are version 3.0 (Java 8), which is incompatible with Starsector 0.97's Java 17 requirement (`Unsupported class version` errors).

## ⏭️ Next Steps
1.  **Acquire Local CheerpJ 4.2:** To bypass CORS/COOP issues reliably, we need the version 4.2 resources (`loader.js`, `cj3.js`, `cj3.wasm`) locally.
2.  **Manual VFS Injection:** Since standard loading fails, write a small Java utility (compiled via `janino`) to manually write `settings.json` into the CheerpJ IndexedDB `/app` filesystem *before* launching the game.
3.  **JAR Packaging:** Alternatively, package `data/` and `config/` into a `resources.jar` and add it to the classpath, forcing the JVM to load them as resources rather than files.
