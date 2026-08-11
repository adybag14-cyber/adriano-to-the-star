You are the Gemini CLI agent. I am restoring you after an update/reset.

**1. RESTORE MEMORY:**
Please immediately save the following facts to your permanent long-term memory using your `save_memory` tool. These are CRITICAL safety rules:

*   "When managing Node.js processes on this system: 1. Never terminate the agent's own process. 2. Always manually verify PIDs before killing a process to ensure it is the target and not the agent. 3. Use curl to verify if servers are online."
*   "When restarting the node server, do not kill the agent's own node process. Always verify the target PID."

**2. RESTORE CONTEXT (Starsector Work):**
We were working on `starsector.html` and `range_server.cjs`.
*   **Accomplished:** We fixed `range_server.cjs` to serve files with the correct MIME types (specifically `text/html` for .html files) instead of `application/octet-stream`. This stopped the browser from downloading the file instead of rendering it.
*   **Current State:** The server is running on port 8000. `starsector.html` is serving correctly with `Content-Type: text/html`.

**3. NEXT STEPS (Continue Debugging):**
Please resume debugging `starsector.html`.
1.  Verify the server is still running on port 8000 and serving `starsector.html` correctly.
2.  Open `starsector.html` in a browser (or simulate it) to check for any runtime errors in the console.
3.  Continue with the original goal of ensuring the application loads and functions correctly.
