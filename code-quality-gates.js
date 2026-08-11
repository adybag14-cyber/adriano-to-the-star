/**
 * Code Quality Gates
 * Code quality gates in CI/CD
 */

class CodeQualityGates {
    constructor() {
        this.gates = new Map();
        this.checks = new Map();
        this.metrics = new Map();
        this.init();
    }

    init() {
        this.trackEvent('code_quality_gates_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`code_quality_gates_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createGate(gateId, gateData) {
        const gate = {
            id: gateId,
            ...gateData,
            name: gateData.name || gateId,
            thresholds: gateData.thresholds || {},
            status: 'active',
            createdAt: new Date()
        };
        
        this.gates.set(gateId, gate);
        return gate;
    }

    async check(gateId, metrics) {
        const gate = this.gates.get(gateId);
        if (!gate) {
            throw new Error(`Gate ${gateId} not found`);
        }

        const check = {
            id: `check_${Date.now()}`,
            gateId,
            metrics,
            passed: this.evaluateGate(gate, metrics),
            timestamp: new Date()
        };

        this.checks.set(check.id, check);
        return check;
    }

    evaluateGate(gate, metrics) {
        return Object.keys(gate.thresholds).every(key => {
            return (metrics[key] || 0) >= gate.thresholds[key];
        });
    }

    getGate(gateId) {
        return this.gates.get(gateId);
    }

    getAllGates() {
        return Array.from(this.gates.values());
    }
}

module.exports = CodeQualityGates;

