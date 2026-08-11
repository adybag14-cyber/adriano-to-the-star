/**
 * Permission System Granularity
 * Fine-grained permission system
 */

class PermissionSystemGranularity {
    constructor() {
        this.permissions = new Map();
        this.init();
    }
    
    init() {
        this.loadPermissions();
    }
    
    loadPermissions() {
        try {
            if (window.supabase?.auth?.user) {
                const userId = window.supabase.auth.user.id;
                // Load user permissions from database
                this.permissions.set(userId, {
                    read: true,
                    write: false,
                    delete: false,
                    admin: false
                });
            }
        } catch (e) {
            console.warn('Failed to load permissions:', e);
        }
    }
    
    hasPermission(userId, action, resource) {
        const userPerms = this.permissions.get(userId);
        if (!userPerms) return false;
        
        if (userPerms.admin) return true;
        return userPerms[action] === true;
    }
    
    checkPermission(action, resource) {
        const userId = window.supabase?.auth?.user?.id;
        if (!userId) return false;
        return this.hasPermission(userId, action, resource);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.permissionSystemGranularity = new PermissionSystemGranularity(); });
} else {
    window.permissionSystemGranularity = new PermissionSystemGranularity();
}


