/**
 * App Update Notifications
 * Notify users of app updates
 */
(function() {
    'use strict';

    class AppUpdateNotifications {
        constructor() {
            this.init();
        }

        init() {
            this.setupUI();
            this.checkForUpdates();
            this.trackEvent('update_notifications_initialized');
        }

        setupUI() {
            if (!document.getElementById('app-updates')) {
                const updates = document.createElement('div');
                updates.id = 'app-updates';
                updates.className = 'app-updates';
                updates.innerHTML = `<h2>App Updates</h2>`;
                document.body.appendChild(updates);
            }
        }

        checkForUpdates() {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    this.notifyUpdate();
                });
            }
        }

        notifyUpdate() {
            if (window.notificationSystem) {
                window.notificationSystem.show(
                    'Update Available',
                    'A new version of the app is available. Please refresh to update.',
                    'info'
                );
            }
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`update_notif_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.appUpdates = new AppUpdateNotifications();
        });
    } else {
        window.appUpdates = new AppUpdateNotifications();
    }
})();

