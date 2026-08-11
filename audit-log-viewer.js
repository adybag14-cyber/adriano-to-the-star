/**
 * Audit Log Viewer with Filtering and Export
 * View and manage audit logs
 */
(function() {
    'use strict';

    class AuditLogViewer {
        constructor() {
            this.logs = [];
            this.filters = {};
            this.init();
        }

        init() {
            this.loadLogs();
            this.setupUI();
            this.trackEvent('audit_viewer_initialized');
        }

        setupUI() {
            if (!document.getElementById('audit-log-viewer')) {
                const viewer = document.createElement('div');
                viewer.id = 'audit-log-viewer';
                viewer.className = 'audit-log-viewer';
                viewer.innerHTML = `
                    <div class="viewer-header">
                        <h2>Audit Log</h2>
                        <div class="viewer-actions">
                            <button class="export-btn" id="export-logs">Export</button>
                            <button class="refresh-btn" id="refresh-logs">Refresh</button>
                        </div>
                    </div>
                    <div class="filters-panel" id="filters-panel"></div>
                    <div class="logs-table" id="logs-table"></div>
                `;
                document.body.appendChild(viewer);
            }
        }

        addLog(action, details) {
            const log = {
                id: this.generateId(),
                timestamp: new Date().toISOString(),
                user: this.getCurrentUser(),
                action: action,
                details: details
            };
            this.logs.unshift(log);
            this.saveLogs();
            this.renderLogs();
        }

        renderLogs() {
            const table = document.getElementById('logs-table');
            if (!table) return;

            const filtered = this.applyFilters();
            table.innerHTML = `
                <table>
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>User</th>
                            <th>Action</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filtered.map(log => `
                            <tr>
                                <td>${new Date(log.timestamp).toLocaleString()}</td>
                                <td>${log.user}</td>
                                <td>${log.action}</td>
                                <td>${JSON.stringify(log.details)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        applyFilters() {
            return this.logs.filter(log => {
                if (this.filters.user && log.user !== this.filters.user) return false;
                if (this.filters.action && log.action !== this.filters.action) return false;
                return true;
            });
        }

        exportLogs() {
            const data = JSON.stringify(this.logs, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-log-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }

        getCurrentUser() {
            return window.supabase?.auth?.user()?.id || 'anonymous';
        }

        generateId() {
            return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        saveLogs() {
            localStorage.setItem('auditLogs', JSON.stringify(this.logs));
        }

        loadLogs() {
            const stored = localStorage.getItem('auditLogs');
            if (stored) {
                try {
                    this.logs = JSON.parse(stored);
                } catch (error) {
                    console.error('Failed to load logs:', error);
                    this.logs = [];
                }
            }
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`audit_viewer_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.auditLogViewer = new AuditLogViewer();
        });
    } else {
        window.auditLogViewer = new AuditLogViewer();
    }
})();


