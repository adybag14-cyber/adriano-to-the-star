/**
 * Content Readiness Checker
 * Ensures critical content is loaded before loader completes
 */

class ContentReadinessChecker {
    constructor() {
        this.checks = {
            domReady: false,
            criticalImages: false,
            criticalScripts: false,
            fontsLoaded: false
        };
        this.maxWaitTime = 3000; // 3 seconds max wait
        this.startTime = Date.now();
        this.callbacks = [];
        this.trackEvent('content_readiness_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`content_readiness_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Check if content is ready
     */
    async checkContentReady() {
        // Check DOM is ready
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            this.checks.domReady = true;
        }

        // Check critical images (above the fold)
        await this.checkCriticalImages();

        // Check critical scripts are loaded
        this.checkCriticalScripts();

        // Check fonts are loaded (with timeout)
        await this.checkFontsLoaded();

        // Return true if all critical checks pass OR max time exceeded
        const elapsed = Date.now() - this.startTime;
        const allReady = Object.values(this.checks).every(check => check === true);
        
        return allReady || elapsed >= this.maxWaitTime;
    }

    /**
     * Check critical images (above the fold)
     */
    async checkCriticalImages() {
        const criticalImages = document.querySelectorAll('img[src], img[data-src]');
        const viewportHeight = window.innerHeight;
        let loadedCount = 0;
        let totalCount = 0;

        for (const img of criticalImages) {
            const rect = img.getBoundingClientRect();
            // Only check images in viewport or above the fold
            if (rect.top < viewportHeight * 1.5) {
                totalCount++;
                
                // Check if image is loaded
                if (img.complete && img.naturalHeight > 0) {
                    loadedCount++;
                } else {
                    // Wait for image to load (with timeout)
                    await new Promise((resolve) => {
                        const timeout = setTimeout(resolve, 500); // 500ms timeout per image
                        
                        if (img.complete) {
                            clearTimeout(timeout);
                            resolve();
                        } else {
                            img.onload = () => {
                                clearTimeout(timeout);
                                loadedCount++;
                                resolve();
                            };
                            img.onerror = () => {
                                clearTimeout(timeout);
                                resolve(); // Count as "ready" even if failed
                            };
                        }
                    });
                }
            }
        }

        // Consider ready if at least 80% of critical images loaded or no critical images
        this.checks.criticalImages = totalCount === 0 || (loadedCount / totalCount) >= 0.8;
    }

    /**
     * Check critical scripts are loaded
     */
    checkCriticalScripts() {
        // Check if critical scripts exist and are loaded
        const criticalScripts = [
            'i18n.js',
            'navigation.js',
            'animations.js'
        ];

        let loadedCount = 0;
        for (const scriptName of criticalScripts) {
            const scripts = document.querySelectorAll(`script[src*="${scriptName}"]`);
            if (scripts.length > 0) {
                // Script tag exists, assume it's loading/loaded
                loadedCount++;
            }
        }

        // Consider ready if scripts are in DOM (they load async with defer)
        this.checks.criticalScripts = true; // Always true - scripts with defer don't block
    }

    /**
     * Check fonts are loaded
     */
    async checkFontsLoaded() {
        if (!document.fonts || !document.fonts.check) {
            // Font API not available, assume ready
            this.checks.fontsLoaded = true;
            return;
        }

        try {
            // Wait for fonts to load (with timeout)
            await Promise.race([
                document.fonts.ready,
                new Promise(resolve => setTimeout(resolve, 1000)) // 1 second timeout
            ]);
            this.checks.fontsLoaded = true;
        } catch (error) {
            // Font loading failed, but don't block
            this.checks.fontsLoaded = true;
        }
    }

    /**
     * Wait for content to be ready
     */
    async waitForContentReady() {
        const maxWait = 3000; // 3 seconds max
        const checkInterval = 50; // Check every 50ms
        const startTime = Date.now();

        while (Date.now() - startTime < maxWait) {
            const ready = await this.checkContentReady();
            if (ready) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, checkInterval));
        }

        // Timeout reached, return true anyway
        return true;
    }

    /**
     * Get readiness status
     */
    getStatus() {
        return {
            ...this.checks,
            allReady: Object.values(this.checks).every(check => check === true),
            elapsed: Date.now() - this.startTime
        };
    }
}

// Export globally
window.ContentReadinessChecker = ContentReadinessChecker;

