/**
 * Content Ensurer
 * Aggressively ensures all content is visible and loaded after loader completes
 */

(function() {
    'use strict';

    function ensureContentVisible() {
        // Force main content visible
        const main = document.getElementById('main');
        if (main) {
            main.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                pointer-events: auto !important;
                z-index: 1 !important;
            `;
        }

        // Force all sections visible
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                pointer-events: auto !important;
            `;
        });

        // Force ALL images to load and be visible (not just lazy-loaded ones)
        const allImages = document.querySelectorAll('img');
        allImages.forEach(img => {
            // Handle lazy-loaded images
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
            
            // Remove lazy loading attributes
            img.removeAttribute('loading');
            img.removeAttribute('data-lazy');
            
            // Force visibility
            img.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                display: inline-block !important;
            `;
            
            // Force image to load if it has a src but isn't loaded
            if (img.src && !img.complete) {
                const newImg = new Image();
                newImg.onload = () => {
                    img.src = newImg.src;
                };
                newImg.src = img.src;
            }
        });

        // Force widgets and dashboard containers to be visible
        const widgetContainers = document.querySelectorAll(
            '#analytics-container, #customizable-dashboard-container, .widget-container, .dashboard-widget, [class*="widget"], .widget, [id*="widget"]'
        );
        widgetContainers.forEach(container => {
            container.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                pointer-events: auto !important;
            `;
        });

        // Force music player visible
        const musicPlayer = document.getElementById('cosmic-music-player');
        if (musicPlayer) {
            musicPlayer.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                pointer-events: auto !important;
                z-index: 1000 !important;
            `;
        }

        // Force all buttons and interactive elements clickable
        const buttons = document.querySelectorAll('button, a, input, [onclick], [role="button"]');
        buttons.forEach(btn => {
            btn.style.cssText = `
                pointer-events: auto !important;
                opacity: 1 !important;
                visibility: visible !important;
                cursor: pointer !important;
            `;
        });

        // Ensure body is loaded
        if (document.body) {
            document.body.classList.add('loaded');
            document.body.style.cssText = `
                overflow-y: auto !important;
                overflow-x: hidden !important;
                pointer-events: auto !important;
            `;
        }

        // Ensure html is loaded
        if (document.documentElement) {
            document.documentElement.style.cssText = `
                overflow-y: auto !important;
                overflow-x: hidden !important;
                pointer-events: auto !important;
            `;
        }

        console.log('✅ Content visibility enforced');
    }

    // Run immediately
    ensureContentVisible();

    // Run on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureContentVisible);
    }

    // Run on window load
    window.addEventListener('load', ensureContentVisible);

    // Run multiple times to ensure it works
    setTimeout(ensureContentVisible, 100);
    setTimeout(ensureContentVisible, 500);
    setTimeout(ensureContentVisible, 1000);
    setTimeout(ensureContentVisible, 2000);

    // Watch for body.loaded class
    const observer = new MutationObserver(() => {
        if (document.body && document.body.classList.contains('loaded')) {
            ensureContentVisible();
        }
    });

    if (document.body) {
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    // Continuous check for first 10 seconds (more aggressive)
    let checkCount = 0;
    const maxChecks = 100; // 10 seconds
    const checkInterval = setInterval(() => {
        checkCount++;
        ensureContentVisible();
        
        if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
        }
    }, 100);

    // Also watch for loader completion and run immediately
    const loaderObserver = new MutationObserver(() => {
        const loader = document.getElementById('space-loader');
        if (!loader || loader.classList.contains('fade-out') || !loader.parentNode) {
            // Loader is gone, ensure content is visible
            ensureContentVisible();
            // Run multiple times after loader is gone
            setTimeout(ensureContentVisible, 50);
            setTimeout(ensureContentVisible, 200);
            setTimeout(ensureContentVisible, 500);
        }
    });

    // Watch for loader removal
    if (document.body) {
        loaderObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
    }

    // Final aggressive check after 3 seconds (after loader should be gone)
    setTimeout(() => {
        ensureContentVisible();
        // Force all images to reload if they failed
        const allImages = document.querySelectorAll('img');
        allImages.forEach(img => {
            if (img.src && !img.complete && img.naturalHeight === 0) {
                // Image failed to load, try reloading
                const originalSrc = img.src;
                img.src = '';
                setTimeout(() => {
                    img.src = originalSrc;
                }, 100);
            }
        });
        
        // Force remove any remaining loader elements
        const remainingLoaders = document.querySelectorAll('#space-loader, [id*="space-loader"]');
        remainingLoaders.forEach(loader => {
            loader.style.cssText = `
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
                z-index: -99999 !important;
                position: absolute !important;
                top: -9999px !important;
                left: -9999px !important;
                width: 0 !important;
                height: 0 !important;
            `;
            if (loader.parentNode) {
                try {
                    loader.parentNode.removeChild(loader);
                } catch (e) {
                    console.warn('Error removing loader:', e);
                }
            }
        });
        
        // Ensure music player is visible
        const musicPlayer = document.getElementById('cosmic-music-player');
        if (musicPlayer) {
            musicPlayer.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                pointer-events: auto !important;
                z-index: 10000 !important;
                position: fixed !important;
            `;
        }
    }, 3000);
})();


