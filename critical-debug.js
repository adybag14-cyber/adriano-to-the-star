/**
 * Critical Debug System
 * Runs immediately to capture early errors.
 */
try {
    (function () {
        'use strict';
        const log = (msg, type) => {
            try {
                console.log(`[DEBUG ${type || 'LOG'}] ${msg}`);
            } catch (e) { }
        };
        log('🔍 DEBUG SYSTEM STARTING', 'INFO');
        const debugOverlay = document.createElement('div');
        debugOverlay.id = 'debug-overlay';
        // Styles moved to CSS where possible, but critical inline styles kept for reliability
        debugOverlay.style.cssText = 'position:fixed!important;top:0!important;left:0!important;width:100%!important;height:200px!important;background:rgba(0,0,0,0.95)!important;color:#0f0!important;font-family:monospace!important;font-size:12px!important;padding:10px!important;overflow-y:auto!important;z-index:999999!important;pointer-events:none!important;border-bottom:2px solid #0f0!important;display:none;'; // Hidden by default, toggleable if needed

        try {
            if (document.body) {
                document.body.appendChild(debugOverlay);
            } else if (document.head) {
                document.head.appendChild(debugOverlay);
            } else {
                document.documentElement.appendChild(debugOverlay);
            }
        } catch (e) {
            log('Failed to append debug overlay: ' + e.message, 'ERROR');
        }
        const logToOverlay = (msg, type = 'log') => {
            try {
                const line = document.createElement('div');
                line.style.cssText = `color:${type === 'error' ? '#f00' : type === 'warn' ? '#ff0' : '#0f0'}!important;margin:2px 0!important;white-space:pre-wrap!important;`;
                line.textContent = `[${new Date().toLocaleTimeString()}] [${type.toUpperCase()}] ${msg}`;
                debugOverlay.appendChild(line);
                debugOverlay.scrollTop = debugOverlay.scrollHeight;
            } catch (e) {
                log('Failed to log to overlay: ' + e.message, 'ERROR');
            }
        };
        window.addEventListener('error', e => {
            log(`ERROR: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`, 'error');
            logToOverlay(`ERROR: ${e.message}`, 'error');
        }, true);
        window.addEventListener('unhandledrejection', e => {
            log(`PROMISE REJECTION: ${e.reason}`, 'error');
            logToOverlay(`PROMISE REJECTION: ${e.reason}`, 'error');
        });
        log('🔍 INLINE DEBUG SYSTEM ACTIVE', 'info');
        logToOverlay('🔍 INLINE DEBUG SYSTEM ACTIVE', 'info');
        window.debugLog = logToOverlay;
    })();
} catch (e) {
    console.error('CRITICAL: Debug system failed to initialize:', e);
}
