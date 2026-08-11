/**
 * API Request Routing
 * Route API requests based on rules and conditions
 */

class APIRequestRouting {
    constructor() {
        this.routes = new Map();
        this.routingRules = new Map();
        this.init();
    }

    init() {
        this.trackEvent('routing_initialized');
    }

    createRoute(routeId, path, handler, method = 'GET') {
        this.routes.set(routeId, {
            id: routeId,
            path,
            method,
            handler,
            enabled: true,
            createdAt: new Date()
        });
        console.log(`Route created: ${routeId}`);
    }

    addRoutingRule(ruleId, condition, targetRoute, priority = 0) {
        this.routingRules.set(ruleId, {
            id: ruleId,
            condition,
            targetRoute,
            priority,
            enabled: true,
            createdAt: new Date()
        });
        
        // Sort rules by priority
        const rules = Array.from(this.routingRules.values());
        rules.sort((a, b) => b.priority - a.priority);
        
        console.log(`Routing rule added: ${ruleId}`);
    }

    route(request) {
        const { path, method, headers, query } = request;
        
        // Check routing rules first
        const rules = Array.from(this.routingRules.values())
            .filter(r => r.enabled)
            .sort((a, b) => b.priority - a.priority);
        
        for (const rule of rules) {
            if (this.evaluateCondition(rule.condition, request)) {
                const route = this.routes.get(rule.targetRoute);
                if (route && route.enabled) {
                    console.log(`Request routed via rule: ${rule.id} to route: ${rule.targetRoute}`);
                    return route;
                }
            }
        }
        
        // Find direct route match
        for (const route of this.routes.values()) {
            if (route.enabled && this.matchesRoute(route, path, method)) {
                console.log(`Request routed to: ${route.id}`);
                return route;
            }
        }
        
        return null;
    }

    evaluateCondition(condition, request) {
        if (condition.type === 'path') {
            return request.path.includes(condition.value);
        } else if (condition.type === 'header') {
            return request.headers[condition.name] === condition.value;
        } else if (condition.type === 'query') {
            return request.query[condition.name] === condition.value;
        }
        return false;
    }

    matchesRoute(route, path, method) {
        if (route.method !== method) {
            return false;
        }
        
        if (route.path instanceof RegExp) {
            return route.path.test(path);
        }
        
        return path === route.path || path.startsWith(route.path);
    }

    getRoute(routeId) {
        return this.routes.get(routeId);
    }

    getAllRoutes() {
        return Array.from(this.routes.values());
    }

    getRoutingRule(ruleId) {
        return this.routingRules.get(ruleId);
    }

    getAllRoutingRules() {
        return Array.from(this.routingRules.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`routing_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestRouting = new APIRequestRouting();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestRouting;
}

