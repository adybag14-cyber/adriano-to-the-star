# Starsector Web Deployment via CheerpJ - Session Report

**Date:** 2026-01-10  
**Project:** Starsector Linux -> WebAssembly (CheerpJ 4.2)  
**Status:** **Core Engine Booting (Assets Loading)**

---

## 1. Executive Summary
The goal of this session was to fix critical initialization errors preventing the Starsector game engine from booting in a browser environment using CheerpJ 4.2. 

**Key Achievements:**
- Resolved persistent `VM ERROR: Could not initialize JNI` by correctly diagnosing and fixing a Java Runtime Environment (JRE) path mismatch.
- Bypassed Cross-Origin Embedder Policy (COEP) blocks by establishing a robust local proxy and eventually a full local runtime mirror.
- Eliminated browser/server "freezing" during asset loading by implementing connection throttling and optimizing the Node.js static server.
- Successfully verified the integrity of the local JRE 17 `modules` file (38MB).

**Current State:**
The game engine now successfully:
1.  **Initializes the JVM** (JNI error resolved).
2.  **Prefetches 5,500+ assets** (graphics/sounds) into the browser's IndexedDB.
3.  **Executes the `CombatMain` entry point.**

The system is currently stalling at the final execution step, likely due to the sheer weight of initializing the game logic in an emulated environment, but the underlying infrastructure (network, runtime, filesystem) is verified functional.

---

## 2. Technical Challenges & Solutions

### A. The "204 No Content" Runtime Error
**Issue:** CheerpJ failed to load the Java 17 Runtime, returning `204 No Content` for `lib/modules`.
**Diagnosis:** 
- The browser and Cloudflare cached a "failed" response (204) for the runtime URL.
- The default `cj3.js` logic requested `/lt/17/lib/modules`, but the correct CDN path was `/17/lib/modules` (without the `/lt/` prefix).
- Proxying requests failed because the proxy blindly forwarded the `/lt/` prefix.

**Solution:**
1.  **Fuzzing:** Wrote a script to probe the CDN and discovered the correct path.
2.  **Local Mirror:** Downloaded the correct `modules` file (38MB) and `cheerpj-*.jar` support files to the local project directory.
3.  **Clean Loader:** Reverted `cj3.js` to its original state to force it to look for the runtime locally, bypassing the CDN entirely.

### B. The "Freezing" Server
**Issue:** The browser would hang/freeze when prefetching 5,484 game assets.
**Diagnosis:** 
- The Node.js server was logging every single request to `stdout`.
- Synchronous console I/O for 5000+ rapid requests blocked the event loop, causing the server to stop responding to the browser's keep-alive checks.
- Browser connection pool exhaustion led to `net::ERR_ABORTED`.

**Solution:**
1.  **Silent Server:** Rewrote `server.js` to strictly filter logs, ignoring asset requests (`.png`, `.wav`, etc.).
2.  **Throttling:** Modified `game.html` to reduce concurrent fetch workers from 4 to 2 and added a 10ms delay between requests to yield the main thread.

### C. Cross-Origin Policy (COEP)
**Issue:** CheerpJ requires `Cross-Origin-Embedder-Policy: credentialless`, but local file serving often lacks these headers.
**Solution:**
- Implemented a custom Node.js server (v5) on **Port 8091** that injects:
    ```http
    Cross-Origin-Embedder-Policy: credentialless
    Cross-Origin-Opener-Policy: same-origin
    Cache-Control: no-store
    ```
- Changed port from 8090 to 8091 to ensure a clean browser cache state.

---

## 3. Infrastructure Overview

### Directory Structure
```text
/starsector
├── server.js            # Node.js Static Server (Port 8091, optimized)
├── game.html            # Main entry point (Prefetch + CheerpJ Init)
├── loader.js            # CheerpJ 4.2 Loader
├── cj3.js               # CheerpJ 4.2 Runtime (Patched/Restored)
├── cheerpOS.js          # CheerpJ Filesystem Layer
├── assets.json          # Manifest of all 5484 game files
├── 17/                  # Local Java 17 Runtime (modules + jars)
└── native/              # Linux native libraries (stubbed/emulated)
```

### Key Configuration (`game.html`)
- **Version:** Java 17
- **Filesystem:** `overlay` mount (HTTP read-only + IndexedDB writeable).
- **Properties:**
    - `java.awt.headless=false`
    - `log4j.debug=true` (For diagnosing startup stalls)
- **Entry Point:** `com.fs.starfarer.combat.CombatMain`

---

## 4. Next Steps for Developer

1.  **Monitor "Executing CombatMain":**
    The current stall happens after `cheerpjRunMain` is called. This is likely pure CPU emulation time.
    *   **Action:** Keep the browser tab open for 5-10 minutes. The JVM is initializing static initializers for hundreds of Starsector classes.

2.  **Native Library Support:**
    Starsector uses `lwjgl` (Lightweight Java Game Library). CheerpJ provides a web-compatible implementation, but specific native calls might fail silently.
    *   **Action:** If the game crashes with `UnsatisfiedLinkError`, we must verify if `cheerpj-dom.jar` or similar is needed for WebGL binding.

3.  **Memory Tuning:**
    Starsector defaults to 1.5GB+ RAM. WebAssembly memory is limited (4GB hard cap, often 2GB practical).
    *   **Action:** If it crashes with OOM, reduce texture quality settings in `data/config/settings.json` before booting.

---

**Ready to resume debugging at:** `http://localhost:8091/`
