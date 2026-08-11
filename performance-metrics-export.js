(function() {
    let lastExportTime = 0;

    function collectMetrics() {
        const rumMetrics = (window.performanceMonitor && typeof window.performanceMonitor.getMetrics === 'function')
            ? window.performanceMonitor.getMetrics()
            : null;

        const webVitalsMetrics = (window.coreWebVitalsMonitoring && typeof window.coreWebVitalsMonitoring.getMetrics === 'function')
            ? window.coreWebVitalsMonitoring.getMetrics()
            : null;

        const budgetBreaches = window.performanceBudgetBreaches || [];

        return {
            collectedAt: new Date().toISOString(),
            url: window.location.href,
            rumMetrics,
            webVitalsMetrics,
            budgetBreaches
        };
    }

    function downloadJSON(filename, data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    window.exportPerformanceMetrics = function exportPerformanceMetrics() {
        const now = Date.now();
        if (now - lastExportTime < 10000) {
            console.warn('Performance metrics export is rate-limited to once every 10 seconds.');
            return;
        }
        lastExportTime = now;
        const data = collectMetrics();
        downloadJSON('performance-report.json', data);
        console.log('✅ Performance metrics export started');
    };
})();
