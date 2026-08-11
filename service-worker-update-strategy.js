/**
 * Service Worker Update Strategy and Version Management
 * 
 * Implements comprehensive service worker update strategy and version management.
 * 
 * @module ServiceWorkerUpdateStrategy
 * @version 1.0.0
 * @author Adriano To The Star
 */

class ServiceWorkerUpdateStrategy {
    constructor() {
        this.registration = null;
        this.updateCheckInterval = null;
        this.version = '1.0.0';
        this.isInitialized = false;
    }

    /**
     * Initialize service worker update system
     * @public
     */
    async init() {
        if (this.isInitialized) {
            console.warn('ServiceWorkerUpdateStrategy already initialized');
            return;
        }

        if (!('serviceWorker' in navigator)) {
            console.warn('Service workers not supported');
            return;
        }

        await this.registerServiceWorker();
        this.setupUpdateChecks();
        this.setupUpdateHandlers();
        
        this.isInitialized = true;
        console.log('✅ Service Worker Update Strategy initialized');
    }

    /**
     * Register service worker
     * @private
     */
    async registerServiceWorker() {
        try {
            this.registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none' // Always check for updates
            });

            console.log('Service Worker registered:', this.registration.scope);

            // Check for updates immediately
            await this.checkForUpdates();
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }

    /**
     * Set up update checks
     * @private
     */
    setupUpdateChecks() {
        // Check for updates every hour
        this.updateCheckInterval = setInterval(() => {
            this.checkForUpdates();
        }, 60 * 60 * 1000);

        // Check when page becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkForUpdates();
            }
        });

        // Check when online
        window.addEventListener('online', () => {
            this.checkForUpdates();
        });
    }

    /**
     * Set up update handlers
     * @private
     */
    setupUpdateHandlers() {
        if (!this.registration) {
            return;
        }

        // Listen for service worker updates
        this.registration.addEventListener('updatefound', () => {
            const newWorker = this.registration.installing;
            if (!newWorker) {
                return;
            }

            console.log('New service worker found, installing...');

            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                        // New service worker available
                        this.showUpdateAvailable();
                    } else {
                        // First time installation
                        console.log('Service Worker installed for the first time');
                    }
                }
            });
        });

        // Listen for controller change (update activated)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker updated, reloading page...');
            window.location.reload();
        });
    }

    /**
     * Check for updates
     * @public
     * @returns {Promise<boolean>} True if update available
     */
    async checkForUpdates() {
        if (!this.registration) {
            return false;
        }

        try {
            await this.registration.update();
            return this.registration.waiting !== null;
        } catch (error) {
            console.error('Failed to check for updates:', error);
            return false;
        }
    }

    /**
     * Show update available notification
     * @private
     */
    showUpdateAvailable() {
        // Create update notification
        const notification = document.createElement('div');
        notification.id = 'sw-update-notification';
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            border: 2px solid #ba944f;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        `;
        notification.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <strong style="color: #ba944f;">Update Available</strong>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
                    A new version is available. Update now?
                </p>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button id="sw-update-now" style="
                    flex: 1;
                    padding: 0.5rem 1rem;
                    background: #ba944f;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                ">Update Now</button>
                <button id="sw-update-later" style="
                    flex: 1;
                    padding: 0.5rem 1rem;
                    background: transparent;
                    color: white;
                    border: 1px solid rgba(255, 255, 255, 0.3);
                    border-radius: 4px;
                    cursor: pointer;
                ">Later</button>
            </div>
        `;

        document.body.appendChild(notification);

        // Update now button
        notification.querySelector('#sw-update-now').addEventListener('click', () => {
            this.applyUpdate();
        });

        // Update later button
        notification.querySelector('#sw-update-later').addEventListener('click', () => {
            notification.remove();
        });
    }

    /**
     * Apply update
     * @public
     */
    applyUpdate() {
        if (!this.registration || !this.registration.waiting) {
            return;
        }

        // Tell service worker to skip waiting
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Remove notification
        const notification = document.getElementById('sw-update-notification');
        if (notification) {
            notification.remove();
        }
    }

    /**
     * Get current version
     * @public
     * @returns {string} Current version
     */
    getVersion() {
        return this.version;
    }

    /**
     * Set version
     * @public
     * @param {string} version - Version string
     */
    setVersion(version) {
        this.version = version;
        localStorage.setItem('sw-version', version);
    }

    /**
     * Unregister service worker
     * @public
     * @returns {Promise<boolean>} True if unregistered
     */
    async unregister() {
        if (!this.registration) {
            return false;
        }

        try {
            const unregistered = await this.registration.unregister();
            if (unregistered) {
                this.registration = null;
                if (this.updateCheckInterval) {
                    clearInterval(this.updateCheckInterval);
                }
            }
            return unregistered;
        } catch (error) {
            console.error('Failed to unregister service worker:', error);
            return false;
        }
    }
}

// Create global instance
window.ServiceWorkerUpdateStrategy = ServiceWorkerUpdateStrategy;
window.serviceWorkerUpdates = new ServiceWorkerUpdateStrategy();
window.serviceWorkerUpdates.init();

