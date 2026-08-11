/**
 * Customer Analysis
 * Analyzes customer data and behavior
 */

class CustomerAnalysis {
    constructor() {
        this.customers = [];
        this.segments = new Map();
        this.init();
    }

    init() {
        this.trackEvent('c_us_to_me_ra_na_ly_si_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("c_us_to_me_ra_na_ly_si_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    addCustomer(customerId, data) {
        const customer = {
            id: customerId,
            ...data,
            addedAt: new Date()
        };
        
        this.customers.push(customer);
        return customer;
    }

    analyzeCustomers() {
        return {
            total: this.customers.length,
            bySegment: this.analyzeBySegment(),
            lifetimeValue: this.calculateLTV(),
            churnRisk: this.assessChurnRisk(),
            topCustomers: this.getTopCustomers()
        };
    }

    analyzeBySegment() {
        const segments = {};
        this.customers.forEach(customer => {
            const segment = customer.segment || 'unsegmented';
            segments[segment] = (segments[segment] || 0) + 1;
        });
        return segments;
    }

    calculateLTV() {
        // Simplified LTV calculation
        const avgOrderValue = 100;
        const avgOrdersPerYear = 4;
        const avgLifespan = 3;
        
        return avgOrderValue * avgOrdersPerYear * avgLifespan;
    }

    assessChurnRisk() {
        return {
            high: this.customers.filter(c => c.lastActivity < 30).length,
            medium: this.customers.filter(c => c.lastActivity >= 30 && c.lastActivity < 90).length,
            low: this.customers.filter(c => c.lastActivity >= 90).length
        };
    }

    getTopCustomers(limit = 10) {
        return this.customers
            .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
            .slice(0, limit);
    }
}

// Auto-initialize
const customerAnalysis = new CustomerAnalysis();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomerAnalysis;
}


