/**
 * Order Modification v2
 * Advanced order modification system
 */

class OrderModificationV2 {
    constructor() {
        this.modifications = new Map();
        this.rules = new Map();
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Order Modification v2 initialized' };
    }

    createRule(name, allowedChanges) {
        if (!Array.isArray(allowedChanges)) {
            throw new Error('Allowed changes must be an array');
        }
        const rule = {
            id: Date.now().toString(),
            name,
            allowedChanges,
            createdAt: new Date(),
            active: true
        };
        this.rules.set(rule.id, rule);
        return rule;
    }

    modifyOrder(orderId, changes, ruleId) {
        const rule = this.rules.get(ruleId);
        if (!rule || !rule.active) {
            throw new Error('Rule not found or inactive');
        }
        const invalidChanges = Object.keys(changes).filter(change => !rule.allowedChanges.includes(change));
        if (invalidChanges.length > 0) {
            throw new Error(`Changes not allowed: ${invalidChanges.join(', ')}`);
        }
        const modification = {
            id: Date.now().toString(),
            orderId,
            changes,
            ruleId,
            modifiedAt: new Date()
        };
        this.modifications.set(modification.id, modification);
        return modification;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderModificationV2;
}

