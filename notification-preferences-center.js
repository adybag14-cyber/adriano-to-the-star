/**
 * Notification Preferences Center
 * Manage notification preferences
 */
(function() {
    'use strict';

    class NotificationPreferencesCenter {
        constructor() {
            this.preferences = {};
            this.init();
        }

        init() {
            this.loadPreferences();
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('notification-preferences')) {
                const center = document.createElement('div');
                center.id = 'notification-preferences';
                center.className = 'notification-preferences';
                center.innerHTML = `
                    <div class="preferences-header">
                        <h2>Notification Preferences</h2>
                    </div>
                    <div class="preferences-content" id="preferences-content"></div>
                `;
                document.body.appendChild(center);
            }
        }

        setPreference(key, value) {
            this.preferences[key] = value;
            this.savePreferences();
        }

        getPreference(key) {
            return this.preferences[key];
        }

        savePreferences() {
            localStorage.setItem('notificationPreferences', JSON.stringify(this.preferences));
        }

        loadPreferences() {
            const stored = localStorage.getItem('notificationPreferences');
            if (stored) {
                try {
                    this.preferences = JSON.parse(stored);
                } catch (error) {
                    console.error('Failed to load preferences:', error);
                    this.preferences = {};
                }
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.notificationPreferences = new NotificationPreferencesCenter();
        });
    } else {
        window.notificationPreferences = new NotificationPreferencesCenter();
    }
})();


