/**
 * Resource Error Handler
 * Handles failed resource loads gracefully
 */

class ResourceErrorHandler {
    constructor() {
        this.failedResources = new Set();
        this.init();
    }

    init() {
        // Handle image load errors
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                this.handleImageError(e.target);
            } else if (e.target.tagName === 'SCRIPT') {
                this.handleScriptError(e.target);
            } else if (e.target.tagName === 'LINK' && e.target.rel === 'stylesheet') {
                this.handleStylesheetError(e.target);
            }
        }, true); // Use capture phase

        // Handle network errors
        window.addEventListener('unhandledrejection', (e) => {
            if (e.reason && e.reason.message && e.reason.message.includes('fetch')) {
                console.warn('Network request failed:', e.reason);
                // Don't block page - just log
            }
        });
    }

    /**
     * Handle image load errors
     */
    handleImageError(img) {
        if (this.failedResources.has(img.src)) {
            return; // Already handled
        }
        this.failedResources.add(img.src);

        // Replace with placeholder
        img.style.opacity = '0.5';
        img.alt = img.alt || 'Image failed to load';
        
        // Try to load a fallback if available
        if (img.dataset.fallback) {
            img.src = img.dataset.fallback;
        } else {
            // Use a simple placeholder
            img.style.backgroundColor = '#1a1a1a';
            img.style.minHeight = '200px';
        }

        console.warn('Image failed to load:', img.src);
    }

    /**
     * Handle script load errors
     */
    handleScriptError(script) {
        if (this.failedResources.has(script.src)) {
            return;
        }
        this.failedResources.add(script.src);

        console.warn('Script failed to load:', script.src);
        // Scripts with defer won't block, so just log
    }

    /**
     * Handle stylesheet load errors
     */
    handleStylesheetError(link) {
        if (this.failedResources.has(link.href)) {
            return;
        }
        this.failedResources.add(link.href);

        console.warn('Stylesheet failed to load:', link.href);
        // Stylesheets are non-blocking, so just log
    }
}

// Initialize error handler
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ResourceErrorHandler();
    });
} else {
    new ResourceErrorHandler();
}

