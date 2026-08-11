/**
 * Global Configuration
 * Central source of truth for application settings and URLs.
 */
const AppConfig = {
    urls: {
        r2Base: 'https://starisdons-swf-worker.adybag14.workers.dev',
        nasaApi: 'https://api.nasa.gov/',
        // Add other URLs here as needed
    },
    settings: {
        debugMode: true,
        version: '1.0.0'
    }
};

// Freeze to prevent modification
Object.freeze(AppConfig);

// Export for module usage if needed, but also available globally
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
} else {
    window.AppConfig = AppConfig;
}
