/**
 * Firewall Management
 * Firewall rule and policy management
 */

class FirewallManagement {
    constructor() {
        this.rules = new Map();
        this.policies = new Map();
        this.logs = new Map();
        this.init();
    }

    init() {
        this.trackEvent('f_ir_ew_al_lm_an_ag_em_en_t_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_ir_ew_al_lm_an_ag_em_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createRule(ruleId, ruleData) {
        const rule = {
            id: ruleId,
            ...ruleData,
            direction: ruleData.direction || 'inbound',
            action: ruleData.action || 'allow',
            protocol: ruleData.protocol || 'tcp',
            source: ruleData.source || 'any',
            destination: ruleData.destination || 'any',
            port: ruleData.port || null,
            priority: ruleData.priority || 100,
            enabled: ruleData.enabled !== false,
            createdAt: new Date()
        };
        
        this.rules.set(ruleId, rule);
        console.log(`Firewall rule created: ${ruleId}`);
        return rule;
    }

    createPolicy(policyId, policyData) {
        const policy = {
            id: policyId,
            ...policyData,
            name: policyData.name || '',
            rules: policyData.rules || [],
            defaultAction: policyData.defaultAction || 'deny',
            enabled: policyData.enabled !== false,
            createdAt: new Date()
        };
        
        this.policies.set(policyId, policy);
        console.log(`Firewall policy created: ${policyId}`);
        return policy;
    }

    evaluatePacket(packet) {
        const matchingRules = [];
        
        this.rules.forEach((rule, ruleId) => {
            if (!rule.enabled) return;
            
            let matches = true;
            
            if (rule.direction && rule.direction !== packet.direction) {
                matches = false;
            }
            
            if (rule.protocol && rule.protocol !== packet.protocol) {
                matches = false;
            }
            
            if (rule.source && rule.source !== 'any' && rule.source !== packet.source) {
                matches = false;
            }
            
            if (rule.destination && rule.destination !== 'any' && rule.destination !== packet.destination) {
                matches = false;
            }
            
            if (rule.port && rule.port !== packet.port) {
                matches = false;
            }
            
            if (matches) {
                matchingRules.push({ ruleId, priority: rule.priority, action: rule.action });
            }
        });
        
        if (matchingRules.length === 0) {
            return { action: 'deny', reason: 'no_matching_rule' };
        }
        
        matchingRules.sort((a, b) => b.priority - a.priority);
        const matchedRule = matchingRules[0];
        
        this.logPacket(packet, matchedRule);
        
        return { action: matchedRule.action, ruleId: matchedRule.ruleId };
    }

    logPacket(packet, rule) {
        const log = {
            id: `log_${Date.now()}`,
            packet,
            ruleId: rule.ruleId,
            action: rule.action,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.logs.set(log.id, log);
        return log;
    }

    getRules(direction = null) {
        if (direction) {
            return Array.from(this.rules.values())
                .filter(r => r.direction === direction);
        }
        return Array.from(this.rules.values());
    }

    getPolicy(policyId) {
        return this.policies.get(policyId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.firewallManagement = new FirewallManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FirewallManagement;
}

