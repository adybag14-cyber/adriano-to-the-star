(function() {
    let lastExportTime = 0;

    function collectFairnessMetrics(limit = 200) {
        let events = [];
        try {
            if (Array.isArray(window.aiUsageEvents)) {
                events = window.aiUsageEvents.slice(-limit);
            } else if (window.aiUsageLogger && typeof window.aiUsageLogger.getRecent === 'function') {
                events = window.aiUsageLogger.getRecent(limit);
            }
        } catch (e) {
            events = [];
        }

        const fairnessEvents = events.filter(e => e && e.context && e.context.fairness);

        const byFeature = {};
        const bySeverity = {};

        fairnessEvents.forEach(e => {
            const feature = e.feature || 'unknown';
            const fairness = e.context.fairness || {};
            const severity = fairness.severity || 'unknown';

            if (!byFeature[feature]) {
                byFeature[feature] = { count: 0 };
            }
            byFeature[feature].count += 1;

            if (!bySeverity[severity]) {
                bySeverity[severity] = 0;
            }
            bySeverity[severity] += 1;
        });

        return {
            collectedAt: new Date().toISOString(),
            url: window.location && window.location.href,
            totalEventsScanned: events.length,
            totalFairnessEvents: fairnessEvents.length,
            byFeature,
            bySeverity,
            recentFairnessEvents: fairnessEvents.slice(-50)
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

    window.exportFairnessMetrics = function exportFairnessMetrics() {
        const now = Date.now();
        if (now - lastExportTime < 10000) {
            console.warn('Fairness metrics export is rate-limited to once every 10 seconds.');
            return;
        }
        lastExportTime = now;
        const data = collectFairnessMetrics();
        downloadJSON('fairness-report.json', data);
        console.log('✅ Fairness metrics export started');
    };
})();
