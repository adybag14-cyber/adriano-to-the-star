/**
 * Intrusion Prevention System
 * Active intrusion prevention and blocking
 */

class IntrusionPreventionSystem {
    constructor() {
        this.blocked = new Map();
        this.rules = new Map();
        this.actions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_nt_ru_si_on_pr_ev_en_ti_on_sy_st_em_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_nt_ru_si_on_pr_ev_en_ti_on_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    addRule(ruleId, rule) {
        const ruleData = {
            id: ruleId,
            ...rule,
            pattern: rule.pattern || '',
            action: rule.action || 'block',
            severity: rule.severity || 'high',
            createdAt: new Date()
        };
        
        this.rules.set(ruleId, ruleData);
        return ruleData;
    }

    processEvent(event) {
        let shouldBlock = false;
        let blockReason = null;
        
        this.rules.forEach((rule, ruleId) => {
            const eventText = JSON.stringify(event).toLowerCase();
            if (rule.pattern.test(eventText)) {
                shouldBlock = true;
                blockReason = rule.id;
                
                if (rule.action === 'block') {
                    this.blockSource(event.source || event.ip || 'unknown');
                }
            }
        });
        
        if (shouldBlock) {
            const action = {
                id: `action_${Date.now()}`,
                event,
                ruleId: blockReason,
                action: 'blocked',
                timestamp: new Date(),
                createdAt: new Date()
            };
            
            this.actions.set(action.id, action);
        }
        
        return { blocked: shouldBlock, reason: blockReason };
    }

    blockSource(source) {
        const block = {
            id: `block_${Date.now()}`,
            source,
            blockedAt: new Date(),
            status: 'active',
            createdAt: new Date()
        };
        
        this.blocked.set(block.id, block);
        return block;
    }

    unblockSource(source) {
        const blocks = Array.from(this.blocked.values())
            .filter(b => b.source === source && b.status === 'active');
        
        blocks.forEach(block => {
            block.status = 'unblocked';
            block.unblockedAt = new Date();
        });
        
        return { unblocked: blocks.length };
    }

    getBlockedSources() {
        return Array.from(this.blocked.values())
            .filter(b => b.status === 'active');
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.intrusionPreventionSystem = new IntrusionPreventionSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntrusionPreventionSystem;
}

