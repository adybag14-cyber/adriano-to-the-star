/**
 * Order History v2
 * Advanced order history system
 */

class OrderHistoryV2 {
    constructor() {
        this.histories = new Map();
        this.records = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Order History v2 initialized' };
    }

    recordOrder(orderId, customerId, items, total) {
        const record = {
            orderId,
            customerId,
            items,
            total,
            timestamp: new Date()
        };
        this.records.push(record);
        if (!this.histories.has(customerId)) {
            this.histories.set(customerId, []);
        }
        this.histories.get(customerId).push(record);
        return record;
    }

    getHistory(customerId, limit) {
        if (limit < 1) {
            throw new Error('Limit must be at least 1');
        }
        const history = this.histories.get(customerId) || [];
        return history
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderHistoryV2;
}

