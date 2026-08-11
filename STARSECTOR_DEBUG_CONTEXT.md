# 🚀 Starsector Web Port: Debugging Context & Handover

## 📍 Current Status
We are debugging the Starsector game running in the browser via **CheerpJ 4.2**. The project has multiple entry points (`starsector.html`, `starsector_4.2_final.html`), and we are using Playwright to capture console logs and diagnose failures.

## 🛠️ Environment Setup
- **Web Server:** Custom Node.js server (`server_v2.cjs`) running on **port 8000**.
    - **Critical Feature:** Supports `Range` headers (required for CheerpJ JIT loading).
    - **Security:** Configured with `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: credentialless` to enable `SharedArrayBuffer`.
- **Test Suite:** `tests/e2e/debug-starsector.spec.js` is the primary diagnostic tool.

## 🔍 Recent Findings & Blockers
1.  **Range Header Issue:** Previously, the Python and standard `http-server` failed because they did not support byte-range requests. This caused CheerpJ to fail while loading `.jar` files. **Status: Fixed** by switching to `server_v2.cjs`.
2.  **NullPointerException (NPE):** In `starsector.html`, the logs show:
    ```
    java.lang.NullPointerException
    at com.fs.starfarer.settings.StarfarerSettings.null(Unknown Source)
    at com.fs.starfarer.combat.CombatMain.main(Unknown Source)
    ```
    - This likely occurs because the game cannot find or parse `settings.json` or related configuration files within the virtual filesystem.
3.  **WebGL Performance / Stalls:**
    - `GPU stall due to ReadPixels` warnings in Chromium.
    - Software WebGL fallback warnings.
4.  **404 Errors:** 
    - Some assets like `/app/Starsector/starfarer.log` return 404 because they are expected to be created at runtime or are missing from the served directory structure.

## 📋 Instructions for Future Work
- **DO NOT** kill the Node process (`server_v2.cjs`) unless replacing it with an equivalent Range-supporting server.
- **File Reading Constraint:** Never read files exceeding **5,000 lines** in their entirety. Use `Get-Content -Tail 100` or `Get-Content -TotalCount 100` to inspect logs or large HTML/JS files.
- **Debugging the NPE:**
    - Inspect `starsector.html` to see how it defines the CheerpJ mount points.
    - Verify that `Starsector/starsector-core/data/config/settings.json` (or equivalent) exists and is accessible via the server.
    - Check the `starfarer_obf_v2.jar` integrity if possible.
- **Verification:**
    - Run `npx playwright test tests/e2e/debug-starsector.spec.js` after any configuration change to gather fresh logs.
    - Check the visual result in `test-results/` screenshots to see if the LWJGL canvas ever renders anything beyond a black screen.

---
*Context saved on Tuesday, 6 January 2026.*
