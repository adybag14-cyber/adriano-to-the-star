/**
 * Revenue Analysis
 * Analyzes revenue data
 */

class RevenueAnalysis {
    constructor() {
        this.revenue = [];
        this.analyses = [];
        this.init();
    }

    init() {
        this.trackEvent('r_ev_en_ue_an_al_ys_is_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ev_en_ue_an_al_ys_is_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    recordRevenue(amount, source, date = new Date()) {
        const record = {
            id: `rev_${Date.now()}`,
            amount,
            source,
            date,
            recordedAt: new Date()
        };
        
        this.revenue.push(record);
        return record;
    }

    analyzeRevenue(period) {
        const data = this.getRevenueForPeriod(period);
        
        const analysis = {
            period,
            total: data.reduce((sum, r) => sum + r.amount, 0),
            bySource: this.groupBySource(data),
            trend: this.calculateTrend(data),
            average: data.length > 0 ? 
                data.reduce((sum, r) => sum + r.amount, 0) / data.length : 0,
            analyzedAt: new Date()
        };

        this.analyses.push(analysis);
        return analysis;
    }

    getRevenueForPeriod(period) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - period.days);
        
        return this.revenue.filter(r => r.date >= cutoff);
    }

    groupBySource(data) {
        const grouped = {};
        data.forEach(record => {
            grouped[record.source] = (grouped[record.source] || 0) + record.amount;
        });
        return grouped;
    }

    calculateTrend(data) {
        if (data.length < 2) return 'insufficient_data';
        
        const sorted = data.sort((a, b) => a.date - b.date);
        const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
        const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, r) => sum + r.amount, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, r) => sum + r.amount, 0) / secondHalf.length;
        
        if (secondAvg > firstAvg * 1.1) return 'increasing';
        if (secondAvg < firstAvg * 0.9) return 'decreasing';
        return 'stable';
    }

    forecastRevenue(periods = 7) {
        const recent = this.revenue.slice(-30);
        const daily = this.groupByDay(recent);
        const avgDaily = Object.values(daily).reduce((sum, val) => sum + val, 0) / Object.keys(daily).length;
        
        return Array.from({ length: periods }, (_, i) => ({
            date: new Date(Date.now() + (i + 1) * 86400000),
            forecasted: Math.round(avgDaily * 100) / 100
        }));
    }

    groupByDay(data) {
        const grouped = {};
        data.forEach(record => {
            const day = record.date.toDateString();
            grouped[day] = (grouped[day] || 0) + record.amount;
        });
        return grouped;
    }
}

// Auto-initialize
const revenueAnalysis = new RevenueAnalysis();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RevenueAnalysis;
}


