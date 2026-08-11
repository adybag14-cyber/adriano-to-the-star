/**
 * Cost Optimization
 * Cost analysis and optimization recommendations
 */

class CostOptimization {
    constructor() {
        this.costs = new Map();
        this.analyses = new Map();
        this.recommendations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cost_optimization_initialized');
    }

    recordCost(costId, costData) {
        const cost = {
            id: costId,
            ...costData,
            service: costData.service || '',
            resource: costData.resource || '',
            amount: costData.amount || 0,
            period: costData.period || 'monthly',
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.costs.set(costId, cost);
        return cost;
    }

    analyzeCosts(service = null, startDate = null, endDate = null) {
        let costs = Array.from(this.costs.values());
        
        if (service) {
            costs = costs.filter(c => c.service === service);
        }
        
        if (startDate) {
            costs = costs.filter(c => c.timestamp >= startDate);
        }
        
        if (endDate) {
            costs = costs.filter(c => c.timestamp <= endDate);
        }
        
        const totalCost = costs.reduce((sum, c) => sum + c.amount, 0);
        const byService = {};
        
        costs.forEach(cost => {
            if (!byService[cost.service]) {
                byService[cost.service] = 0;
            }
            byService[cost.service] += cost.amount;
        });
        
        const analysis = {
            id: `analysis_${Date.now()}`,
            totalCost,
            costCount: costs.length,
            byService,
            recommendations: this.generateRecommendations(costs),
            analyzedAt: new Date(),
            createdAt: new Date()
        };
        
        this.analyses.set(analysis.id, analysis);
        
        return analysis;
    }

    generateRecommendations(costs) {
        const recommendations = [];
        
        const byService = {};
        costs.forEach(cost => {
            if (!byService[cost.service]) {
                byService[cost.service] = 0;
            }
            byService[cost.service] += cost.amount;
        });
        
        Object.keys(byService).forEach(service => {
            if (byService[service] > 1000) {
                recommendations.push({
                    service,
                    action: 'Review usage and consider reserved instances',
                    potentialSavings: byService[service] * 0.2
                });
            }
        });
        
        return recommendations;
    }

    getCosts(service = null) {
        if (service) {
            return Array.from(this.costs.values())
                .filter(c => c.service === service);
        }
        return Array.from(this.costs.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cost_optimization_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.costOptimization = new CostOptimization();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CostOptimization;
}


