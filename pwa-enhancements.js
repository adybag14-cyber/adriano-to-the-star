/**
 * PWA Enhancements
 * Better offline support, install prompts, app manifest improvements, service worker caching
 */

class PWAEnhancements {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = false;
        this.isOnline = navigator.onLine;
        this.offlineQueue = [];
        this.isInitialized = false;
        
        this.init();
    }

    /**
     * Initialize PWA enhancements
     */
    async init() {
        // Check if already installed
        this.checkInstallation();
        
        // Setup install prompt
        this.setupInstallPrompt();
        
        // Setup online/offline detection
        this.setupOnlineDetection();
        
        // Setup offline queue
        this.setupOfflineQueue();
        
        // Update service worker
        this.updateServiceWorker();
        
        this.isInitialized = true;
        console.log('📱 PWA Enhancements initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_wa_en_ha_nc_em_en_ts_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Check if app is installed
     */
    checkInstallation() {
        // Check if running as standalone (installed)
        if (window.matchMedia('(display-mode: standalone)').matches) {
            this.isInstalled = true;
            console.log('✅ App is installed');
        }

        // Check if running in iOS standalone mode
        if (window.navigator.standalone === true) {
            this.isInstalled = true;
            console.log('✅ App is installed (iOS)');
        }
    }

    /**
     * Setup install prompt
     */
    setupInstallPrompt() {
        // Listen for beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing
            e.preventDefault();
            
            // Store the event for later use
            this.deferredPrompt = e;
            
            // Show custom install button
            this.showInstallButton();
            
            console.log('📱 Install prompt available');
        });

        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.deferredPrompt = null;
            this.hideInstallButton();
            console.log('✅ App installed successfully');
            
            // Show welcome message
            this.showInstallSuccessMessage();
        });
    }

    /**
     * Show install button
     */
    showInstallButton() {
        // Check if button already exists
        if (document.getElementById('pwa-install-btn')) return;

        const button = document.createElement('button');
        button.id = 'pwa-install-btn';
        button.className = 'pwa-install-btn';
        button.innerHTML = '📱 Install App';
        button.style.cssText = `
            position: fixed;
            bottom: 140px;
            right: 20px;
            z-index: 9999;
            padding: 0.75rem 1.5rem;
            background: rgba(74, 144, 226, 0.2);
            border: 2px solid rgba(74, 144, 226, 0.5);
            color: #4a90e2;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Raleway', sans-serif;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
        `;

        button.addEventListener('click', () => {
            this.promptInstall();
        });

        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgba(74, 144, 226, 0.3)';
            button.style.transform = 'translateY(-2px)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(74, 144, 226, 0.2)';
            button.style.transform = 'translateY(0)';
        });

        document.body.appendChild(button);
    }

    /**
     * Hide install button
     */
    hideInstallButton() {
        const button = document.getElementById('pwa-install-btn');
        if (button) {
            button.remove();
        }
    }

    /**
     * Prompt user to install
     */
    async promptInstall() {
        if (!this.deferredPrompt) {
            // Show instructions for manual install
            this.showManualInstallInstructions();
            return;
        }

        // Show the install prompt
        this.deferredPrompt.prompt();

        // Wait for user response
        const { outcome } = await this.deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('✅ User accepted install prompt');
        } else {
            console.log('❌ User dismissed install prompt');
        }

        // Clear the deferred prompt
        this.deferredPrompt = null;
        this.hideInstallButton();
    }

    /**
     * Show manual install instructions
     */
    showManualInstallInstructions() {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const isAndroid = /Android/.test(navigator.userAgent);

        let instructions = '';

        if (isIOS) {
            instructions = `
                <h3>📱 Install on iOS</h3>
                <ol style="text-align: left; line-height: 2;">
                    <li>Tap the Share button <span style="font-size: 1.2rem;">📤</span> at the bottom</li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" to confirm</li>
                </ol>
            `;
        } else if (isAndroid) {
            instructions = `
                <h3>📱 Install on Android</h3>
                <ol style="text-align: left; line-height: 2;">
                    <li>Tap the menu <span style="font-size: 1.2rem;">⋮</span> in your browser</li>
                    <li>Select "Add to Home screen" or "Install app"</li>
                    <li>Tap "Install" to confirm</li>
                </ol>
            `;
        } else {
            instructions = `
                <h3>📱 Install Instructions</h3>
                <p>Look for an install icon in your browser's address bar, or check your browser's menu for "Install" or "Add to Home Screen" options.</p>
            `;
        }

        const modal = document.createElement('div');
        modal.className = 'pwa-install-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        modal.innerHTML = `
            <div style="background: rgba(0,0,0,0.9); border: 2px solid #ba944f; border-radius: 12px; padding: 2rem; max-width: 500px; width: 90%; color: #fff; text-align: center;">
                <h2 style="color: #ba944f; margin: 0 0 1.5rem 0; font-family: 'Cormorant Garamond', serif;">Install App</h2>
                ${instructions}
                <button id="close-install-modal" style="margin-top: 2rem; background: #ba944f; color: #000; border: none; padding: 0.75rem 2rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Got it!
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-install-modal').addEventListener('click', () => {
            modal.remove();
        });
    }

    /**
     * Show install success message
     */
    showInstallSuccessMessage() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(20,20,30,0.98));
            border: 2px solid #4a90e2;
            border-radius: 12px;
            padding: 1.5rem;
            max-width: 400px;
            z-index: 10000;
            box-shadow: 0 10px 30px rgba(74, 144, 226, 0.5);
            animation: slideIn 0.5s ease;
        `;

        notification.innerHTML = `
            <h3 style="color: #4a90e2; margin: 0 0 0.5rem 0;">🎉 App Installed!</h3>
            <p style="color: rgba(255,255,255,0.9); margin: 0;">Thank you for installing! You can now access the app offline.</p>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    /**
     * Setup online/offline detection
     */
    setupOnlineDetection() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('✅ Back online');
            this.showOnlineNotification();
            this.processOfflineQueue();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('⚠️ Gone offline');
            this.showOfflineNotification();
        });
    }

    /**
     * Show online notification
     */
    showOnlineNotification() {
        this.showStatusNotification('✅ Back online', 'success');
    }

    /**
     * Show offline notification
     */
    showOfflineNotification() {
        this.showStatusNotification('⚠️ You are offline. Some features may be limited.', 'warning');
    }

    /**
     * Show status notification
     */
    showStatusNotification(message, type) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid ${type === 'success' ? '#4a90e2' : '#ffc800'};
            border-radius: 8px;
            padding: 1rem 1.5rem;
            color: #fff;
            font-family: 'Raleway', sans-serif;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Setup offline queue
     */
    setupOfflineQueue() {
        // Queue actions when offline
        this.offlineQueue = JSON.parse(localStorage.getItem('pwa-offline-queue') || '[]');
    }

    /**
     * Add to offline queue
     */
    addToOfflineQueue(action) {
        this.offlineQueue.push({
            ...action,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('pwa-offline-queue', JSON.stringify(this.offlineQueue));
    }

    /**
     * Process offline queue
     */
    async processOfflineQueue() {
        if (this.offlineQueue.length === 0) return;

        console.log(`📤 Processing ${this.offlineQueue.length} queued actions...`);

        const processed = [];
        for (const action of this.offlineQueue) {
            try {
                // Process action (e.g., sync with server)
                await this.processQueuedAction(action);
                processed.push(action);
            } catch (error) {
                console.error('Error processing queued action:', error);
            }
        }

        // Remove processed actions
        this.offlineQueue = this.offlineQueue.filter(a => !processed.includes(a));
        localStorage.setItem('pwa-offline-queue', JSON.stringify(this.offlineQueue));

        if (processed.length > 0) {
            this.showStatusNotification(`✅ Synced ${processed.length} queued actions`, 'success');
        }
    }

    /**
     * Process queued action
     */
    async processQueuedAction(action) {
        // In production, this would sync with the server
        // For now, just log it
        console.log('Processing queued action:', action);
    }

    /**
     * Update service worker
     */
    async updateServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                
                // Check for updates
                registration.update();
                
                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New service worker available
                                this.showUpdateAvailable();
                            }
                        });
                    }
                });
            } catch (error) {
                console.error('Service worker update error:', error);
            }
        }
    }

    /**
     * Show update available notification
     */
    showUpdateAvailable() {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #ba944f;
            border-radius: 8px;
            padding: 1rem 1.5rem;
            color: #fff;
            font-family: 'Raleway', sans-serif;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            gap: 1rem;
        `;

        notification.innerHTML = `
            <span>🔄 Update available</span>
            <button id="reload-app-btn" style="background: #ba944f; color: #000; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Reload
            </button>
        `;

        document.body.appendChild(notification);

        document.getElementById('reload-app-btn').addEventListener('click', () => {
            window.location.reload();
        });
    }

    /**
     * Get PWA status
     */
    getPWAStatus() {
        return {
            isInstalled: this.isInstalled,
            isOnline: this.isOnline,
            canInstall: !!this.deferredPrompt,
            offlineQueueSize: this.offlineQueue.length
        };
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.pwaEnhancements = new PWAEnhancements();
    
    // Make available globally
    window.getPWAEnhancements = () => window.pwaEnhancements;
}

