/**
 * Planet Discovery Notifications
 * Real-time notifications for new planet discoveries and updates
 * 
 * Features:
 * - New discovery alerts
 * - Discovery updates
 * - Customizable notification preferences
 * - Browser notifications
 * - In-app notifications
 */

class PlanetDiscoveryNotifications {
    constructor() {
        this.notifications = [];
        this.preferences = {
            newDiscoveries: true,
            updates: true,
            favorites: true,
            browserNotifications: false,
            soundEnabled: false
        };
        this.lastCheckTime = Date.now();
        this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
        this.init();
    }
    
    init() {
        // Load preferences
        this.loadPreferences();
        
        // Browser permission is requested only after an explicit user action.
        // Never trigger the browser permission prompt during page load.
        
        // Create notification container
        this.createNotificationContainer();
        
        // Start checking for new discoveries
        this.startDiscoveryCheck();
        
        // Listen for discovery events
        this.setupEventListeners();
        
        console.log('🔔 Planet Discovery Notifications initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_no_ti_fi_ca_ti_on_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    loadPreferences() {
        try {
            const saved = localStorage.getItem('notification-preferences');
            if (saved) {
                this.preferences = { ...this.preferences, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Failed to load notification preferences:', e);
        }
    }
    
    savePreferences() {
        try {
            localStorage.setItem('notification-preferences', JSON.stringify(this.preferences));
        } catch (e) {
            console.warn('Failed to save notification preferences:', e);
        }
    }
    
    async requestPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            try {
                const permission = await Notification.requestPermission();
                this.preferences.browserNotifications = permission === 'granted';
                this.savePreferences();
            } catch (e) {
                console.warn('Failed to request notification permission:', e);
            }
        }
    }
    
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'planet-notifications-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10001;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
    
    setupEventListeners() {
        // Listen for new planet discoveries
        document.addEventListener('planet-discovered', (e) => {
            this.handleNewDiscovery(e.detail);
        });
        
        // Listen for planet updates
        document.addEventListener('planet-updated', (e) => {
            this.handlePlanetUpdate(e.detail);
        });
        
        // Listen for favorite planet updates
        document.addEventListener('favorite-planet-updated', (e) => {
            this.handleFavoriteUpdate(e.detail);
        });
    }
    
    startDiscoveryCheck() {
        // Check for new discoveries periodically
        setInterval(() => {
            this.checkForNewDiscoveries();
        }, this.checkInterval);
        
        // Initial check
        this.checkForNewDiscoveries();
    }
    
    async checkForNewDiscoveries() {
        try {
            // Simulate checking for new discoveries
            // In production, this would query an API or database
            const newDiscoveries = await this.fetchNewDiscoveries();
            
            if (newDiscoveries && newDiscoveries.length > 0) {
                newDiscoveries.forEach(discovery => {
                    this.handleNewDiscovery(discovery);
                });
            }
        } catch (e) {
            console.warn('Failed to check for new discoveries:', e);
        }
    }
    
    async fetchNewDiscoveries() {
        // Placeholder - in production, this would fetch from an API
        // For now, return empty array
        return [];
    }
    
    handleNewDiscovery(discovery) {
        if (!this.preferences.newDiscoveries) return;
        
        const notification = {
            id: `discovery-${Date.now()}`,
            type: 'discovery',
            title: '🪐 New Planet Discovered!',
            message: `${discovery.name || 'A new planet'} has been discovered!`,
            planet: discovery,
            timestamp: Date.now()
        };
        
        this.showNotification(notification);
    }
    
    handlePlanetUpdate(update) {
        if (!this.preferences.updates) return;
        
        const notification = {
            id: `update-${Date.now()}`,
            type: 'update',
            title: '📊 Planet Data Updated',
            message: `${update.name || 'A planet'} has been updated with new information.`,
            planet: update,
            timestamp: Date.now()
        };
        
        this.showNotification(notification);
    }
    
    handleFavoriteUpdate(update) {
        if (!this.preferences.favorites) return;
        
        const notification = {
            id: `favorite-${Date.now()}`,
            type: 'favorite',
            title: '⭐ Favorite Planet Update',
            message: `${update.name || 'One of your favorite planets'} has new information.`,
            planet: update,
            timestamp: Date.now()
        };
        
        this.showNotification(notification);
    }
    
    showNotification(notification) {
        // Add to notifications list
        this.notifications.push(notification);
        
        // Show in-app notification
        this.showInAppNotification(notification);
        
        // Show browser notification if enabled
        if (this.preferences.browserNotifications && 'Notification' in window && Notification.permission === 'granted') {
            this.showBrowserNotification(notification);
        }
        
        // Play sound if enabled
        if (this.preferences.soundEnabled) {
            this.playNotificationSound();
        }
    }
    
    showInAppNotification(notification) {
        const container = document.getElementById('planet-notifications-container');
        if (!container) return;
        
        const notificationEl = document.createElement('div');
        notificationEl.className = 'planet-notification';
        notificationEl.dataset.notificationId = notification.id;
        notificationEl.style.cssText = `
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid rgba(186, 148, 79, 0.5);
            border-radius: 10px;
            padding: 1rem;
            color: white;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
            animation: slideInRight 0.3s ease;
            cursor: pointer;
            min-width: 300px;
        `;
        
        notificationEl.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                <h4 style="margin: 0; color: #ba944f; font-size: 1rem;">${notification.title}</h4>
                <button class="notification-close" style="background: none; border: none; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 1.2rem; line-height: 1;">×</button>
            </div>
            <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 0.9rem;">${notification.message}</p>
            ${notification.planet ? `
                <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid rgba(186,148,79,0.3);">
                    <button class="view-planet-btn" style="background: rgba(186,148,79,0.2); border: 1px solid rgba(186,148,79,0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer; font-size: 0.85rem;">
                        View Planet
                    </button>
                </div>
            ` : ''}
        `;
        
        // Close button
        notificationEl.querySelector('.notification-close').addEventListener('click', (e) => {
            e.stopPropagation();
            this.dismissNotification(notification.id);
        });
        
        // View planet button
        const viewBtn = notificationEl.querySelector('.view-planet-btn');
        if (viewBtn && notification.planet) {
            viewBtn.addEventListener('click', () => {
                this.viewPlanet(notification.planet);
                this.dismissNotification(notification.id);
            });
        }
        
        // Click to dismiss
        notificationEl.addEventListener('click', () => {
            this.dismissNotification(notification.id);
        });
        
        container.appendChild(notificationEl);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            this.dismissNotification(notification.id);
        }, 5000);
    }
    
    showBrowserNotification(notification) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: notification.id,
                requireInteraction: false
            });
            
            browserNotification.onclick = () => {
                window.focus();
                if (notification.planet) {
                    this.viewPlanet(notification.planet);
                }
                browserNotification.close();
            };
        }
    }
    
    playNotificationSound() {
        // Create a simple notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
    
    dismissNotification(id) {
        const notificationEl = document.querySelector(`[data-notification-id="${id}"]`);
        if (notificationEl) {
            notificationEl.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                notificationEl.remove();
            }, 300);
        }
        
        // Remove from list
        this.notifications = this.notifications.filter(n => n.id !== id);
    }
    
    viewPlanet(planet) {
        // Navigate to planet details or scroll to planet card
        if (planet.kepid) {
            const planetCard = document.querySelector(`[data-kepid="${planet.kepid}"]`);
            if (planetCard) {
                planetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                planetCard.style.animation = 'highlight 1s ease';
            }
        }
    }
    
    createPreferencesDialog() {
        // Create a dialog for notification preferences
        const dialog = document.createElement('div');
        dialog.className = 'notification-preferences-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid rgba(186, 148, 79, 0.5);
            border-radius: 10px;
            padding: 2rem;
            z-index: 10002;
            min-width: 400px;
            color: white;
        `;
        
        dialog.innerHTML = `
            <h2 style="color: #ba944f; margin-top: 0;">🔔 Notification Preferences</h2>
            <div style="display: flex; flex-direction: column; gap: 1rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" id="pref-new-discoveries" ${this.preferences.newDiscoveries ? 'checked' : ''}>
                    <span>New planet discoveries</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" id="pref-updates" ${this.preferences.updates ? 'checked' : ''}>
                    <span>Planet data updates</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" id="pref-favorites" ${this.preferences.favorites ? 'checked' : ''}>
                    <span>Favorite planet updates</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" id="pref-browser" ${this.preferences.browserNotifications ? 'checked' : ''}>
                    <span>Browser notifications</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="checkbox" id="pref-sound" ${this.preferences.soundEnabled ? 'checked' : ''}>
                    <span>Notification sounds</span>
                </label>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                <button id="pref-cancel" style="padding: 0.75rem 1.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 5px; color: white; cursor: pointer;">Cancel</button>
                <button id="pref-save" style="padding: 0.75rem 1.5rem; background: #ba944f; border: none; border-radius: 5px; color: white; cursor: pointer;">Save</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Event listeners
        document.getElementById('pref-cancel').addEventListener('click', () => {
            dialog.remove();
        });
        
        document.getElementById('pref-save').addEventListener('click', () => {
            this.preferences.newDiscoveries = document.getElementById('pref-new-discoveries').checked;
            this.preferences.updates = document.getElementById('pref-updates').checked;
            this.preferences.favorites = document.getElementById('pref-favorites').checked;
            this.preferences.browserNotifications = document.getElementById('pref-browser').checked;
            this.preferences.soundEnabled = document.getElementById('pref-sound').checked;
            
            this.savePreferences();
            if (this.preferences.browserNotifications) {
                this.requestPermission();
            }
            
            dialog.remove();
        });
    }

    renderNotifications(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            return;
        }

        const prefix = String(containerId).replace(/[^a-z0-9_-]/gi, '_');
        const permission = ('Notification' in window) ? Notification.permission : 'unsupported';

        const checkbox = (key, label, checked) => `
            <label style="display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(186, 148, 79, 0.25); border-radius: 12px; cursor: pointer;">
                <input type="checkbox" data-notif-pref="${key}" ${checked ? 'checked' : ''}>
                <span style="color: rgba(255, 255, 255, 0.85);">${label}</span>
            </label>
        `;

        const recent = Array.isArray(this.notifications)
            ? this.notifications.slice(-3).reverse()
            : [];

        container.innerHTML = `
            <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1rem 0;">🔔 Discovery Notifications</h3>
                <p style="color: rgba(255, 255, 255, 0.75); margin: 0 0 1.25rem 0; line-height: 1.6;">
                    In-app notifications appear in the top-right when discovery events occur. Use the toggles below to customize what you receive.
                </p>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1.25rem;">
                    <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(186, 148, 79, 0.25); border-radius: 12px; padding: 1rem;">
                        <div style="color: rgba(255, 255, 255, 0.65); font-size: 0.85rem;">Browser permission</div>
                        <div style="color: #e0e0e0; font-weight: 600; margin-top: 0.25rem;">${permission}</div>
                    </div>
                    <div style="background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(186, 148, 79, 0.25); border-radius: 12px; padding: 1rem;">
                        <div style="color: rgba(255, 255, 255, 0.65); font-size: 0.85rem;">Notifications stored</div>
                        <div style="color: #e0e0e0; font-weight: 600; margin-top: 0.25rem;">${Array.isArray(this.notifications) ? this.notifications.length : 0}</div>
                    </div>
                </div>

                <div style="display: grid; gap: 0.5rem; margin-bottom: 1.25rem;">
                    ${checkbox('newDiscoveries', 'New discoveries', !!this.preferences.newDiscoveries)}
                    ${checkbox('updates', 'Planet updates', !!this.preferences.updates)}
                    ${checkbox('favorites', 'Favorite updates', !!this.preferences.favorites)}
                    ${checkbox('browserNotifications', 'Browser notifications', !!this.preferences.browserNotifications)}
                    ${checkbox('soundEnabled', 'Notification sounds', !!this.preferences.soundEnabled)}
                </div>

                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                    <button id="${prefix}-notif-permission" style="padding: 0.75rem 1.25rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">Request Permission</button>
                    <button id="${prefix}-notif-preferences" style="padding: 0.75rem 1.25rem; background: rgba(255, 255, 255, 0.08); border: 2px solid rgba(255, 255, 255, 0.2); border-radius: 10px; color: rgba(255,255,255,0.9); cursor: pointer; font-weight: 600;">Advanced Preferences</button>
                    <button id="${prefix}-notif-test" style="padding: 0.75rem 1.25rem; background: rgba(74, 222, 128, 0.15); border: 2px solid rgba(74, 222, 128, 0.35); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">Send Test</button>
                </div>

                <div style="margin-top: 1.25rem; background: rgba(0, 0, 0, 0.35); border: 1px solid rgba(186, 148, 79, 0.25); border-radius: 12px; padding: 1rem;">
                    <div style="color: rgba(255,255,255,0.75); font-weight: 600; margin-bottom: 0.5rem;">Recent</div>
                    ${recent.length === 0 ? '<div style="color: rgba(255,255,255,0.6);">No notifications yet.</div>' : recent.map(n => `
                        <div style="padding: 0.5rem 0; border-top: 1px solid rgba(186, 148, 79, 0.15);">
                            <div style="color: #e0e0e0; font-weight: 600;">${n.title || 'Notification'}</div>
                            <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">${n.message || ''}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        container.querySelectorAll('input[data-notif-pref]').forEach((input) => {
            input.addEventListener('change', async (e) => {
                const key = e.target.dataset.notifPref;
                if (!key) {
                    return;
                }
                this.preferences[key] = !!e.target.checked;
                this.savePreferences();
                if (key === 'browserNotifications' && this.preferences.browserNotifications) {
                    await this.requestPermission();
                }
            });
        });

        const permissionBtn = document.getElementById(`${prefix}-notif-permission`);
        if (permissionBtn) {
            permissionBtn.addEventListener('click', async () => {
                await this.requestPermission();
                this.renderNotifications(containerId);
            });
        }

        const prefsBtn = document.getElementById(`${prefix}-notif-preferences`);
        if (prefsBtn) {
            prefsBtn.addEventListener('click', () => {
                this.openPreferences();
            });
        }

        const testBtn = document.getElementById(`${prefix}-notif-test`);
        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.showNotification({
                    id: `test-${Date.now()}`,
                    type: 'test',
                    title: '🔔 Test Notification',
                    message: 'Notifications are active on this page.',
                    planet: null,
                    timestamp: Date.now()
                });
                this.renderNotifications(containerId);
            });
        }
    }
    
    // Public API
    openPreferences() {
        this.createPreferencesDialog();
    }
    
    getNotifications() {
        return [...this.notifications];
    }
    
    clearNotifications() {
        this.notifications = [];
        const container = document.getElementById('planet-notifications-container');
        if (container) {
            container.innerHTML = '';
        }
    }
}

// Add CSS animations
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        @keyframes highlight {
            0%, 100% { background-color: transparent; }
            50% { background-color: rgba(186, 148, 79, 0.3); }
        }
    `;
    document.head.appendChild(style);
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.planetDiscoveryNotifications = new PlanetDiscoveryNotifications();
    });
} else {
    window.planetDiscoveryNotifications = new PlanetDiscoveryNotifications();
}
