/**
 * Emergency Page Loader
 * This script ensures the page ALWAYS loads, even if the main loader fails
 * Runs immediately and bypasses any blocking loaders
 */

(function() {
    'use strict';
    
    console.log('🚨 Emergency Page Loader: Starting...');
    
    function forcePageLoad() {
        console.log('🚨 Emergency Page Loader: Forcing page to load');
        
        // Remove ALL loader elements immediately
        const allLoaders = document.querySelectorAll('#space-loader, [id*="space-loader"], .space-loader, #loader');
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
            try {
                if (loader.parentNode) {
                    loader.parentNode.removeChild(loader);
                }
            } catch (e) {
                // Ignore
            }
        });
        
        // Force body to be loaded and scrollable
        if (document.body) {
            document.body.classList.add('loaded');
            document.body.style.cssText = `
                overflow-y: auto !important;
                overflow-x: hidden !important;
                pointer-events: auto !important;
                position: relative !important;
            `;
        }
        
        // Force html to be scrollable
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
        
        // Force ALL buttons and links clickable
        const interactive = document.querySelectorAll('button, a, input, select, textarea, [onclick], [role="button"], [tabindex]');
        interactive.forEach(el => {
            el.style.cssText = `
                pointer-events: auto !important;
                opacity: 1 !important;
                visibility: visible !important;
                cursor: pointer !important;
                z-index: 10 !important;
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
                z-index: 10000 !important;
                position: fixed !important;
            `;
        }
        
        // Force widgets visible
        const widgets = document.querySelectorAll('.widget, .dashboard-widget, #analytics-container, #customizable-dashboard-container, [class*="widget"]');
        widgets.forEach(widget => {
            widget.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                pointer-events: auto !important;
                z-index: 5 !important;
            `;
        });
        
        console.log('✅ Emergency Page Loader: Page forced to load');
    }
    
    // Run immediately - don't wait for anything
    forcePageLoad();
    
    // Run multiple times immediately
    setTimeout(forcePageLoad, 10);
    setTimeout(forcePageLoad, 50);
    setTimeout(forcePageLoad, 100);
    setTimeout(forcePageLoad, 200);
    setTimeout(forcePageLoad, 500);
    setTimeout(forcePageLoad, 1000);
    setTimeout(forcePageLoad, 2000);
    setTimeout(forcePageLoad, 3000);
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forcePageLoad);
    } else {
        forcePageLoad();
    }
    
    // Run on window load
    window.addEventListener('load', forcePageLoad);
    
    // Continuous monitoring for 20 seconds
    let checkCount = 0;
    const maxChecks = 200; // 20 seconds
    const checkInterval = setInterval(() => {
        checkCount++;
        forcePageLoad();
        if (checkCount >= maxChecks) {
            clearInterval(checkInterval);
        }
    }, 100);
    
    // Watch for any loader elements and remove them
    const observer = new MutationObserver(() => {
        const loaders = document.querySelectorAll('#space-loader, [id*="space-loader"], .space-loader, #loader');
        if (loaders.length > 0) {
            forcePageLoad();
        }
    });
    
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'id']
        });
    }
    
    console.log('✅ Emergency Page Loader: Initialized');
})();

