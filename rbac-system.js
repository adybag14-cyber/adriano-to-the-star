/**
 * RBAC System
 * Role-Based Access Control system
 */

class RBACSystem {
    constructor() {
        this.roles = new Map();
        this.permissions = new Map();
        this.users = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_ba_cs_ys_te_m_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ba_cs_ys_te_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createRole(roleId, roleData) {
        const role = {
            id: roleId,
            ...roleData,
            name: roleData.name || roleId,
            permissions: roleData.permissions || [],
            createdAt: new Date()
        };
        
        this.roles.set(roleId, role);
        console.log(`Role created: ${roleId}`);
        return role;
    }

    createPermission(permissionId, permissionData) {
        const permission = {
            id: permissionId,
            ...permissionData,
            name: permissionData.name || permissionId,
            resource: permissionData.resource || '',
            action: permissionData.action || '',
            createdAt: new Date()
        };
        
        this.permissions.set(permissionId, permission);
        console.log(`Permission created: ${permissionId}`);
        return permission;
    }

    assignRole(userId, roleId) {
        const user = this.users.get(userId);
        const role = this.roles.get(roleId);
        
        if (!user || !role) {
            throw new Error('User or role not found');
        }
        
        if (!user.roles) {
            user.roles = [];
        }
        
        if (!user.roles.includes(roleId)) {
            user.roles.push(roleId);
        }
        
        return { user, role };
    }

    hasPermission(userId, permissionId) {
        const user = this.users.get(userId);
        if (!user || !user.roles) {
            return false;
        }
        
        return user.roles.some(roleId => {
            const role = this.roles.get(roleId);
            return role && role.permissions.includes(permissionId);
        });
    }

    registerUser(userId, userData) {
        const user = {
            id: userId,
            ...userData,
            name: userData.name || userId,
            roles: userData.roles || [],
            createdAt: new Date()
        };
        
        this.users.set(userId, user);
        return user;
    }

    getRole(roleId) {
        return this.roles.get(roleId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.rbacSystem = new RBACSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RBACSystem;
}

