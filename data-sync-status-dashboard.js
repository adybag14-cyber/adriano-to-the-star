/**
 * Data Sync Status Dashboard
 * Monitor data synchronization status
 */
(function() {
    'use strict';

    class DataSyncStatusDashboard {
        constructor() {
            this.syncStatus = {};
            this.init();
        }

        init() {
            this.setupUI();
            this.startMonitoring();
            this.trackEvent('data_sync_dashboard_initialized');
        }

        setupUI() {
            if (!document.getElementById('sync-dashboard')) {
                const dashboard = document.createElement('div');
                dashboard.id = 'sync-dashboard';
                dashboard.className = 'sync-dashboard';
                dashboard.innerHTML = `
                    <div class="dashboard-header">
                        <h2>Sync Status</h2>
                    </div>
                    <div class="status-grid" id="status-grid"></div>
                `;
                document.body.appendChild(dashboard);
            }
        }

        updateStatus(deviceId, status) {
            this.syncStatus[deviceId] = {
                ...status,
                lastUpdate: new Date().toISOString()
            };
            this.renderStatus();
        }

        renderStatus() {
            const grid = document.getElementById('status-grid');
            if (!grid) return;
            grid.innerHTML = Object.entries(this.syncStatus).map(([id, status]) => `
                <div class="status-card">
                    <h3>${id}</h3>
                    <div class="status-indicator ${status.status}">${status.status}</div>
                    <div>Last sync: ${new Date(status.lastUpdate).toLocaleString()}</div>
                </div>
            `).join('');
        }

        startMonitoring() {
            setInterval(() => {
                this.checkSyncStatus();
            }, 5000);
        }

        checkSyncStatus() {
            // Check sync status
            if (window.dataSync) {
                const status = window.dataSync.getStatus();
                Object.keys(status).forEach(deviceId => {
                    this.updateStatus(deviceId, status[deviceId]);
                });
            }
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_sync_dashboard_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.syncDashboard = new DataSyncStatusDashboard();
        });
    } else {
        window.syncDashboard = new DataSyncStatusDashboard();
    }
})();

