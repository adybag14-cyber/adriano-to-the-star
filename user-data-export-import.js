/**
 * User Data Export/Import System
 * 
 * Allows users to export their data (favorites, settings, search history,
 * preferences, bookmarks, claims) to JSON and import it back. Useful for
 * backup and data migration.
 * 
 * @class UserDataExportImport
 * @example
 * // Auto-initializes on page load
 * // Access via: window.userDataExportImport()
 * 
 * // Export user data
 * const exportImport = window.userDataExportImport();
 * await exportImport.exportUserData();
 * 
 * // Import user data (triggers file picker)
 * exportImport.triggerImport();
 */
class UserDataExportImport {
    constructor() {
        this.exportableData = {
            favorites: [],
            settings: {},
            searchHistory: [],
            preferences: {}
        };
        this.init();
    }

    init() {
        // Setup export/import buttons
        this.setupButtons();
        
        console.log('✅ User Data Export/Import initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("u_se_rd_at_ae_xp_or_ti_mp_or_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Setup export/import buttons
     */
    setupButtons() {
        // Find export buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-export-user-data]')) {
                this.exportUserData();
            } else if (e.target.matches('[data-import-user-data]')) {
                this.triggerImport();
            }
        });
    }

    /**
     * Collect all user data from localStorage
     * 
     * Gathers favorites, settings, search history, preferences, bookmarks,
     * claims, theme, and language preferences.
     * 
     * @method collectUserData
     * @returns {Promise<Object>} User data object with all collected data
     */
    async collectUserData() {
        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            favorites: [],
            settings: {},
            searchHistory: [],
            preferences: {},
            bookmarks: [],
            claims: []
        };

        // Collect favorites
        try {
            const favorites = localStorage.getItem('planet-favorites');
            if (favorites) {
                data.favorites = JSON.parse(favorites);
            }
        } catch (error) {
            console.warn('Failed to collect favorites:', error);
        }

        // Collect settings
        try {
            const settings = localStorage.getItem('user-settings');
            if (settings) {
                data.settings = JSON.parse(settings);
            }
        } catch (error) {
            console.warn('Failed to collect settings:', error);
        }

        // Collect search history
        try {
            const history = localStorage.getItem('search-history');
            if (history) {
                data.searchHistory = JSON.parse(history);
            }
        } catch (error) {
            console.warn('Failed to collect search history:', error);
        }

        // Collect preferences
        try {
            const preferences = localStorage.getItem('user-preferences');
            if (preferences) {
                data.preferences = JSON.parse(preferences);
            }
        } catch (error) {
            console.warn('Failed to collect preferences:', error);
        }

        // Collect bookmarks
        try {
            const bookmarks = localStorage.getItem('bookmarks');
            if (bookmarks) {
                data.bookmarks = JSON.parse(bookmarks);
            }
        } catch (error) {
            console.warn('Failed to collect bookmarks:', error);
        }

        // Collect planet claims
        try {
            const claims = localStorage.getItem('planet-claims');
            if (claims) {
                data.claims = JSON.parse(claims);
            }
        } catch (error) {
            console.warn('Failed to collect claims:', error);
        }

        // Collect theme preferences
        try {
            const theme = localStorage.getItem('theme-preference');
            if (theme) {
                data.preferences.theme = theme;
            }
        } catch (error) {
            console.warn('Failed to collect theme:', error);
        }

        // Collect language preference
        try {
            const language = localStorage.getItem('language-preference');
            if (language) {
                data.preferences.language = language;
            }
        } catch (error) {
            console.warn('Failed to collect language:', error);
        }

        return data;
    }

    /**
     * Export user data to JSON file
     * 
     * Collects all user data and triggers a download of a JSON file.
     * 
     * @method exportUserData
     * @returns {Promise<void>}
     * @throws {Error} If export fails
     */
    async exportUserData() {
        try {
            const data = await this.collectUserData();
            const json = JSON.stringify(data, null, 2);
            
            // Create download
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `adriano-star-user-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showNotification('User data exported successfully!', 'success');
        } catch (error) {
            console.error('Failed to export user data:', error);
            this.showNotification('Failed to export user data', 'error');
        }
    }

    /**
     * Trigger file picker for importing user data
     * 
     * Opens a file input dialog to select a JSON file for import.
     * 
     * @method triggerImport
     * @returns {void}
     */
    triggerImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.importUserData(file);
            }
        });
        input.click();
    }

    /**
     * Import user data from JSON file
     * 
     * Validates the file, shows confirmation dialog, and imports data.
     * Applies theme and language preferences automatically.
     * 
     * @method importUserData
     * @param {File} file - JSON file to import
     * @returns {Promise<void>}
     * @throws {Error} If import fails or file is invalid
     */
    async importUserData(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validate data structure
            if (!data.version || !data.exportDate) {
                throw new Error('Invalid data format');
            }

            // Show confirmation dialog
            const confirmed = await this.showImportConfirmation(data);
            if (!confirmed) {
                return;
            }

            // Import data
            let importedCount = 0;

            if (data.favorites && Array.isArray(data.favorites)) {
                localStorage.setItem('planet-favorites', JSON.stringify(data.favorites));
                importedCount++;
            }

            if (data.settings && typeof data.settings === 'object') {
                localStorage.setItem('user-settings', JSON.stringify(data.settings));
                importedCount++;
            }

            if (data.searchHistory && Array.isArray(data.searchHistory)) {
                localStorage.setItem('search-history', JSON.stringify(data.searchHistory));
                importedCount++;
            }

            if (data.preferences && typeof data.preferences === 'object') {
                const existing = localStorage.getItem('user-preferences');
                const existingPrefs = existing ? JSON.parse(existing) : {};
                const merged = { ...existingPrefs, ...data.preferences };
                localStorage.setItem('user-preferences', JSON.stringify(merged));
                importedCount++;
            }

            if (data.bookmarks && Array.isArray(data.bookmarks)) {
                localStorage.setItem('bookmarks', JSON.stringify(data.bookmarks));
                importedCount++;
            }

            if (data.claims && Array.isArray(data.claims)) {
                localStorage.setItem('planet-claims', JSON.stringify(data.claims));
                importedCount++;
            }

            // Apply theme if imported
            if (data.preferences?.theme) {
                localStorage.setItem('theme-preference', data.preferences.theme);
                // Trigger theme change
                if (window.themeToggle && typeof window.themeToggle === 'function') {
                    const theme = window.themeToggle();
                    if (theme && theme.setTheme) {
                        theme.setTheme(data.preferences.theme);
                    }
                }
            }

            // Apply language if imported
            if (data.preferences?.language) {
                localStorage.setItem('language-preference', data.preferences.language);
                // Trigger language change
                if (window.i18n && typeof window.i18n === 'function') {
                    const i18n = window.i18n();
                    if (i18n && i18n.setLanguage) {
                        i18n.setLanguage(data.preferences.language);
                    }
                }
            }

            this.showNotification(`Successfully imported ${importedCount} data categories!`, 'success');
            
            // Reload page to apply changes
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('Failed to import user data:', error);
            this.showNotification('Failed to import user data. Please check the file format.', 'error');
        }
    }

    /**
     * Show import confirmation
     */
    showImportConfirmation(data) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'import-confirmation-modal';
            modal.innerHTML = `
                <div class="import-confirmation-content">
                    <h3>Import User Data</h3>
                    <p>This will import data from:</p>
                    <div class="import-info">
                        <p><strong>Export Date:</strong> ${new Date(data.exportDate).toLocaleString()}</p>
                        <p><strong>Version:</strong> ${data.version}</p>
                        <p><strong>Data Categories:</strong></p>
                        <ul>
                            ${data.favorites ? `<li>Favorites (${data.favorites.length} items)</li>` : ''}
                            ${data.settings ? `<li>Settings</li>` : ''}
                            ${data.searchHistory ? `<li>Search History (${data.searchHistory.length} items)</li>` : ''}
                            ${data.preferences ? `<li>Preferences</li>` : ''}
                            ${data.bookmarks ? `<li>Bookmarks (${data.bookmarks.length} items)</li>` : ''}
                            ${data.claims ? `<li>Claims (${data.claims.length} items)</li>` : ''}
                        </ul>
                    </div>
                    <p class="import-warning">⚠️ This will overwrite your current data. Continue?</p>
                    <div class="import-actions">
                        <button class="import-confirm-btn">Import</button>
                        <button class="import-cancel-btn">Cancel</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            this.injectStyles();

            // Animate in
            requestAnimationFrame(() => {
                modal.style.opacity = '1';
            });

            // Event listeners
            modal.querySelector('.import-confirm-btn').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });

            modal.querySelector('.import-cancel-btn').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
        });
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `data-export-notification data-export-notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        this.injectStyles();

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });

        // Auto-remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('data-export-import-styles')) return;

        const style = document.createElement('style');
        style.id = 'data-export-import-styles';
        style.textContent = `
            .import-confirmation-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10003;
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .import-confirmation-content {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 16px;
                padding: 2rem;
                max-width: 500px;
                width: 90%;
                font-family: 'Raleway', sans-serif;
                color: white;
            }

            .import-confirmation-content h3 {
                color: #ba944f;
                margin-top: 0;
            }

            .import-info {
                background: rgba(186, 148, 79, 0.1);
                border-radius: 8px;
                padding: 1rem;
                margin: 1rem 0;
            }

            .import-info ul {
                margin: 0.5rem 0;
                padding-left: 1.5rem;
            }

            .import-warning {
                color: rgba(255, 215, 0, 0.9);
                font-weight: 600;
                margin: 1rem 0;
            }

            .import-actions {
                display: flex;
                gap: 1rem;
                margin-top: 1.5rem;
            }

            .import-confirm-btn,
            .import-cancel-btn {
                flex: 1;
                padding: 0.75rem 1.5rem;
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 8px;
                background: rgba(186, 148, 79, 0.1);
                color: white;
                font-family: 'Raleway', sans-serif;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.2s;
            }

            .import-confirm-btn {
                background: rgba(68, 255, 68, 0.2);
                border-color: rgba(68, 255, 68, 0.5);
            }

            .import-confirm-btn:hover {
                background: rgba(68, 255, 68, 0.3);
                border-color: rgba(68, 255, 68, 0.7);
            }

            .import-cancel-btn:hover {
                background: rgba(186, 148, 79, 0.2);
                border-color: rgba(186, 148, 79, 0.7);
            }

            .data-export-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 12px;
                padding: 1rem 1.5rem;
                color: white;
                font-family: 'Raleway', sans-serif;
                z-index: 10002;
                opacity: 0;
                transform: translateY(-20px);
                transition: all 0.3s ease;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            }

            .data-export-notification-success {
                border-color: rgba(68, 255, 68, 0.5);
            }

            .data-export-notification-error {
                border-color: rgba(220, 53, 69, 0.5);
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize globally
let userDataExportImportInstance = null;

function initUserDataExportImport() {
    if (!userDataExportImportInstance) {
        userDataExportImportInstance = new UserDataExportImport();
    }
    return userDataExportImportInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserDataExportImport);
} else {
    initUserDataExportImport();
}

// Export globally
window.UserDataExportImport = UserDataExportImport;
window.userDataExportImport = () => userDataExportImportInstance;

