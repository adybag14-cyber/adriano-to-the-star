# Starsector Checkpoint & Memory Backup
**Date:** Thursday, 8 January 2026
**Created By:** Gemini CLI Agent

## 1. Permanent Memory Backup
*If the agent's memory is lost, please restore these rules to `.gemini/GEMINI.md` or instruct the agent to "remember" them.*

### Core Process Safety Rules
- **When managing Node.js processes on this system:**
  1. Never terminate the agent's own process.
  2. Always manually verify PIDs before killing a process to ensure it is the target and not the agent.
  3. Use `curl` to verify if servers are online.

### Session-Added Memory
- "When restarting the node server, do not kill the agent's own node process. Always verify the target PID."

---

## 2. Starsector Work Checkpoint

### Current Objective
Fix `range_server.cjs` to serve files with correct MIME types, ensuring `starsector.html` renders in the browser instead of triggering a download.

### Status: SUCCESS
- **File Modified:** `range_server.cjs`
  - **Change:** Implemented a `mimeTypes` lookup map (supporting .html, .js, .css, .png, etc.) to set the `Content-Type` header dynamically based on file extension.
  - **Previous State:** Defaulted everything to `application/octet-stream`, causing downloads.
- **Server Status:**
  - Running on **Port 8000**.
  - **Process Safety:** Verified running as a separate process (PID confirmed safe) to avoid killing the agent.
- **Verification:**
  - `starsector.html` is now served with `Content-Type: text/html`.
  - Confirmed via `Invoke-WebRequest -Method Head`.

### Key Files
- `range_server.cjs`: The custom Node.js HTTP server.
- `starsector.html`: The main entry point for the application.
