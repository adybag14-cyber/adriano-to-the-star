/**
 * Backup and Restore Functionality
 * 
 * Implements comprehensive backup and restore functionality.
 * 
 * @module BackupRestoreSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class BackupRestoreSystem {
    constructor() {
        this.backups = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize backup system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('BackupRestoreSystem already initialized');
            return;
        }

        this.loadBackups();
        
        this.isInitialized = true;
        this.trackEvent('backup_restore_sys_initialized');
    }

    /**
     * Create backup
     * @public
     * @param {string} name - Backup name
     * @param {Object} options - Backup options
     * @returns {Promise<Object>} Backup object
     */
    async createBackup(name, options = {}) {
        const {
            includeUserData = true,
            includePreferences = true,
            includeChatHistory = true,
            includePlanetClaims = true,
            includeBookmarks = true
        } = options;

        const backup = {
            id: Date.now() + Math.random(),
            name: name || `Backup ${new Date().toISOString()}`,
            timestamp: new Date().toISOString(),
            data: {}
        };

        if (includeUserData) {
            backup.data.user = this.getUserData();
        }

        if (includePreferences) {
            backup.data.preferences = this.getPreferences();
        }

        if (includeChatHistory) {
            backup.data.chatHistory = this.getChatHistory();
        }

        if (includePlanetClaims) {
            backup.data.planetClaims = this.getPlanetClaims();
        }

        if (includeBookmarks) {
            backup.data.bookmarks = this.getBookmarks();
        }

        this.backups.set(backup.id, backup);
        this.saveBackups();

        // Export backup file
        if (window.dataExport) {
            await window.dataExport.export(backup, 'json', `backup-${backup.id}.json`);
        }

        return backup;
    }

    /**
     * Restore backup
     * @public
     * @param {string} backupId - Backup ID
     * @param {Object} options - Restore options
     * @returns {Promise<Object>} Restore result
     */
    async restoreBackup(backupId, options = {}) {
        const {
            merge = false,
            confirm = true
        } = options;

        const backup = this.backups.get(backupId);
        if (!backup) {
            return { success: false, error: 'Backup not found' };
        }

        if (confirm) {
            const confirmed = await this.confirmRestore();
            if (!confirmed) {
                return { success: false, error: 'Restore cancelled' };
            }
        }

        try {
            if (merge) {
                this.mergeBackup(backup.data);
            } else {
                this.replaceData(backup.data);
            }

            return { success: true, backup };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Merge backup
     * @private
     * @param {Object} data - Backup data
     */
    mergeBackup(data) {
        if (data.user) {
            const current = this.getUserData();
            Object.assign(current, data.user);
            localStorage.setItem('stellar-ai-user', JSON.stringify(current));
        }

        if (data.preferences) {
            const current = this.getPreferences();
            Object.assign(current, data.preferences);
            localStorage.setItem('user-preferences', JSON.stringify(current));
        }

        // Merge arrays
        if (data.chatHistory) {
            const current = this.getChatHistory();
            const merged = [...current, ...data.chatHistory];
            localStorage.setItem('stellar-ai-chats', JSON.stringify(merged));
        }

        if (data.planetClaims) {
            const current = this.getPlanetClaims();
            const merged = [...current, ...data.planetClaims];
            localStorage.setItem('planet-claims', JSON.stringify(merged));
        }

        if (data.bookmarks) {
            const current = this.getBookmarks();
            const merged = [...current, ...data.bookmarks];
            localStorage.setItem('bookmarks', JSON.stringify(merged));
        }
    }

    /**
     * Replace data
     * @private
     * @param {Object} data - Backup data
     */
    replaceData(data) {
        if (data.user) {
            localStorage.setItem('stellar-ai-user', JSON.stringify(data.user));
        }

        if (data.preferences) {
            localStorage.setItem('user-preferences', JSON.stringify(data.preferences));
        }

        if (data.chatHistory) {
            localStorage.setItem('stellar-ai-chats', JSON.stringify(data.chatHistory));
        }

        if (data.planetClaims) {
            localStorage.setItem('planet-claims', JSON.stringify(data.planetClaims));
        }

        if (data.bookmarks) {
            localStorage.setItem('bookmarks', JSON.stringify(data.bookmarks));
        }
    }

    /**
     * Confirm restore
     * @private
     * @returns {Promise<boolean>} Confirmation result
     */
    async confirmRestore() {
        return new Promise((resolve) => {
            const confirmed = confirm(
                'This will restore data from backup. Current data may be overwritten. Continue?'
            );
            resolve(confirmed);
        });
    }

    /**
     * Get backup
     * @public
     * @param {string} backupId - Backup ID
     * @returns {Object|null} Backup object
     */
    getBackup(backupId) {
        return this.backups.get(backupId) || null;
    }

    /**
     * Get all backups
     * @public
     * @returns {Array} Backups array
     */
    getAllBackups() {
        return Array.from(this.backups.values())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    /**
     * Delete backup
     * @public
     * @param {string} backupId - Backup ID
     * @returns {boolean} True if deleted
     */
    deleteBackup(backupId) {
        const deleted = this.backups.delete(backupId);
        if (deleted) {
            this.saveBackups();
        }
        return deleted;
    }

    /**
     * Import backup from file
     * @public
     * @param {File} file - Backup file
     * @returns {Promise<Object>} Import result
     */
    async importBackup(file) {
        try {
            const text = await file.text();
            const backup = JSON.parse(text);

            if (!backup.id || !backup.timestamp || !backup.data) {
                throw new Error('Invalid backup format');
            }

            this.backups.set(backup.id, backup);
            this.saveBackups();

            return { success: true, backup };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get user data
     * @private
     * @returns {Object} User data
     */
    getUserData() {
        try {
            return JSON.parse(localStorage.getItem('stellar-ai-user') || 'null');
        } catch {
            return null;
        }
    }

    /**
     * Get preferences
     * @private
     * @returns {Object} Preferences
     */
    getPreferences() {
        try {
            return JSON.parse(localStorage.getItem('user-preferences') || '{}');
        } catch {
            return {};
        }
    }

    /**
     * Get chat history
     * @private
     * @returns {Array} Chat history
     */
    getChatHistory() {
        try {
            return JSON.parse(localStorage.getItem('stellar-ai-chats') || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Get planet claims
     * @private
     * @returns {Array} Planet claims
     */
    getPlanetClaims() {
        try {
            return JSON.parse(localStorage.getItem('planet-claims') || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Get bookmarks
     * @private
     * @returns {Array} Bookmarks
     */
    getBookmarks() {
        try {
            return JSON.parse(localStorage.getItem('bookmarks') || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Save backups
     * @private
     */
    saveBackups() {
        try {
            const backups = Object.fromEntries(this.backups);
            localStorage.setItem('backups', JSON.stringify(backups));
        } catch (e) {
            console.warn('Failed to save backups:', e);
        }
    }

    /**
     * Load backups
     * @private
     */
    loadBackups() {
        try {
            const saved = localStorage.getItem('backups');
            if (saved) {
                const backups = JSON.parse(saved);
                Object.entries(backups).forEach(([key, value]) => {
                    this.backups.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load backups:', e);
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`backup_restore_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Create global instance
window.BackupRestoreSystem = BackupRestoreSystem;
window.backupRestore = new BackupRestoreSystem();
window.backupRestore.init();

