(function(){
    window.showPerformanceSummary = window.showPerformanceSummary || function(limit = 10){
        const info = {};
        if (window.performanceMonitor && typeof window.performanceMonitor.getMetrics === 'function'){
            info.rum = window.performanceMonitor.getMetrics();
        }
        if (window.coreWebVitalsMonitoring && typeof window.coreWebVitalsMonitoring.getMetrics === 'function'){
            info.webVitals = window.coreWebVitalsMonitoring.getMetrics();
        }
        info.budgetBreaches = window.performanceBudgetBreaches || [];
        console.log('📊 Performance Summary:', {
            url: window.location.href,
            rumMetricKeys: info.rum ? Object.keys(info.rum) : [],
            webVitals: info.webVitals || {},
            recentBudgetBreaches: info.budgetBreaches.slice(-limit)
        });
        return info;
    };
})();
