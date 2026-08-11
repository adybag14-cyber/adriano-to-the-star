/**
 * Business Rules Management
 * Business rules management system
 */

class BusinessRulesManagement {
    constructor() {
        this.ruleEngines = new Map();
        this.rules = new Map();
        this.executions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('biz_rules_mgmt_initialized');
    }

    createRuleEngine(engineId, engineData) {
        const engine = {
            id: engineId,
            ...engineData,
            name: engineData.name || engineId,
            rules: [],
            enabled: engineData.enabled !== false,
            createdAt: new Date()
        };
        
        this.ruleEngines.set(engineId, engine);
        console.log(`Rule engine created: ${engineId}`);
        return engine;
    }

    createRule(engineId, ruleId, ruleData) {
        const engine = this.ruleEngines.get(engineId);
        if (!engine) {
            throw new Error('Rule engine not found');
        }
        
        const rule = {
            id: ruleId,
            engineId,
            ...ruleData,
            name: ruleData.name || ruleId,
            condition: ruleData.condition || {},
            action: ruleData.action || {},
            enabled: ruleData.enabled !== false,
            createdAt: new Date()
        };
        
        this.rules.set(ruleId, rule);
        engine.rules.push(ruleId);
        
        return rule;
    }

    async execute(engineId, context) {
        const engine = this.ruleEngines.get(engineId);
        if (!engine) {
            throw new Error('Rule engine not found');
        }
        
        const execution = {
            id: `execution_${Date.now()}`,
            engineId,
            context,
            results: [],
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.executions.set(execution.id, execution);
        
        for (const ruleId of engine.rules) {
            const rule = this.rules.get(ruleId);
            if (rule && rule.enabled && this.matchesCondition(rule.condition, context)) {
                execution.results.push({
                    ruleId: rule.id,
                    action: rule.action
                });
            }
        }
        
        return execution;
    }

    matchesCondition(condition, context) {
        if (!condition) {
            return true;
        }
        
        return Object.keys(condition).every(key => {
            return context[key] === condition[key];
        });
    }

    getRuleEngine(engineId) {
        return this.ruleEngines.get(engineId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`biz_rules_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.businessRulesManagement = new BusinessRulesManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BusinessRulesManagement;
}

