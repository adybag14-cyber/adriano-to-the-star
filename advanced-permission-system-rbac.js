/**
 * Advanced Permission System with Custom Roles
 * Role-based access control (RBAC) system
 */
(function() {
    'use strict';

    class AdvancedPermissionSystem {
        constructor() {
            this.roles = new Map();
            this.permissions = new Map();
            this.userRoles = new Map();
            this.init();
        }

        init() {
            this.setupDefaultRoles();
            this.setupUI();
            this.trackEvent('rbac_system_initialized');
        }

        setupDefaultRoles() {
            this.createRole('admin', ['*']);
            this.createRole('user', ['read', 'create']);
            this.createRole('moderator', ['read', 'create', 'update', 'delete']);
        }

        setupUI() {
            if (!document.getElementById('permission-system-panel')) {
                const panel = document.createElement('div');
                panel.id = 'permission-system-panel';
                panel.className = 'permission-system-panel';
                panel.innerHTML = `
                    <div class="panel-header">
                        <h3>Permission System</h3>
                        <button class="create-role-btn" id="create-role-btn">Create Role</button>
                    </div>
                    <div class="roles-list" id="roles-list"></div>
                `;
                document.body.appendChild(panel);
            }
        }

        createRole(name, permissions) {
            const role = {
                id: this.generateId(),
                name: name,
                permissions: permissions,
                createdAt: new Date().toISOString()
            };
            this.roles.set(role.id, role);
            this.saveRoles();
            this.trackEvent('role_created', { roleId: role.id, name });
            return role;
        }

        assignRole(userId, roleId) {
            this.userRoles.set(userId, roleId);
            this.saveUserRoles();
            this.trackEvent('role_assigned', { userId, roleId });
        }

        hasPermission(userId, permission) {
            const roleId = this.userRoles.get(userId);
            if (!roleId) return false;

            const role = this.roles.get(roleId);
            if (!role) return false;

            return role.permissions.includes('*') || role.permissions.includes(permission);
        }

        checkPermission(userId, permission) {
            if (!this.hasPermission(userId, permission)) {
                throw new Error('Permission denied');
            }
        }

        saveRoles() {
            localStorage.setItem('rbacRoles', JSON.stringify(Array.from(this.roles.values())));
        }

        saveUserRoles() {
            localStorage.setItem('rbacUserRoles', JSON.stringify(Array.from(this.userRoles.entries())));
        }

        generateId() {
            return 'role_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`rbac_${eventName}`, 1, data);
                }
                if (window.analytics) {
                    window.analytics.track(eventName, { module: 'advanced_permission_system_rbac', ...data });
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.permissionSystem = new AdvancedPermissionSystem();
        });
    } else {
        window.permissionSystem = new AdvancedPermissionSystem();
    }
})();


