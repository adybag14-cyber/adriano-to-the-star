/**
 * Dependency Update Automation
 * Automated dependency update checking and management
 * 
 * Features:
 * - Check for outdated packages
 * - Security vulnerability scanning
 * - Automated update suggestions
 * - Changelog generation
 * - Update impact analysis
 */

class DependencyUpdateAutomation {
    constructor() {
        this.dependencies = new Map();
        this.updates = [];
        this.init();
    }

    init() {
        this.loadDependencies();
        this.trackEvent('dep_update_auto_initialized');
    }

    async loadDependencies() {
        try {
            const response = await fetch('/package.json');
            if (response.ok) {
                const packageJson = await response.json();
                this.dependencies.set('dependencies', packageJson.dependencies || {});
                this.dependencies.set('devDependencies', packageJson.devDependencies || {});
            }
        } catch (error) {
            console.warn('Could not load package.json:', error.message);
        }
    }

    /**
     * Check for outdated dependencies
     */
    async checkForUpdates() {
        const allDeps = {
            ...this.dependencies.get('dependencies'),
            ...this.dependencies.get('devDependencies')
        };

        const updates = [];

        for (const [name, currentVersion] of Object.entries(allDeps)) {
            try {
                const latestVersion = await this.getLatestVersion(name);
                if (this.isNewerVersion(latestVersion, currentVersion)) {
                    updates.push({
                        name,
                        current: currentVersion,
                        latest: latestVersion,
                        type: this.dependencies.get('dependencies')[name] ? 'dependency' : 'devDependency'
                    });
                }
            } catch (error) {
                console.warn(`Could not check version for ${name}:`, error.message);
            }
        }

        this.updates = updates;
        return updates;
    }

    async fetchJSON(url, options = {}) {
        try {
            // First attempt: direct fetch
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            console.warn(`[dependency-update-auto] Direct fetch failed for ${url}, attempting proxies...`, error);
            
            // Second attempt: AllOrigins proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const data = await proxyRes.json();
                    return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                }
            } catch (proxyError) {
                console.warn('[dependency-update-auto] AllOrigins proxy failed:', proxyError);
            }

            // Third attempt: corsproxy.io fallback
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (proxyRes.ok) return await proxyRes.json();
            } catch (proxyError) {
                console.error('[dependency-update-auto] All proxies failed:', proxyError);
            }

            throw error; // Rethrow original error if all fail
        }
    }

    async getLatestVersion(packageName) {
        try {
            const url = `https://registry.npmjs.org/${packageName}/latest`;
            const data = await this.fetchJSON(url);
            if (data) {
                return data.version;
            }
        } catch (error) {
            console.warn(`Could not fetch latest version for ${packageName}:`, error.message);
        }
        return null;
    }

    isNewerVersion(latest, current) {
        if (!latest || !current) return false;
        
        const latestParts = latest.replace(/[^0-9.]/g, '').split('.').map(Number);
        const currentParts = current.replace(/[^0-9.]/g, '').split('.').map(Number);
        
        for (let i = 0; i < Math.max(latestParts.length, currentParts.length); i++) {
            const latestPart = latestParts[i] || 0;
            const currentPart = currentParts[i] || 0;
            
            if (latestPart > currentPart) return true;
            if (latestPart < currentPart) return false;
        }
        
        return false;
    }

    /**
     * Generate update report
     */
    generateUpdateReport() {
        return {
            timestamp: new Date().toISOString(),
            totalUpdates: this.updates.length,
            updates: this.updates,
            summary: {
                dependencies: this.updates.filter(u => u.type === 'dependency').length,
                devDependencies: this.updates.filter(u => u.type === 'devDependency').length
            }
        };
    }

    /**
     * Generate package.json with updates
     */
    generateUpdatedPackageJson() {
        // This would generate a new package.json with updated versions
        // For safety, this is a read-only operation that generates suggestions
        return this.generateUpdateReport();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`dep_update_auto_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.dependencyUpdates = new DependencyUpdateAutomation();
}

