/**
 * Capacity Planning
 * Capacity planning and resource forecasting
 */

class CapacityPlanning {
    constructor() {
        this.plans = new Map();
        this.forecasts = new Map();
        this.init();
    }

    init() {
        this.trackEvent('capacity_initialized');
    }

    createPlan(planId, planData) {
        const plan = {
            id: planId,
            ...planData,
            name: planData.name || planId,
            resources: planData.resources || {},
            growthRate: planData.growthRate || 0.1,
            timeframe: planData.timeframe || 12,
            createdAt: new Date()
        };
        
        this.plans.set(planId, plan);
        console.log(`Capacity plan created: ${planId}`);
        return plan;
    }

    forecastCapacity(planId, months = 12) {
        const plan = this.plans.get(planId);
        if (!plan) {
            throw new Error('Plan not found');
        }
        
        const forecast = {
            id: `forecast_${Date.now()}`,
            planId,
            projections: [],
            createdAt: new Date()
        };
        
        const currentResources = { ...plan.resources };
        
        for (let month = 1; month <= months; month++) {
            const projection = {};
            
            Object.keys(currentResources).forEach(resource => {
                const current = currentResources[resource];
                const projected = current * Math.pow(1 + plan.growthRate, month);
                projection[resource] = {
                    current,
                    projected,
                    growth: projected - current
                };
            });
            
            forecast.projections.push({
                month,
                resources: projection
            });
        }
        
        this.forecasts.set(forecast.id, forecast);
        
        return forecast;
    }

    calculateRequirements(planId, targetCapacity) {
        const plan = this.plans.get(planId);
        if (!plan) {
            throw new Error('Plan not found');
        }
        
        const requirements = {};
        
        Object.keys(plan.resources).forEach(resource => {
            const current = plan.resources[resource];
            const required = targetCapacity / current;
            requirements[resource] = {
                current,
                required,
                multiplier: required
            };
        });
        
        return requirements;
    }

    getPlan(planId) {
        return this.plans.get(planId);
    }

    getForecast(forecastId) {
        return this.forecasts.get(forecastId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`capacity_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.capacityPlanning = new CapacityPlanning();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CapacityPlanning;
}


