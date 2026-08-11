/**
 * API Authorization (Enhanced)
 * Enhanced API authorization for Agent 2
 */

class APIAuthorizationEnhanced {
    constructor() {
        this.permissions = new Map();
        this.roles = new Map();
        this.init();
    }

    init() {
        this.trackEvent('authorization_initialized');
    }

    createRole(roleId, permissions) {
        this.roles.set(roleId, {
            id: roleId,
            permissions,
            createdAt: new Date()
        });
    }

    assignRole(userId, roleId) {
        if (!this.permissions.has(userId)) {
            this.permissions.set(userId, []);
        }
        this.permissions.get(userId).push(roleId);
    }

    hasPermission(userId, permission) {
        const userRoles = this.permissions.get(userId) || [];
        
        return userRoles.some(roleId => {
            const role = this.roles.get(roleId);
            return role && role.permissions.includes(permission);
        });
    }

    authorize(userId, resource, action) {
        const permission = `${resource}:${action}`;
        this.trackEvent('authorization_checked', { userId, resource, action });
        return this.hasPermission(userId, permission);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`api_authz_${eventName}`, 1, data);
            }
            if (typeof window !== 'undefined' && window.analytics) {
                window.analytics.track(eventName, { module: 'api_authorization_enhanced', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const apiAuthorizationEnhanced = new APIAuthorizationEnhanced();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIAuthorizationEnhanced;
}


