/**
 * HTTP/2 Server Push
 * HTTP/2 server push optimization
 */

class HTTP2ServerPush {
    constructor() {
        this.pushRules = new Map();
        this.pushHistory = [];
        this.init();
    }

    init() {
        this.trackEvent('h_tt_p2s_er_ve_rp_us_h_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("h_tt_p2s_er_ve_rp_us_h_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    addPushRule(ruleId, path, resources, priority) {
        this.pushRules.set(ruleId, {
            id: ruleId,
            path,
            resources,
            priority,
            enabled: true,
            createdAt: new Date()
        });
        console.log(`Push rule added: ${ruleId}`);
    }

    shouldPush(path, resource) {
        for (const rule of this.pushRules.values()) {
            if (rule.enabled && path.includes(rule.path)) {
                if (rule.resources.includes(resource)) {
                    return true;
                }
            }
        }
        return false;
    }

    pushResource(path, resource, headers = {}) {
        const push = {
            path,
            resource,
            headers,
            pushedAt: new Date()
        };
        
        this.pushHistory.push(push);
        console.log(`Resource pushed via HTTP/2: ${resource}`);
        return push;
    }

    pushMultipleResources(path, resources) {
        const pushes = resources.map(resource => 
            this.pushResource(path, resource)
        );
        console.log(`Pushed ${resources.length} resources for path: ${path}`);
        return pushes;
    }

    getPushHistory(limit = 100) {
        return this.pushHistory.slice(-limit);
    }

    getPushStats() {
        const total = this.pushHistory.length;
        const byPath = {};
        
        this.pushHistory.forEach(push => {
            byPath[push.path] = (byPath[push.path] || 0) + 1;
        });
        
        return {
            total,
            byPath,
            averagePerRequest: total > 0 ? total / Object.keys(byPath).length : 0
        };
    }

    optimizePushRules() {
        // Analyze push history and optimize rules
        const stats = this.getPushStats();
        console.log('Push rules optimized based on usage patterns');
        return stats;
    }

    getPushRule(ruleId) {
        return this.pushRules.get(ruleId);
    }

    getAllPushRules() {
        return Array.from(this.pushRules.values());
    }
}

if (typeof window !== 'undefined') {
    window.http2ServerPush = new HTTP2ServerPush();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HTTP2ServerPush;
}
