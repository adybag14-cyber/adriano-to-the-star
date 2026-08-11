/**
 * Post-Loader Fix
 * Ensures all content is visible and clickable after loader completes
 * Runs aggressively to fix any loader-related issues
 */

(function() {
    'use strict';

    function forceContentVisible() {
        // Remove ALL loader elements completely
        const allLoaders = document.querySelectorAll('#space-loader, [id*="space-loader"], .space-loader');
        allLoaders.forEach(loader => {
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
                    // Ignore errors
                }
            }
        });

        // Force body and html to allow interactions
        if (document.body) {
            document.body.style.cssText = `
                overflow-y: auto !important;
                overflow-x: hidden !important;
                pointer-events: auto !important;
                position: relative !important;
            `;
            document.body.classList.add('loaded');
        }

        if (document.documentElement) {
            document.documentElement.style.cssText = `
                overflow-y: auto !important;
                overflow-x: hidden !important;
                pointer-events: auto !important;
            `;
        }

        // Force main content visible
        const main = document.getElementById('main');
        if (main) {
            main.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                pointer-events: auto !important;
                z-index: 1 !important;
                position: relative !important;
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

        // Force ALL buttons and interactive elements clickable
        const buttons = document.querySelectorAll('button, a, input, select, textarea, [onclick], [role="button"], [tabindex]');
        buttons.forEach(btn => {
            btn.style.cssText = `
                pointer-events: auto !important;
                opacity: 1 !important;
                visibility: visible !important;
                cursor: pointer !important;
                z-index: 10 !important;
            `;
        });

        // Force music player visible and on top
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
            
            // Also make all buttons inside music player clickable
            const playerButtons = musicPlayer.querySelectorAll('button, input, [onclick]');
            playerButtons.forEach(btn => {
                btn.style.cssText = `
                    pointer-events: auto !important;
                    cursor: pointer !important;
                    z-index: 10001 !important;
                `;
            });
        }

        // Force all widgets visible
        const widgets = document.querySelectorAll(
            '.widget, .dashboard-widget, #analytics-container, #customizable-dashboard-container, [class*="widget"], [id*="widget"]'
        );
        widgets.forEach(widget => {
            widget.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                pointer-events: auto !important;
                z-index: 5 !important;
            `;
        });

        console.log('✅ Post-loader fix applied - all content should be visible and clickable');
    }

    // Run immediately - don't wait
    forceContentVisible();

    // Run immediately again after a tiny delay
    setTimeout(forceContentVisible, 10);
    setTimeout(forceContentVisible, 50);

    // Run on multiple events
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceContentVisible);
    } else {
        // Already loaded, run immediately
        forceContentVisible();
    }
    window.addEventListener('load', forceContentVisible);

    // Run at intervals to catch any late-loading content - more aggressive
    const intervals = [100, 200, 500, 1000, 1500, 2000, 3000, 5000];
    intervals.forEach(time => {
        setTimeout(forceContentVisible, time);
    });

    // Watch for loader removal and ensure content is visible
    const observer = new MutationObserver(() => {
        const loader = document.getElementById('space-loader');
        if (!loader || !loader.parentNode || loader.classList.contains('fade-out')) {
            forceContentVisible();
        }
    });

    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style']
        });
    }

    // Continuous check for 15 seconds - more aggressive
    let checkCount = 0;
    const maxChecks = 150; // 15 seconds
    const checkInterval = setInterval(() => {
        checkCount++;
        forceContentVisible();
        if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
        }
    }, 100);
    
    // Emergency force after 5 seconds - remove loader no matter what
    setTimeout(() => {
        console.log('Emergency: Forcing all content visible');
        forceContentVisible();
        
        // Remove loader with extreme prejudice
        const allLoaders = document.querySelectorAll('#space-loader, [id*="space-loader"], .space-loader');
        allLoaders.forEach(loader => {
            loader.remove();
        });
        
        // Force body loaded
        if (document.body) {
            document.body.classList.add('loaded');
        }
    }, 5000);
})();

