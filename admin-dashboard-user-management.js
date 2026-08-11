/**
 * Admin Dashboard with User Management
 * 
 * Implements comprehensive admin dashboard with user management.
 * 
 * @module AdminDashboardUserManagement
 * @version 1.0.0
 * @author Adriano To The Star
 */

class AdminDashboardUserManagement {
    constructor() {
        this.users = new Map();
        this.stats = null;
        this.isInitialized = false;
    }

    /**
     * Initialize admin dashboard
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('AdminDashboardUserManagement already initialized');
            return;
        }

        this.loadUsers();
        this.injectStyles();
        
        this.isInitialized = true;
        console.log('✅ Admin Dashboard initialized');
    }

    /**
     * Create dashboard
     * @public
     * @param {HTMLElement} container - Container element
     * @returns {HTMLElement} Dashboard element
     */
    createDashboard(container) {
        const dashboard = document.createElement('div');
        dashboard.className = 'admin-dashboard';
        dashboard.innerHTML = `
            <div class="dashboard-header">
                <h1>Admin Dashboard</h1>
            </div>
            <div class="dashboard-stats">
                ${this.generateStatsHTML()}
            </div>
            <div class="dashboard-content">
                <div class="user-management-section">
                    <h2>User Management</h2>
                    <div class="user-filters">
                        <input type="text" class="user-search" placeholder="Search users...">
                        <select class="user-role-filter">
                            <option value="">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="moderator">Moderator</option>
                            <option value="user">User</option>
                        </select>
                    </div>
                    <div class="user-list"></div>
                </div>
            </div>
        `;

        const userList = dashboard.querySelector('.user-list');
        this.renderUserList(userList);

        // Set up filters
        const searchInput = dashboard.querySelector('.user-search');
        const roleFilter = dashboard.querySelector('.user-role-filter');
        
        searchInput.addEventListener('input', () => {
            this.renderUserList(userList, searchInput.value, roleFilter.value);
        });

        roleFilter.addEventListener('change', () => {
            this.renderUserList(userList, searchInput.value, roleFilter.value);
        });

        container.appendChild(dashboard);
        return dashboard;
    }

    /**
     * Generate stats HTML
     * @private
     * @returns {string} Stats HTML
     */
    generateStatsHTML() {
        const stats = this.getStats();
        return `
            <div class="stat-card">
                <div class="stat-value">${stats.totalUsers}</div>
                <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.activeUsers}</div>
                <div class="stat-label">Active Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.newUsersToday}</div>
                <div class="stat-label">New Today</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.totalContent}</div>
                <div class="stat-label">Total Content</div>
            </div>
        `;
    }

    /**
     * Render user list
     * @private
     * @param {HTMLElement} container - Container element
     * @param {string} searchQuery - Search query
     * @param {string} roleFilter - Role filter
     */
    renderUserList(container, searchQuery = '', roleFilter = '') {
        let users = Array.from(this.users.values());

        // Apply filters
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            users = users.filter(user => 
                user.name?.toLowerCase().includes(query) ||
                user.email?.toLowerCase().includes(query)
            );
        }

        if (roleFilter) {
            users = users.filter(user => user.role === roleFilter);
        }

        container.innerHTML = `
            <table class="user-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Joined</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => this.renderUserRow(user)).join('')}
                </tbody>
            </table>
        `;

