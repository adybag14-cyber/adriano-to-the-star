(function() {
    function getScriptBasename(src) {
        if (!src) return '';
        const parts = src.split('/');
        return parts[parts.length - 1];
    }

    function collectScriptsSummary() {
        const scripts = Array.from(document.getElementsByTagName('script'));
        return scripts.map(s => getScriptBasename(s.getAttribute('src') || '')).filter(Boolean);
    }

    function classifyPageWeight() {
        const path = (window.location && window.location.pathname) || '';
        const heavyPages = ['database.html', 'stellar-ai.html', 'dashboard.html', 'analytics-dashboard.html'];
        const basename = path.split('/').pop() || '';
        if (heavyPages.indexOf(basename) !== -1) {
            return 'heavy';
        }
        return 'light';
    }

    window.runMonitoringPlacementAudit = function runMonitoringPlacementAudit() {
        const scripts = collectScriptsSummary();
        const pageWeight = classifyPageWeight();
        const heavyMonitoringScripts = [
            'core-web-vitals-monitoring.js',
            'core-web-vitals-dashboard.js',
            'performance-budgets-system.js',
            'performance-metrics-export.js'
        ];
        const aiUsageScripts = [
            'ai-usage-logger.js'
        ];

        const presentHeavy = heavyMonitoringScripts.filter(name => scripts.indexOf(name) !== -1);
        const presentAI = aiUsageScripts.filter(name => scripts.indexOf(name) !== -1);

        console.log('🔍 Monitoring Placement Audit', {
            page: window.location && window.location.href,
            pageWeight: pageWeight,
            scripts: scripts,
            heavyMonitoringScriptsPresent: presentHeavy,
            aiUsageScriptsPresent: presentAI
        });

        if (pageWeight === 'light' && (presentHeavy.length || presentAI.length)) {
            console.warn('⚠️ Light page is loading heavy monitoring/AI usage scripts.', {
                heavyMonitoringScriptsPresent: presentHeavy,
                aiUsageScriptsPresent: presentAI
            });
        } else if (pageWeight === 'heavy' && !presentHeavy.length) {
            console.warn('ℹ️ Heavy page without core monitoring scripts detected. This may be intentional, but review if monitoring is expected here.');
        } else {
            console.log('✅ Monitoring/AI script placement looks reasonable for this page weight.');
        }
    };

    window.runRateLimitingAudit = function runRateLimitingAudit() {
        const info = {
            exportPerformanceMetricsRateLimitMs: 10000,
            fairnessExportRateLimitMs: 10000,
            hasExportPerformanceMetrics: typeof window.exportPerformanceMetrics === 'function',
            hasExportFairnessMetrics: typeof window.exportFairnessMetrics === 'function',
            enableWebVitals: typeof window.ENABLE_WEB_VITALS !== 'undefined' ? window.ENABLE_WEB_VITALS : 'unset',
            enableRUM: typeof window.ENABLE_RUM !== 'undefined' ? window.ENABLE_RUM : 'unset'
        };
        console.log('⏱️ Monitoring Rate Limiting Audit', info);
    };

    window.runAIFeaturePresenceAudit = function runAIFeaturePresenceAudit() {
        const features = {
            textClassification: !!(window.textClassification && typeof window.textClassification.classify === 'function'),
            aiUsageLogger: !!(window.aiUsageLogger && typeof window.aiUsageLogger.log === 'function'),
            aiModelBiasDetection: !!(window.aiModelBiasDetection && typeof window.aiModelBiasDetection.detectBias === 'function'),
            stellarAI: !!(window.stellarAI && typeof window.stellarAI.sendMessage === 'function'),
            aiSearchSuggestions: !!(window.aiSearchSuggestions && typeof window.aiSearchSuggestions.init === 'function'),
            naturalLanguageQueries: !!(window.naturalLanguageQueries && typeof window.naturalLanguageQueries.handleQuery === 'function'),
            computerVisionCapabilities: !!(window.computerVisionCapabilities && typeof window.computerVisionCapabilities.init === 'function')
        };

        console.log('🧭 AI Feature Presence Audit', {
            page: window.location && window.location.href,
            features: features
        });

        const missingCoreGovernance = !features.textClassification || !features.aiUsageLogger || !features.aiModelBiasDetection;
        if (missingCoreGovernance) {
            console.warn('⚠️ Some core AI governance features are missing on this page.', {
                textClassification: features.textClassification,
                aiUsageLogger: features.aiUsageLogger,
                aiModelBiasDetection: features.aiModelBiasDetection
            });
        } else {
            console.log('✅ Core AI governance features present on this page.');
        }
    };

    window.logAISafetyPostureSummary = function logAISafetyPostureSummary() {
        const features = {
            textClassification: !!(window.textClassification && typeof window.textClassification.classify === 'function'),
            aiUsageLogger: !!(window.aiUsageLogger && typeof window.aiUsageLogger.log === 'function'),
            aiModelBiasDetection: !!(window.aiModelBiasDetection && typeof window.aiModelBiasDetection.detectBias === 'function')
        };

        const coreGovernanceOk = features.textClassification && features.aiUsageLogger && features.aiModelBiasDetection;
        const page = window.location && window.location.href;

        if (coreGovernanceOk) {
            console.log('🛡️ AI safety posture: baseline governance features present on this page.', {
                page: page,
                coreGovernanceOk: coreGovernanceOk,
                features: features
            });
        } else {
            console.warn('⚠️ AI safety posture: one or more baseline governance features are missing on this page.', {
                page: page,
                coreGovernanceOk: coreGovernanceOk,
                features: features
            });
        }
    };

})();
