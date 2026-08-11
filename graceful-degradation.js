/**
 * Graceful Degradation
 * Implements graceful degradation for unsupported features
 */

class GracefulDegradation {
    constructor() {
        this.init();
    }
    
    init() {
        this.detectCapabilities();
        this.applyDegradations();
    }
    
    detectCapabilities() {
        // Detect browser capabilities
        this.capabilities = {
            javascript: typeof window !== 'undefined',
            css: typeof document !== 'undefined',
            localStorage: 'localStorage' in window,
            sessionStorage: 'sessionStorage' in window,
            geolocation: 'geolocation' in navigator
        };
    }
    
    applyDegradations() {
        // Apply graceful degradations
        if (!this.capabilities.localStorage) {
            this.useCookieFallback();
        }
        
        if (!this.capabilities.geolocation) {
            this.useIPBasedLocation();
        }
    }
    
    useCookieFallback() {
        // Use cookies instead of localStorage
        window.storage = {
            getItem: (key) => {
                const cookies = document.cookie.split(';');
                for (const cookie of cookies) {
                    const [name, value] = cookie.trim().split('=');
                    if (name === key) return decodeURIComponent(value);
                }
                return null;
            },
            setItem: (key, value) => {
                document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000`;
            }
        };
    }
    
    useIPBasedLocation() {
        // Use IP-based location as fallback
        // Would call IP geolocation service
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.gracefulDegradation = new GracefulDegradation(); });
} else {
    window.gracefulDegradation = new GracefulDegradation();
}

