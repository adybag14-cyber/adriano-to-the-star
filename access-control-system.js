/**
 * Access Control System
 * @class AccessControlSystem
 * @description Manages fine-grained access control with roles and permissions.
 */
class AccessControlSystem {
    constructor() {
        this.roles = new Map();
        this.permissions = new Map();
        this.userRoles = new Map();
        this.init();
    }

    init() {
        this.setupDefaultRoles();
        this.trackEvent('access_control_initialized');
    }

    setupDefaultRoles() {
        this.roles.set('admin', {
            id: 'admin',
            name: 'Administrator',
            permissions: ['*']
        });

        this.roles.set('user', {
            id: 'user',
            name: 'User',
            permissions: ['read', 'write']
        });

        this.roles.set('guest', {
            id: 'guest',
            name: 'Guest',
            permissions: ['read']
        });
    }

    /**
     * Create role.
     * @param {string} roleId - Role identifier.
     * @param {object} roleData - Role data.
     */
    createRole(roleId, roleData) {
        this.roles.set(roleId, {
            ...roleData,
            id: roleId,
            name: roleData.name,
            permissions: roleData.permissions || [],
            createdAt: new Date()
        });
        this.trackEvent('role_created', { roleId, name: roleData.name, permissionCount: roleData.permissions?.length || 0 });
    }

    /**
     * Assign role to user.
     * @param {string} userId - User identifier.
     * @param {string} roleId - Role identifier.
     */
    assignRole(userId, roleId) {
        if (!this.roles.has(roleId)) {
            throw new Error(`Role not found: ${roleId}`);
        }

        this.userRoles.set(userId, {
            userId,
            roleId,
            assignedAt: new Date()
        });
        this.trackEvent('role_assigned', { userId, roleId });
    }

    /**
     * Check permission.
     * @param {string} userId - User identifier.
     * @param {string} permission - Permission to check.
     * @returns {boolean} Whether user has permission.
     */
    hasPermission(userId, permission) {
        const userRole = this.userRoles.get(userId);
        if (!userRole) return false;

        const role = this.roles.get(userRole.roleId);
        if (!role) return false;

        const hasPermission = role.permissions.includes('*') || role.permissions.includes(permission);
        this.trackEvent('permission_checked', { userId, permission, hasPermission });
        return hasPermission;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`access_control_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'access_control_system', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.accessControlSystem = new AccessControlSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessControlSystem;
}

