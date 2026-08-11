/**
 * App Shell Architecture
 * Implements app shell architecture for instant loading
 */

class AppShellArchitecture {
    constructor() {
        this.shell = null;
        this.init();
    }
    
    init() {
        this.createAppShell();
        this.cacheShell();
        this.trackEvent('shell_initialized');
    }
    
    createAppShell() {
        // Create app shell structure
        this.shell = {
            header: document.querySelector('header') || document.createElement('header'),
            nav: document.querySelector('nav') || document.createElement('nav'),
            main: document.querySelector('main') || document.createElement('main'),
            footer: document.querySelector('footer') || document.createElement('footer')
        };
    }
    
    cacheShell() {
        // Cache app shell in service worker
        if ('serviceWorker' in navigator && 'caches' in window) {
            caches.open('app-shell').then(cache => {
                const shellResources = [
                    '/',
                    '/styles.css',
                    '/shell.js'
                ];
                cache.addAll(shellResources);
            });
        }
    }
    
    loadShell() {
        // Load app shell instantly
        // Shell is already in DOM, just ensure it's visible
        Object.values(this.shell).forEach(element => {
            if (element) {
                element.style.display = '';
            }
        });
    }
    
    loadContent() {
        // Load dynamic content after shell
        // This happens after shell is displayed
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`app_shell_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.appShellArchitecture = new AppShellArchitecture(); });
} else {
    window.appShellArchitecture = new AppShellArchitecture();
}

