(function () {
    // Create debug overlay
    const overlay = document.createElement('div');
    overlay.id = 'debug-overlay';
    overlay.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;height:200px;background:rgba(0,0,0,0.8);color:#0f0;font-family:monospace;font-size:12px;overflow-y:auto;z-index:999999;pointer-events:none;padding:10px;border-top:2px solid #0f0;';
    document.body.appendChild(overlay);

    // Override console methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    function logToOverlay(type, args) {
        const msg = Array.from(args).map(arg => {
            try {
                return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
            } catch (e) {
                return '[Circular/Error]';
            }
        }).join(' ');

        const line = document.createElement('div');
        line.style.marginBottom = '2px';
        if (type === 'error') line.style.color = '#f00';
        if (type === 'warn') line.style.color = '#ff0';
        line.textContent = '[' + type.toUpperCase() + '] ' + msg;
        overlay.appendChild(line);

        // Limit number of logs to prevent memory leaks
        while (overlay.children.length > 100) {
            overlay.removeChild(overlay.firstChild);
        }

        overlay.scrollTop = overlay.scrollHeight;
    }

    console.log = function () { originalLog.apply(console, arguments); logToOverlay('log', arguments); };
    console.warn = function () { originalWarn.apply(console, arguments); logToOverlay('warn', arguments); };
    console.error = function () { originalError.apply(console, arguments); logToOverlay('error', arguments); };

    // Telemetry tracking
    try {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric('debug_logger_initialized', 1, {});
        }
    } catch (e) { /* Silent fail */ }

    // Track event helper
    window.debugLoggerTrackEvent = function(eventName, data) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`debug_logger_${eventName}`, 1, data || {});
            }
        } catch (e) { /* Silent fail */ }
    };
})();
