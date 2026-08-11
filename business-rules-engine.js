/**
 * Business Rules Engine
 * Enterprise business rules management and execution
 */

class BusinessRulesEngine {
    constructor() {
        this.rulesets = new Map();
        this.rules = new Map();
        this.executions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('biz_rules_eng_initialized');
    }

    createRuleset(rulesetId, rulesetData) {
        const ruleset = {
            id: rulesetId,
            ...rulesetData,
            name: rulesetData.name || rulesetId,
            rules: [],
            version: rulesetData.version || '1.0.0',
            enabled: rulesetData.enabled !== false,
            createdAt: new Date()
        };

        this.rulesets.set(rulesetId, ruleset);
        console.log(`Business ruleset created: ${rulesetId}`);
        return ruleset;
    }

    createRule(rulesetId, ruleId, ruleData) {
        const ruleset = this.rulesets.get(rulesetId);
        if (!ruleset) {
            throw new Error('Ruleset not found');
        }

        const rule = {
            id: ruleId,
            rulesetId,
            ...ruleData,
            name: ruleData.name || ruleId,
            condition: ruleData.condition || '',
            action: ruleData.action || '',
            priority: ruleData.priority || 0,
            enabled: ruleData.enabled !== false,
            createdAt: new Date()
        };

        this.rules.set(ruleId, rule);
        ruleset.rules.push(ruleId);

        return rule;
    }

    async evaluate(rulesetId, context) {
        const ruleset = this.rulesets.get(rulesetId);
        if (!ruleset) {
            throw new Error('Ruleset not found');
        }

        const execution = {
            id: `execution_${Date.now()}`,
            rulesetId,
            context,
            status: 'evaluating',
            results: [],
            startedAt: new Date(),
            createdAt: new Date()
        };

        this.executions.set(execution.id, execution);

        const sortedRules = ruleset.rules
            .map(id => this.rules.get(id))
            .filter(rule => rule && rule.enabled)
            .sort((a, b) => b.priority - a.priority);

        for (const rule of sortedRules) {
            if (this.evaluateCondition(rule.condition, context)) {
                const result = {
                    ruleId: rule.id,
                    action: rule.action,
                    executed: true
                };
                execution.results.push(result);
            }
        }

        execution.status = 'completed';
        execution.completedAt = new Date();

        return execution;
    }

    evaluateCondition(condition, context) {
        if (!window.authManager?.isAdmin()) {
            console.warn('Security Block: Non-admin attempted to evaluate business rule.');
            return false;
        }

        try {
            // Use Function constructor for safer evaluation with limited context
            // eslint-disable-next-line no-new-func
            const evaluator = new Function(...Object.keys(context), `return ${condition}`);
            return evaluator(...Object.values(context));
        } catch (_e) {
            return false;
        }
    }

    getRuleset(rulesetId) {
        return this.rulesets.get(rulesetId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`biz_rules_eng_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.businessRulesEngine = new BusinessRulesEngine();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BusinessRulesEngine;
}

