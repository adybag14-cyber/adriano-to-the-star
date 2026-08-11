/**
 * Competitive Analysis
 * Analyzes competitive data
 */

class CompetitiveAnalysis {
    constructor() {
        this.competitors = [];
        this.metrics = new Map();
        this.init();
    }

    init() {
        this.trackEvent('competitive_analysis_initialized');
    }

    addCompetitor(competitorId, name, data) {
        const competitor = {
            id: competitorId,
            name,
            data,
            addedAt: new Date()
        };
        
        this.competitors.push(competitor);
        return competitor;
    }

    compareMetrics(metricName) {
        const comparisons = this.competitors.map(competitor => ({
            competitor: competitor.name,
            value: competitor.data[metricName] || 0
        }));

        const sorted = comparisons.sort((a, b) => b.value - a.value);
        const average = comparisons.reduce((sum, c) => sum + c.value, 0) / comparisons.length;

        return {
            metricName,
            comparisons: sorted,
            average: Math.round(average * 100) / 100,
            leader: sorted[0]
        };
    }

    getMarketPosition(metricName, ourValue) {
        const comparison = this.compareMetrics(metricName);
        const position = comparison.comparisons.findIndex(c => c.value <= ourValue) + 1;
        const total = comparison.comparisons.length;

        return {
            position,
            total,
            percentile: Math.round(((total - position) / total) * 100),
            aboveAverage: ourValue > comparison.average
        };
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`competitive_analysis_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const competitiveAnalysis = new CompetitiveAnalysis();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CompetitiveAnalysis;
}


