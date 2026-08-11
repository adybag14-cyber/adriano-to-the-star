/**
 * Permission System with Role-Based Access Control
 * 
 * Implements comprehensive permission system with role-based access.
 * 
 * @module PermissionSystemRBAC
 * @version 1.0.0
 * @author Adriano To The Star
 */

class PermissionSystemRBAC {
    constructor() {
        this.roles = new Map();
        this.permissions = new Map();
        this.userRoles = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize permission system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('PermissionSystemRBAC already initialized');
            return;
        }

        this.setupDefaultRoles();
        this.loadRoles();
        this.loadUserRoles();
        
        this.isInitialized = true;
        console.log('✅ Permission System initialized');
    }

    /**
     * Set up default roles
     * @private
     */
    setupDefaultRoles() {
        // Admin role
        this.createRole('admin', [
            'read:*',
            'write:*',
            'delete:*',
            'manage:users',
            'manage:content',
            'manage:settings'
        ]);

        // Moderator role
        this.createRole('moderator', [
            'read:*',
            'write:content',
            'delete:content',
            'manage:comments'
        ]);

        // User role
        this.createRole('user', [
            'read:public',
            'write:own-content',
            'delete:own-content'
        ]);
    }

    /**
     * Create role
     * @public
     * @param {string} name - Role name
     * @param {Array} permissions - Permissions array
     * @returns {Object} Role object
     */
    createRole(name, permissions) {
        const role = {
            name,
            permissions: new Set(permissions),
            createdAt: new Date().toISOString()
        };

        this.roles.set(name, role);
        this.saveRoles();

        return role;
    }

    /**
     * Assign role to user
     * @public
     * @param {string} userId - User ID
     * @param {string} roleName - Role name
     * @returns {boolean} True if assigned
     */
    assignRole(userId, roleName) {
        if (!this.roles.has(roleName)) {
            return false;
        }

        if (!this.userRoles.has(userId)) {
            this.userRoles.set(userId, new Set());
        }

        this.userRoles.get(userId).add(roleName);
        this.saveUserRoles();

        return true;
    }

    /**
     * Remove role from user
     * @public
     * @param {string} userId - User ID
     * @param {string} roleName - Role name
     * @returns {boolean} True if removed
     */
    removeRole(userId, roleName) {
        const roles = this.userRoles.get(userId);
        if (!roles) {
            return false;
        }

        const removed = roles.delete(roleName);
        if (removed) {
            this.saveUserRoles();
        }

        return removed;
    }

    /**
     * Check permission
     * @public
     * @param {string} userId - User ID
     * @param {string} permission - Permission string
     * @returns {boolean} True if allowed
     */
    hasPermission(userId, permission) {
        const roles = this.userRoles.get(userId);
        if (!roles || roles.size === 0) {
            // Default to user role
            roles = new Set(['user']);
        }

        // Check each role
        for (const roleName of roles) {
            const role = this.roles.get(roleName);
            if (!role) {
                continue;
            }

            // Check exact permission
            if (role.permissions.has(permission)) {
                return true;
            }

            // Check wildcard permissions
            const parts = permission.split(':');
            if (parts.length === 2) {
                const [action, resource] = parts;
                
                // Check action wildcard
                if (role.permissions.has(`${action}:*`)) {
                    return true;
                }

                // Check resource wildcard
                if (role.permissions.has(`*:${resource}`)) {
                    return true;
                }

                // Check full wildcard
                if (role.permissions.has('*:*')) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get user permissions
     * @public
     * @param {string} userId - User ID
     * @returns {Array} Permissions array
     */
    getUserPermissions(userId) {
        const roles = this.userRoles.get(userId) || new Set(['user']);
        const permissions = new Set();

        roles.forEach(roleName => {
            const role = this.roles.get(roleName);
            if (role) {
                role.permissions.forEach(perm => permissions.add(perm));
            }
        });

        return Array.from(permissions);
    }

    /**
     * Get user roles
     * @public
     * @param {string} userId - User ID
     * @returns {Array} Roles array
     */
    getUserRoles(userId) {
        const roles = this.userRoles.get(userId);
        return roles ? Array.from(roles) : ['user'];
    }

    /**
     * Add permission to role
     * @public
     * @param {string} roleName - Role name
     * @param {string} permission - Permission string
     * @returns {boolean} True if added
     */
    addPermissionToRole(roleName, permission) {
        const role = this.roles.get(roleName);
        if (!role) {
            return false;
        }

        role.permissions.add(permission);
        this.saveRoles();

        return true;
    }

    /**
     * Remove permission from role
     * @public
     * @param {string} roleName - Role name
     * @param {string} permission - Permission string
     * @returns {boolean} True if removed
     */
    removePermissionFromRole(roleName, permission) {
        const role = this.roles.get(roleName);
        if (!role) {
            return false;
        }

        const removed = role.permissions.delete(permission);
        if (removed) {
            this.saveRoles();
        }

        return removed;
    }

    /**
     * Save roles
     * @private
     */
    saveRoles() {
        try {
            const roles = {};
            this.roles.forEach((role, name) => {
                roles[name] = {
                    name: role.name,
                    permissions: Array.from(role.permissions),
                    createdAt: role.createdAt
                };
            });
            localStorage.setItem('rbac-roles', JSON.stringify(roles));
        } catch (e) {
            console.warn('Failed to save roles:', e);
        }
    }

    /**
     * Load roles
     * @private
     */
    loadRoles() {
        try {
            const saved = localStorage.getItem('rbac-roles');
            if (saved) {
                const roles = JSON.parse(saved);
                Object.entries(roles).forEach(([name, roleData]) => {
                    this.roles.set(name, {
                        name: roleData.name,
                        permissions: new Set(roleData.permissions),
                        createdAt: roleData.createdAt
                    });
                });
            }
        } catch (e) {
            console.warn('Failed to load roles:', e);
        }
    }

    /**
     * Save user roles
     * @private
     */
    saveUserRoles() {
        try {
            const userRoles = {};
            this.userRoles.forEach((roles, userId) => {
                userRoles[userId] = Array.from(roles);
            });
            localStorage.setItem('rbac-user-roles', JSON.stringify(userRoles));
        } catch (e) {
            console.warn('Failed to save user roles:', e);
        }
    }

    /**
     * Load user roles
     * @private
     */
    loadUserRoles() {
        try {
            const saved = localStorage.getItem('rbac-user-roles');
            if (saved) {
                const userRoles = JSON.parse(saved);
                Object.entries(userRoles).forEach(([userId, roles]) => {
                    this.userRoles.set(userId, new Set(roles));
                });
            }
        } catch (e) {
            console.warn('Failed to load user roles:', e);
        }
    }
}

// Create global instance
window.PermissionSystemRBAC = PermissionSystemRBAC;
window.permissionSystem = new PermissionSystemRBAC();
window.permissionSystem.init();

