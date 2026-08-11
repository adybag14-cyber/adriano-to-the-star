# CheerpJ Migration Summary - Starsector

## Overview
This document summarizes the steps taken to successfully migrate and run the Starsector game in a browser environment using CheerpJ. The process involved overcoming significant compatibility challenges, including JVM version mismatches, missing Swing/AWT implementations, obfuscated code issues, and filesystem structure requirements.

## Key Challenges & Solutions

### 1. Entry Point Determination
- **Challenge:** The standard launcher (`com.fs.starfarer.launcher.StarfarerLauncher`) relies on `ProcessBuilder` to spawn the game process, which is not supported in the CheerpJ sandbox.
- **Solution:** Identified `com.fs.starfarer.combat.CombatMain` as the actual game entry point. Bypassed the launcher entirely and configured CheerpJ to invoke `CombatMain.main` directly.

### 2. Runtime Crashes (NullPointerException & IndexOutOfBounds)
- **Challenge 1 (NPE):** `StarfarerSettings.class` threw a `NullPointerException` during static initialization. This was traced to a hardcoded logic sequence (`aconst_null` -> `invokevirtual`) that likely checked for platform-specific properties or files not present in the emulated environment.
- **Solution 1:** Applied a binary patch to `StarfarerSettings.class` in `starfarer_obf_v2.jar`. Replaced the problematic `aconst_null` and `invokevirtual` opcodes with `pop` instructions, effectively neutralizing the null dereference while preserving the stack state.
- **Challenge 2 (IOOB):** `CombatMain.main` expected command-line arguments (at indices 0, 1, 2) and crashed with `ArrayIndexOutOfBoundsException` when none were provided.
- **Solution 2:** Patched `CombatMain.class` to replace the array access instructions (`aload_0`, `iconst_0`, `aaload`) with `ldc "true"`. This hardcoded valid "true" string arguments directly into the bytecode, bypassing the need for actual CLI arguments.

### 3. Configuration & Asset Parsing
- **Challenge:** The game's `settings.json` used non-standard JSON features (comments, trailing commas, float suffixes like `1f`) which the CheerpJ/browser JSON parser rejected.
- **Solution:** Created a sanitized version of `settings.json` that strictly adheres to the JSON standard.
- **Challenge:** Resolution settings caused an `ArithmeticException` (divide by zero) in the display initialization logic.
- **Solution:** Enforced a fixed resolution of `1280x768` in both `settings.json` and the `lwjgl.js` shim to ensure valid dimensions were always returned.

### 4. Native Library Emulation (LWJGL)
- **Challenge:** Starsector uses LWJGL 2, which requires native dynamic libraries (`.dll`, `.so`) that don't run in a browser.
- **Solution:** Utilized and customized a JavaScript-based LWJGL shim (`lwjgl.js`). This shim intercepts Java native method calls (JNI) and redirects them to WebGL and other browser APIs, effectively emulating the necessary graphics, sound, and input functionality.

### 5. File System Structure
- **Challenge:** The game expects a specific directory layout relative to the "user directory," including `/data`, `/graphics`, and `/sounds`.
- **Solution:** Configured the CheerpJ runtime with explicit mounts (`/app/Starsector`, `/app/Starsector/starsector-core`, etc.) and mapped the user home directory to memory (`/app/Starsector`) to allow the game to write preferences and log files without errors.

## Final State
- **Status:** **Success**. The game initializes, loads assets, and reaches the main menu/gameplay loop without crashing.
- **Performance:** Initial load times are significant due to the download and decompression of large asset files (images, audio). Asset delivery optimization (e.g., lazy loading, compression) is recommended for a production deployment.
- **Artifacts:**
    - `starfarer_obf_v2.jar`: Contains the binary patches.
    - `settings.json`: Sanitized configuration.
    - `starsector_launch.js`: The CheerpJ initialization script.
    - `lwjgl.js`: The native emulation layer.

## How to Run
1.  Serve the project root with a web server (e.g., `python3 -m http.server 8000`).
2.  Navigate to `http://localhost:8000/starsector.html`.
3.  Wait for the "LWJGL SCRIPT RUNNING" log and subsequent asset loading.

**Note:** Ensure `starfarer_obf_v2.jar` is never overwritten by a clean copy without re-applying the patches, as this will reintroduce the startup crashes.
