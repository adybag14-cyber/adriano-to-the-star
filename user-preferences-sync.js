/**
 * User Preferences System with Cross-Device Sync
 * 
 * Adds comprehensive user preferences system with sync across devices.
 * 
 * @module UserPreferencesSync
 * @version 1.0.0
 * @author Adriano To The Star
 */

class UserPreferencesSync {
    constructor() {
        this.preferences = new Map();
        this.syncEndpoint = null;
        this.syncInProgress = false;
        this.isInitialized = false;
    }

    /**
     * Initialize user preferences system
     * @public
     * @param {Object} options - Configuration options
     */
    init(options = {}) {
        if (this.isInitialized) {
            console.warn('UserPreferencesSync already initialized');
            return;
        }

        this.syncEndpoint = options.syncEndpoint || null;
        this.loadPreferences();
        this.setupSync();
        this.setupStorageListener();
        
        this.isInitialized = true;
        console.log('✅ User Preferences System initialized');
    }

    /**
     * Load preferences
     * @private
     */
    loadPreferences() {
        // Load from localStorage
        try {
            const saved = localStorage.getItem('user-preferences');
            if (saved) {
                const prefs = JSON.parse(saved);
                Object.entries(prefs).forEach(([key, value]) => {
                    this.preferences.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load preferences:', e);
        }

        // Load from remote if endpoint available
        if (this.syncEndpoint) {
            this.syncFromRemote();
        }
    }

    /**
     * Set preference
     * @public
     * @param {string} key - Preference key
     * @param {*} value - Preference value
     * @param {boolean} sync - Whether to sync to remote
     */
    set(key, value, sync = true) {
        this.preferences.set(key, value);
        this.savePreferences();

        // Dispatch event
        window.dispatchEvent(new CustomEvent('preference-changed', {
            detail: { key, value }
        }));

        // Sync to remote
        if (sync && this.syncEndpoint) {
            this.syncToRemote(key, value);
        }
    }

    /**
     * Get preference
     * @public
     * @param {string} key - Preference key
     * @param {*} defaultValue - Default value
     * @returns {*} Preference value
     */
    get(key, defaultValue = null) {
        return this.preferences.has(key) ? this.preferences.get(key) : defaultValue;
    }

    /**
     * Get all preferences
     * @public
     * @returns {Object} All preferences
     */
    getAll() {
        return Object.fromEntries(this.preferences);
    }

    /**
     * Save preferences
     * @private
     */
    savePreferences() {
        try {
            const prefs = Object.fromEntries(this.preferences);
            localStorage.setItem('user-preferences', JSON.stringify(prefs));
        } catch (e) {
            console.warn('Failed to save preferences:', e);
        }
    }

    /**
     * Set up sync
     * @private
     */
    setupSync() {
        // Sync on online
        window.addEventListener('online', () => {
            this.syncFromRemote();
        });

        // Periodic sync
        setInterval(() => {
            if (navigator.onLine && this.syncEndpoint) {
                this.syncFromRemote();
            }
        }, 60000); // Every minute
    }

    /**
     * Set up storage listener for cross-tab sync
     * @private
     */
    setupStorageListener() {
        window.addEventListener('storage', (e) => {
            if (e.key === 'user-preferences' && e.newValue) {
                try {
                    const prefs = JSON.parse(e.newValue);
                    Object.entries(prefs).forEach(([key, value]) => {
                        if (this.preferences.get(key) !== value) {
                            this.preferences.set(key, value);
                            window.dispatchEvent(new CustomEvent('preference-changed', {
                                detail: { key, value }
                            }));
                        }
                    });
                } catch (e) {
                    console.warn('Failed to sync preferences from storage:', e);
                }
            }
        });
    }

    /**
     * Sync to remote
     * @private
     * @param {string} key - Preference key
     * @param {*} value - Preference value
     */
    async syncToRemote(key, value) {
        if (!this.syncEndpoint || this.syncInProgress) {
            return;
        }

        try {
            this.syncInProgress = true;
            await fetch(this.syncEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    key,
                    value,
                    timestamp: Date.now()
                })
            });
        } catch (error) {
            console.warn('Failed to sync preference to remote:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Sync from remote
     * @private
     */
    async syncFromRemote() {
        if (!this.syncEndpoint || this.syncInProgress) {
            return;
        }

        try {
            this.syncInProgress = true;
            const response = await fetch(this.syncEndpoint);
            const remotePrefs = await response.json();

            // Merge remote preferences
            Object.entries(remotePrefs).forEach(([key, value]) => {
                if (this.preferences.get(key) !== value) {
                    this.preferences.set(key, value);
                    window.dispatchEvent(new CustomEvent('preference-changed', {
                        detail: { key, value }
                    }));
                }
            });

            this.savePreferences();
        } catch (error) {
            console.warn('Failed to sync preferences from remote:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Reset preferences
     * @public
     */
    reset() {
        this.preferences.clear();
        localStorage.removeItem('user-preferences');
    }
}

// Create global instance
window.UserPreferencesSync = UserPreferencesSync;
window.userPreferences = new UserPreferencesSync();
window.userPreferences.init();

