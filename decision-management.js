/**
 * Decision Management
 * Decision management system
 */

class DecisionManagement {
    constructor() {
        this.decisions = new Map();
        this.models = new Map();
        this.executions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('d_ec_is_io_nm_an_ag_em_en_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_ec_is_io_nm_an_ag_em_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createDecision(decisionId, decisionData) {
        const decision = {
            id: decisionId,
            ...decisionData,
            name: decisionData.name || decisionId,
            model: decisionData.model || null,
            status: 'draft',
            createdAt: new Date()
        };
        
        this.decisions.set(decisionId, decision);
        console.log(`Decision created: ${decisionId}`);
        return decision;
    }

    createModel(modelId, modelData) {
        const model = {
            id: modelId,
            ...modelData,
            name: modelData.name || modelId,
            rules: modelData.rules || [],
            createdAt: new Date()
        };
        
        this.models.set(modelId, model);
        console.log(`Decision model created: ${modelId}`);
        return model;
    }

    async evaluate(decisionId, context) {
        const decision = this.decisions.get(decisionId);
        if (!decision) {
            throw new Error('Decision not found');
        }
        
        const model = decision.model ? this.models.get(decision.model) : null;
        
        const execution = {
            id: `execution_${Date.now()}`,
            decisionId,
            context,
            result: this.evaluateModel(model, context),
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.executions.set(execution.id, execution);
        
        return execution;
    }

    evaluateModel(model, context) {
        if (!model) {
            return { decision: 'default' };
        }
        
        for (const rule of model.rules) {
            if (this.matchesRule(rule, context)) {
                return { decision: rule.decision, rule: rule.id };
            }
        }
        
        return { decision: 'default' };
    }

    matchesRule(rule, context) {
        if (!rule.conditions) {
            return true;
        }
        
        return rule.conditions.every(condition => {
            return context[condition.field] === condition.value;
        });
    }

    getDecision(decisionId) {
        return this.decisions.get(decisionId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.decisionManagement = new DecisionManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DecisionManagement;
}

