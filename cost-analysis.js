/**
 * Cost Analysis
 * Analyzes costs and expenses
 */

class CostAnalysis {
    constructor() {
        this.costs = [];
        this.analyses = [];
        this.init();
    }

    init() {
        this.trackEvent('cost_analysis_initialized');
    }

    recordCost(amount, category, date = new Date()) {
        const record = {
            id: `cost_${Date.now()}`,
            amount,
            category,
            date,
            recordedAt: new Date()
        };
        
        this.costs.push(record);
        return record;
    }

    analyzeCosts(period) {
        const data = this.getCostsForPeriod(period);
        
        const analysis = {
            period,
            total: data.reduce((sum, c) => sum + c.amount, 0),
            byCategory: this.groupByCategory(data),
            trend: this.calculateTrend(data),
            average: data.length > 0 ? 
                data.reduce((sum, c) => sum + c.amount, 0) / data.length : 0,
            analyzedAt: new Date()
        };

        this.analyses.push(analysis);
        return analysis;
    }

    getCostsForPeriod(period) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - period.days);
        
        return this.costs.filter(c => c.date >= cutoff);
    }

    groupByCategory(data) {
        const grouped = {};
        data.forEach(record => {
            grouped[record.category] = (grouped[record.category] || 0) + record.amount;
        });
        return grouped;
    }

    calculateTrend(data) {
        if (data.length < 2) return 'insufficient_data';
        
        const sorted = data.sort((a, b) => a.date - b.date);
        const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
        const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, c) => sum + c.amount, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, c) => sum + c.amount, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg * 1.1) return 'increasing';
        if (secondAvg < firstAvg * 0.9) return 'decreasing';
        return 'stable';
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cost_analysis_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const costAnalysis = new CostAnalysis();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CostAnalysis;
}


