/**
 * IDaaS
 * Identity as a Service
 */

class IDaaS {
    constructor() {
        this.tenants = new Map();
        this.users = new Map();
        this.roles = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_da_as_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_da_as_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createTenant(tenantId, tenantData) {
        const tenant = {
            id: tenantId,
            ...tenantData,
            name: tenantData.name || tenantId,
            users: [],
            roles: [],
            createdAt: new Date()
        };
        
        this.tenants.set(tenantId, tenant);
        console.log(`Tenant created: ${tenantId}`);
        return tenant;
    }

    createUser(tenantId, userId, userData) {
        const tenant = this.tenants.get(tenantId);
        if (!tenant) {
            throw new Error('Tenant not found');
        }
        
        const user = {
            id: userId,
            tenantId,
            ...userData,
            username: userData.username || userId,
            email: userData.email || '',
            roles: [],
            status: 'active',
            createdAt: new Date()
        };
        
        this.users.set(userId, user);
        tenant.users.push(userId);
        
        return user;
    }

    createRole(tenantId, roleId, roleData) {
        const tenant = this.tenants.get(tenantId);
        if (!tenant) {
            throw new Error('Tenant not found');
        }
        
        const role = {
            id: roleId,
            tenantId,
            ...roleData,
            name: roleData.name || roleId,
            permissions: roleData.permissions || [],
            createdAt: new Date()
        };
        
        this.roles.set(roleId, role);
        tenant.roles.push(roleId);
        
        return role;
    }

    assignRole(userId, roleId) {
        const user = this.users.get(userId);
        const role = this.roles.get(roleId);
        
        if (!user || !role) {
            throw new Error('User or role not found');
        }
        
        if (!user.roles.includes(roleId)) {
            user.roles.push(roleId);
        }
        
        return { user, role };
    }

    getTenant(tenantId) {
        return this.tenants.get(tenantId);
    }

    getUser(userId) {
        return this.users.get(userId);
    }

    getRole(roleId) {
        return this.roles.get(roleId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.idaas = new IDaaS();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IDaaS;
}

