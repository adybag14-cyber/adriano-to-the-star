/**
 * Advanced Debug System - Always Active
 * 
 * This runs FIRST and captures ALL errors, even if page is blocked.
 * Ensures console always shows what's wrong.
 */

(function() {
    'use strict';

    // Create debug overlay that's always visible
    const debugOverlay = document.createElement('div');
    debugOverlay.id = 'debug-overlay';
    debugOverlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 200px !important;
        background: rgba(0, 0, 0, 0.95) !important;
        color: #0f0 !important;
        font-family: 'Courier New', monospace !important;
        font-size: 12px !important;
        padding: 10px !important;
        overflow-y: auto !important;
        z-index: 999999 !important;
        pointer-events: auto !important;
        border-bottom: 2px solid #0f0 !important;
    `;
    
    // Try to add to body, if not available, add to head
    if (document.body) {
        document.body.appendChild(debugOverlay);
    } else {
        document.head.appendChild(debugOverlay);
        // Move to body when available
        const observer = new MutationObserver(() => {
            if (document.body && debugOverlay.parentNode !== document.body) {
                document.body.appendChild(debugOverlay);
            }
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    const log = (message, type = 'log') => {
        const timestamp = new Date().toLocaleTimeString();
        const colors = {
            log: '#0f0',
            warn: '#ff0',
            error: '#f00',
            info: '#0ff'
        };
        const color = colors[type] || '#0f0';
        
        const line = document.createElement('div');
        line.style.cssText = `color: ${color} !important; margin: 2px 0 !important; white-space: pre-wrap !important;`;
        line.textContent = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
        debugOverlay.appendChild(line);
        debugOverlay.scrollTop = debugOverlay.scrollHeight;
        
        // Also log to console
        const consoleMethod = console[type] || console.log;
        consoleMethod(`[DEBUG] ${message}`);
    };

    // Override console methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalInfo = console.info;

    console.log = function(...args) {
        originalLog.apply(console, args);
        log(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '), 'log');
    };

    console.warn = function(...args) {
        originalWarn.apply(console, args);
        log(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '), 'warn');
    };

    console.error = function(...args) {
        originalError.apply(console, args);
        log(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '), 'error');
    };

    console.info = function(...args) {
        originalInfo.apply(console, args);
        log(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '), 'info');
    };

    // Global error handler
    window.addEventListener('error', (event) => {
        log(`ERROR: ${event.message} at ${event.filename}:${event.lineno}:${event.colno}`, 'error');
        if (event.error) {
            log(`Stack: ${event.error.stack}`, 'error');
        }
    }, true);

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
        log(`UNHANDLED PROMISE REJECTION: ${event.reason}`, 'error');
        if (event.reason && event.reason.stack) {
            log(`Stack: ${event.reason.stack}`, 'error');
        }
    });

    // Script load tracking
    const scripts = document.querySelectorAll('script[src]');
    log(`Found ${scripts.length} scripts to load`);
    scripts.forEach((script, index) => {
        log(`Script ${index + 1}: ${script.src} (defer: ${script.defer}, async: ${script.async})`);
        
        script.addEventListener('load', () => {
            log(`✅ Loaded: ${script.src}`, 'info');
        });
        
        script.addEventListener('error', () => {
            log(`❌ Failed to load: ${script.src}`, 'error');
        });
    });

    // CSS load tracking
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    log(`Found ${stylesheets.length} stylesheets to load`);
    stylesheets.forEach((link, index) => {
        log(`Stylesheet ${index + 1}: ${link.href}`);
        
        link.addEventListener('load', () => {
            log(`✅ Loaded CSS: ${link.href}`, 'info');
        });
        
        link.addEventListener('error', () => {
            log(`❌ Failed to load CSS: ${link.href}`, 'error');
        });
    });

    // Page state monitoring
    const checkPageState = () => {
        const state = {
            readyState: document.readyState,
            bodyExists: !!document.body,
            bodyOverflow: document.body ? getComputedStyle(document.body).overflow : 'N/A',
            htmlOverflow: getComputedStyle(document.documentElement).overflow,
            bodyPointerEvents: document.body ? getComputedStyle(document.body).pointerEvents : 'N/A',
            loaderExists: !!document.getElementById('space-loader'),
            loaderDisplay: document.getElementById('space-loader') ? 
                getComputedStyle(document.getElementById('space-loader')).display : 'N/A',
            bodyLoaded: document.body ? document.body.classList.contains('loaded') : false
        };
        log(`Page State: ${JSON.stringify(state, null, 2)}`, 'info');
    };

    // Check page state periodically
    setInterval(checkPageState, 2000);
    checkPageState();

    // Monitor for blocking elements
    const checkBlockingElements = () => {
        const blocking = [];
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            const style = getComputedStyle(el);
            if (
                style.position === 'fixed' &&
                (style.width === '100%' || style.width === '100vw') &&
                (style.height === '100%' || style.height === '100vh') &&
                style.pointerEvents !== 'none' &&
                style.display !== 'none' &&
                style.zIndex > 1000
            ) {
                blocking.push({
                    id: el.id,
                    class: el.className,
                    zIndex: style.zIndex,
                    pointerEvents: style.pointerEvents
                });
            }
        });
        
        if (blocking.length > 0) {
            log(`⚠️ BLOCKING ELEMENTS FOUND: ${JSON.stringify(blocking, null, 2)}`, 'warn');
        }
    };

    setInterval(checkBlockingElements, 3000);
    checkBlockingElements();

    // Log initialization
    log('🔍 DEBUG SYSTEM INITIALIZED', 'info');
    log(`Document ready state: ${document.readyState}`, 'info');
    log(`Body exists: ${!!document.body}`, 'info');
    log(`Window loaded: ${window.performance.timing.loadEventEnd > 0}`, 'info');

    // Export debug functions
    window.debugSystem = {
        log,
        checkPageState,
        checkBlockingElements,
        clear: () => {
            debugOverlay.innerHTML = '';
            log('Debug log cleared', 'info');
        }
    };

    log('✅ Debug system ready - all errors will be logged', 'info');

    // Telemetry tracking
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric('debug_system_initialized', 1, {});
        }
    } catch (e) { /* Silent fail */ }

    window.debugSystem.trackEvent = function(eventName, data) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`debug_system_${eventName}`, 1, data || {});
            }
        } catch (e) { /* Silent fail */ }
    };
})();

