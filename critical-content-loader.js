/**
 * Critical Content Loader
 * Ensures above-the-fold content loads immediately (not lazy)
 */

class CriticalContentLoader {
    constructor() {
        this.viewportHeight = window.innerHeight;
        this.init();
    }

    init() {
        // Load critical images immediately
        this.loadCriticalImages();
        
        // Ensure main content is visible
        this.ensureMainContentVisible();
        this.trackEvent('critical_content_initialized');
    }

    /**
     * Load critical images (above the fold) immediately
     */
    loadCriticalImages() {
        // Load ALL images initially, prioritize above-the-fold
        const allImages = document.querySelectorAll('img');
        
        allImages.forEach(img => {
            const rect = img.getBoundingClientRect();
            const isAboveFold = rect.top < this.viewportHeight * 2; // More generous threshold
            
            // Always ensure images are visible
            img.style.opacity = '1';
            img.style.visibility = 'visible';
            
            if (isAboveFold) {
                // Load immediately - don't lazy load
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                img.removeAttribute('loading');
                
                // Remove lazy loading class
                img.classList.remove('lazy-loading');
                
                // Force image to load
                if (img.src && !img.complete) {
                    const newImg = new Image();
                    newImg.src = img.src;
                }
            }
        });
    }

    /**
     * Ensure main content is visible
     */
    ensureMainContentVisible() {
        const main = document.getElementById('main');
        if (main) {
            main.style.opacity = '1';
            main.style.visibility = 'visible';
            main.style.display = 'block';
        }

        // Make all sections visible
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.style.opacity = '1';
            section.style.visibility = 'visible';
            section.style.display = 'block';
        });
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`critical_content_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new CriticalContentLoader();
    });
} else {
    new CriticalContentLoader();
}

