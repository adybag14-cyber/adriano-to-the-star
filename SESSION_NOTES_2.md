# Session Notes: CheerpJ Proxy Debugging (Session 2)

## Date
January 14, 2026

## Objective
Debug why the CDN proxy logic in `custom_server_fixed.py` is not intercepting `cj3.js` requests, preventing the patch from being applied.

## Current Status
- **Server**: Running on port 8000
- **Issue**: Browser requesting `http://localhost:8000/cjrtnc.leaningtech.com/4.2/cj3.js` (CDN path) instead of `http://localhost:8000/cheerpj/4.2/cj3.js` (proxy path)
- **Result**: 404 error for `cj3.js`, patch not applied
- **Console log summary**: `saw_missing_import_pipe2=false`, `saw_cj3_shim_pipe2=false`

## Key Findings

### Import Statement Analysis
- **File**: `public/starsector.html`
- **Line 700**: `import { cheerpjInit, cheerpjRunMain, cheerpjRunJar, cjFileBlob } from "/cheerpj/4.2/cj3.js";`
- **Status**: ✅ Correct - uses proxy path `/cheerpj/4.2/cj3.js`

### Browser Request Behavior
- **Expected request**: `http://localhost:8000/cheerp/4.2/cj3.js`
- **Actual request**: `http://localhost:8000/cjrtnc.leaningtech.com/4.2/cj3.js`
- **Problem**: Import path is being rewritten from `/cheerpj/4.2/cj3.js` to `/cjrtnc.leaningtech.com/4.2/cj3.js`

### Server Debug Analysis
- **Debug logging added**: Both `do_GET` and `log_message` methods now log all requests
- **Successful requests** (e.g., `/starsector.html`, `/cheerpj-natives/natives/javajpeg.js`):
  - ✅ `DEBUG: do_GET called with path: <path>`
  - ✅ `DEBUG: log_message called: "GET <path> HTTP/1.1" 200 -`
- **CDN path request** (`/cjrtnc.leaningtech.com/4.2/cj3.js`):
  - ❌ No `DEBUG: do_GET called` message
  - ❌ No `DEBUG: log_message called` message
  - ❌ But console shows 404 response

### Import Map Investigation
- **Result**: No import map found in `starsector.html`
- **Search terms**: `importmap`, `type="importmap"`
- **Status**: ❌ Not the cause

### Loader.js Analysis
- **File**: `cheerpj/4.2/loader.js`
- **Content**: Stub file with dummy implementations of `cheerpjInit`, `cheerpjCreateDisplay`, `cheerpjRunMain`
- **Status**: ❌ Not the cause - doesn't rewrite paths

## Hypothesis
The import path `/cheerpj/4.2/cj3.js` is being rewritten to `/cjrtnc.leaningtech.com/4.2/cj3.js` by some mechanism that hasn't been identified yet. Possible causes:

1. **CheerpJ internal module resolution**: The `cj3.js` file itself might contain logic that rewrites import paths
2. **Browser module loader**: The browser's ES module loader might be resolving the path differently
3. **Hidden import map**: There might be an import map in a different file or dynamically generated
4. **Service worker**: A service worker might be intercepting and rewriting requests
5. **Browser extension**: A browser extension might be modifying module imports

## Next Steps
1. Check if there's a `cj3.js` file in the `cheerpj/4.2/` directory that might contain path rewriting logic
2. Check for any service worker files in the project
3. Check for any dynamically generated import maps
4. Investigate if the browser's module loader is resolving the path differently
5. Consider using a network capture tool to see the exact request/response flow

## Files Modified
- `custom_server_fixed.py`:
  - Added debug logging to `log_message` method
  - Added debug logging to `do_GET` method
  - Server port: 8000

## Files Analyzed
- `public/starsector.html`: Import statement at line 700
- `cheerpj/4.2/loader.js`: Stub file
- `test-results/starsector-console-Starsec-9f8d3-ures-console-logs-to-a-file/starsector-console.log`: Console logs showing 404 errors

## Server Debug Output (Latest)
```
DEBUG: do_GET called with path: /starsector.html
DEBUG: log_message called: "GET /starsector.html HTTP/1.1" 200 -
DEBUG: do_GET called with path: /cheerpj-natives/natives/javajpeg.js
DEBUG: log_message called: "GET /cheerpj-natives/natives/javajpeg.js HTTP/1.1" 200 -
DEBUG: do_GET called with path: /cheerpj-natives/natives/lwjgl.js?v=debug52
DEBUG: do_GET called with path: /universal-simulation-hub.js
...
```

**Note**: No debug output for `/cjrtnc.leaningtech.com/4.2/cj3.js` request

## Console Log Summary (Latest)
```
[2026-01-14T18:58:42.752Z] response: 404 http://localhost:8000/cjrtnc.leaningtech.com/4.2/cj3.js
[2026-01-14T18:58:42.752Z] console.error: Failed to load resource: the server responded with a status of 404 (Not Found) @ http://localhost:8000/cjrtnc.leaningtech.com/4.2/cj3.js:0:0
[2026-01-14T18:58:42.753Z] requestfailed: GET http://localhost:8000/cjrtnc.leaningtech.com/4.2/cj3.js net::ERR_ABORTED
...
[2026-01-14T18:59:42.899Z] summary: saw_missing_import_pipe2=false saw_cj3_shim_pipe2=false requests_to_8100=0 final_url=http://localhost:8000/starsector.html final_origin=http://localhost:8000 expected_origin=http://localhost:8000
```

## Conclusion
The import path rewriting is happening at a level that hasn't been identified yet. The server is not receiving the request to `/cjrtnc.leaningtech.com/4.2/cj3.js`, which suggests the path is being rewritten before the request reaches the server, or the request is being handled by a different mechanism.

The proxy logic in `custom_server_fixed.py` is correctly implemented and should work if the request reaches it with the correct path.
