/**
 * IAM System
 * Identity and Access Management system
 */

class IAMSystem {
    constructor() {
        this.users = new Map();
        this.roles = new Map();
        this.permissions = new Map();
        this.sessions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('i_am_sy_st_em_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_am_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createUser(userId, userData) {
        const user = {
            id: userId,
            ...userData,
            username: userData.username || userId,
            email: userData.email || '',
            roles: userData.roles || [],
            status: 'active',
            createdAt: new Date()
        };
        
        this.users.set(userId, user);
        console.log(`User created: ${userId}`);
        return user;
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

    assignRole(userId, roleId) {
        const user = this.users.get(userId);
        const role = this.roles.get(roleId);
        
        if (!user) {
            throw new Error('User not found');
        }
        if (!role) {
            throw new Error('Role not found');
        }
        
        if (!user.roles.includes(roleId)) {
            user.roles.push(roleId);
        }
        
        return user;
    }

    checkPermission(userId, resource, action) {
        const user = this.users.get(userId);
        if (!user) {
            return false;
        }
        
        const userPermissions = new Set();
        
        user.roles.forEach(roleId => {
            const role = this.roles.get(roleId);
            if (role) {
                role.permissions.forEach(perm => {
                    if (perm.resource === resource && perm.actions.includes(action)) {
                        userPermissions.add(perm);
                    }
                });
            }
        });
        
        return userPermissions.size > 0;
    }

    createSession(userId, sessionData) {
        const session = {
            id: `session_${Date.now()}`,
            userId,
            ...sessionData,
            token: sessionData.token || this.generateToken(),
            expiresAt: new Date(Date.now() + (sessionData.duration || 3600000)),
            createdAt: new Date()
        };
        
        this.sessions.set(session.id, session);
        return session;
    }

    generateToken() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
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
    window.iamSystem = new IAMSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IAMSystem;
}

