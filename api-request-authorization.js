/**
 * API Request Authorization
 * Authorization and permission checking for API requests
 */

class APIRequestAuthorization {
    constructor() {
        this.permissions = new Map();
        this.roles = new Map();
        this.rolePermissions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('authorization_initialized');
    }

    createRole(roleId, name, description) {
        this.roles.set(roleId, {
            id: roleId,
            name,
            description,
            createdAt: new Date()
        });
        this.rolePermissions.set(roleId, []);
        this.trackEvent('role_created', { roleId });
    }

    createPermission(permissionId, resource, action) {
        this.permissions.set(permissionId, {
            id: permissionId,
            resource,
            action,
            createdAt: new Date()
        });
        console.log(`Permission created: ${permissionId}`);
    }

    assignPermissionToRole(roleId, permissionId) {
        const role = this.roles.get(roleId);
        const permission = this.permissions.get(permissionId);
        
        if (!role || !permission) {
            throw new Error('Role or permission does not exist');
        }
        
        const permissions = this.rolePermissions.get(roleId) || [];
        if (!permissions.includes(permissionId)) {
            permissions.push(permissionId);
            this.rolePermissions.set(roleId, permissions);
            console.log(`Permission ${permissionId} assigned to role ${roleId}`);
        }
    }

    assignRoleToUser(userId, roleId) {
        // In a real implementation, this would be stored in a database
        console.log(`Role ${roleId} assigned to user ${userId}`);
    }

    async authorize(request, userId, resource, action) {
        const userRoles = this.getUserRoles(userId);
        
        for (const roleId of userRoles) {
            const permissions = this.rolePermissions.get(roleId) || [];
            
            for (const permissionId of permissions) {
                const permission = this.permissions.get(permissionId);
                if (permission && 
                    this.matchesResource(permission.resource, resource) &&
                    this.matchesAction(permission.action, action)) {
                    console.log(`User ${userId} authorized for ${resource}:${action}`);
                    return { authorized: true, role: roleId, permission: permissionId };
                }
            }
        }
        
        console.log(`User ${userId} not authorized for ${resource}:${action}`);
        return { authorized: false };
    }

    matchesResource(permissionResource, requestedResource) {
        if (permissionResource === '*' || permissionResource === requestedResource) {
            return true;
        }
        
        // Support wildcard patterns
        const pattern = permissionResource.replace(/\*/g, '.*');
        return new RegExp(`^${pattern}$`).test(requestedResource);
    }

    matchesAction(permissionAction, requestedAction) {
        return permissionAction === '*' || permissionAction === requestedAction;
    }

    getUserRoles(userId) {
        // Mock implementation - in real app, fetch from database
        return ['user', 'member'];
    }

    getRole(roleId) {
        return this.roles.get(roleId);
    }

    getPermission(permissionId) {
        return this.permissions.get(permissionId);
    }

    getRolePermissions(roleId) {
        return this.rolePermissions.get(roleId) || [];
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`authz_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.apiRequestAuthorization = new APIRequestAuthorization();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIRequestAuthorization;
}

