/**
 * Customer Segmentation
 * @class CustomerSegmentation
 * @description Segments customers based on behavior, demographics, and preferences.
 */
class CustomerSegmentation {
    constructor() {
        this.segments = new Map();
        this.customers = new Map();
        this.rules = new Map();
        this.init();
    }

    init() {
        this.trackEvent('c_us_to_me_rs_eg_me_nt_at_io_n_initialized');
        this.setupDefaultSegments();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("c_us_to_me_rs_eg_me_nt_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupDefaultSegments() {
        this.segments.set('vip', {
            id: 'vip',
            name: 'VIP Customers',
            criteria: { totalSpent: { min: 5000 } }
        });

        this.segments.set('frequent', {
            id: 'frequent',
            name: 'Frequent Buyers',
            criteria: { orderCount: { min: 10 } }
        });

        this.segments.set('new', {
            id: 'new',
            name: 'New Customers',
            criteria: { daysSinceFirstOrder: { max: 30 } }
        });
    }

    /**
     * Create segment.
     * @param {string} segmentId - Segment identifier.
     * @param {object} segmentData - Segment data.
     */
    createSegment(segmentId, segmentData) {
        this.segments.set(segmentId, {
            ...segmentData,
            id: segmentId,
            name: segmentData.name,
            criteria: segmentData.criteria || {},
            createdAt: new Date()
        });
        console.log(`Segment created: ${segmentId}`);
    }

    /**
     * Assign customer to segment.
     * @param {string} customerId - Customer identifier.
     * @param {string} segmentId - Segment identifier.
     */
    assignToSegment(customerId, segmentId) {
        if (!this.customers.has(customerId)) {
            this.customers.set(customerId, {
                customerId,
                segments: []
            });
        }

        const customer = this.customers.get(customerId);
        if (!customer.segments.includes(segmentId)) {
            customer.segments.push(segmentId);
            console.log(`Customer ${customerId} assigned to segment ${segmentId}`);
        }
    }

    /**
     * Get customers in segment.
     * @param {string} segmentId - Segment identifier.
     * @returns {Array<string>} Customer IDs.
     */
    getCustomersInSegment(segmentId) {
        return Array.from(this.customers.values())
            .filter(customer => customer.segments.includes(segmentId))
            .map(customer => customer.customerId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.customerSegmentation = new CustomerSegmentation();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomerSegmentation;
}