        // Set up action buttons
        container.querySelectorAll('.user-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                const userId = btn.dataset.userId;
                this.handleUserAction(action, userId);
            });
        });
    }

    /**
     * Render user row
     * @private
     * @param {Object} user - User object
     * @returns {string} User row HTML
     */
    renderUserRow(user) {
        return `
            <tr>
                <td>${user.name || 'N/A'}</td>
                <td>${user.email || 'N/A'}</td>
                <td>
                    <select class="user-role" data-user-id="${user.id}">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                        <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Moderator</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                </td>
                <td>
                    <span class="user-status ${user.status || 'active'}">${user.status || 'active'}</span>
                </td>
                <td>${new Date(user.joinedAt || Date.now()).toLocaleDateString()}</td>
                <td>
                    <button class="user-action" data-action="edit" data-user-id="${user.id}">Edit</button>
                    <button class="user-action" data-action="suspend" data-user-id="${user.id}">Suspend</button>
                    <button class="user-action" data-action="delete" data-user-id="${user.id}">Delete</button>
                </td>
            </tr>
        `;
    }

    /**
     * Handle user action
     * @private
     * @param {string} action - Action name
     * @param {string} userId - User ID
     */
    handleUserAction(action, userId) {
        const user = this.users.get(userId);
        if (!user) {
            return;
        }

        switch (action) {
            case 'edit':
                this.editUser(user);
                this.trackEvent('admin_user_edit', { targetUserId: userId });
                break;
            case 'suspend':
                this.suspendUser(userId);
                this.trackEvent('admin_user_suspend', { targetUserId: userId });
                break;
            case 'delete':
                if (confirm(`Delete user ${user.name || user.email}?`)) {
                    this.deleteUser(userId);
                    this.trackEvent('admin_user_delete', { targetUserId: userId });
                }
                break;
        }
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`admin:${eventName}`, 1, {
                    source: 'admin-dashboard-user-management',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record admin event:', e);
            }
        }
        if (window.securityAuditLogging) {
            try {
                window.securityAuditLogging.logEvent('admin_action', null, { event: eventName, ...data }, 'warning');
            } catch (e) {
                console.warn('Failed to log admin action:', e);
            }
        }
    }

    /**
     * Edit user
     * @private
     * @param {Object} user - User object
     */
    editUser(user) {
        // Open edit modal
        console.log('Edit user:', user);
    }

    /**
     * Suspend user
     * @private
     * @param {string} userId - User ID
     */
    suspendUser(userId) {
        const user = this.users.get(userId);
        if (user) {
            user.status = user.status === 'suspended' ? 'active' : 'suspended';
            this.saveUsers();
        }
    }

    /**
     * Delete user
     * @private
     * @param {string} userId - User ID
     */
    deleteUser(userId) {
        this.users.delete(userId);
        this.saveUsers();
    }

    /**
     * Get stats
     * @private
     * @returns {Object} Statistics
     */
    getStats() {
        const users = Array.from(this.users.values());
        const today = new Date().toDateString();
        
        return {
            totalUsers: users.length,
            activeUsers: users.filter(u => u.status === 'active').length,
            newUsersToday: users.filter(u => 
                new Date(u.joinedAt || Date.now()).toDateString() === today
            ).length,
            totalContent: 0 // Would come from content system
        };
    }

    /**
     * Save users
     * @private
     */
    saveUsers() {
        try {
            const users = Object.fromEntries(this.users);
            localStorage.setItem('admin-users', JSON.stringify(users));
        } catch (e) {
            console.warn('Failed to save users:', e);
        }
    }

    /**
     * Load users
     * @private
     */
    loadUsers() {
        try {
            const saved = localStorage.getItem('admin-users');
            if (saved) {
                const users = JSON.parse(saved);
                Object.entries(users).forEach(([key, value]) => {
                    this.users.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load users:', e);
        }
    }

    /**
     * Inject required styles
     * @private
     */
    injectStyles() {
        if (document.getElementById('admin-dashboard-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'admin-dashboard-styles';
        style.textContent = `
            .admin-dashboard {
                padding: 2rem;
            }

            .dashboard-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }

            .stat-card {
                background: rgba(0, 0, 0, 0.5);
                padding: 1.5rem;
                border-radius: 8px;
                border: 1px solid rgba(186, 148, 79, 0.3);
                text-align: center;
            }

            .stat-value {
                font-size: 2.5rem;
                font-weight: bold;
                color: #ba944f;
            }

            .stat-label {
                margin-top: 0.5rem;
                color: rgba(255, 255, 255, 0.7);
            }

            .user-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 1rem;
            }

            .user-table th,
            .user-table td {
                padding: 0.75rem;
                text-align: left;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .user-table th {
                background: rgba(186, 148, 79, 0.2);
                color: #ba944f;
            }

            .user-action {
                padding: 0.25rem 0.75rem;
                margin: 0 0.25rem;
                border-radius: 4px;
                border: none;
                cursor: pointer;
                background: #ba944f;
                color: white;
            }
        `;
        document.head.appendChild(style);
    }
}

// Create global instance
window.AdminDashboardUserManagement = AdminDashboardUserManagement;
window.adminDashboard = new AdminDashboardUserManagement();
window.adminDashboard.init();

