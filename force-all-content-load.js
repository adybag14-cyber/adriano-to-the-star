/**
 * Force All Content Load
 * Aggressively forces ALL content to load and be visible immediately
 * Disables lazy loading and ensures everything is visible
 */

(function() {
    'use strict';
    
    console.log('🚀 Force All Content Load: Starting...');
    
    function forceAllContent() {
        // 1. Remove ALL lazy loading attributes and load images immediately
        const allImages = document.querySelectorAll('img');
        allImages.forEach(img => {
            // Remove lazy loading
            img.removeAttribute('loading');
            img.removeAttribute('data-lazy');
            img.classList.remove('lazy-loading');
            
            // Load data-src images immediately
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
            
            // Force visibility
            img.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                display: inline-block !important;
            `;
            
            // Force load if not complete
            if (img.src && !img.complete) {
                const newImg = new Image();
                newImg.onload = () => {
                    img.src = newImg.src;
                    img.style.opacity = '1';
                };
                newImg.src = img.src;
            }
        });
        
        // 2. Force all sections visible
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            section.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                pointer-events: auto !important;
            `;
        });
        
        // 3. Force main content visible
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
        
        // 4. Force all interactive elements
        const interactive = document.querySelectorAll('button, a, input, select, textarea, [onclick], [role="button"]');
        interactive.forEach(el => {
            el.style.cssText = `
                pointer-events: auto !important;
                opacity: 1 !important;
                visibility: visible !important;
                cursor: pointer !important;
            `;
        });
        
        // 5. Force music player
        const musicPlayer = document.getElementById('cosmic-music-player');
        if (musicPlayer) {
            musicPlayer.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                pointer-events: auto !important;
                z-index: 10000 !important;
            `;
        }
        
        // 6. Force widgets
        const widgets = document.querySelectorAll('.widget, .dashboard-widget, #analytics-container, [class*="widget"]');
        widgets.forEach(widget => {
            widget.style.cssText = `
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
                pointer-events: auto !important;
            `;
        });
        
        // 7. Disable lazy loading manager if it exists
        if (window.lazyLoadingManager) {
            // Stop observing
            if (window.lazyLoadingManager.imageObserver) {
                window.lazyLoadingManager.imageObserver.disconnect();
            }
        }
        
        console.log('✅ Force All Content Load: Applied');
    }
    
    // Run immediately - don't wait
    forceAllContent();
    
    // Run immediately again
    setTimeout(forceAllContent, 1);
    setTimeout(forceAllContent, 5);
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceAllContent);
    } else {
        forceAllContent();
    }
    
    // Run on window load
    window.addEventListener('load', forceAllContent);
    
    // Run multiple times aggressively
    [10, 20, 50, 100, 200, 500, 1000, 1500, 2000, 3000, 5000, 10000].forEach(time => {
        setTimeout(forceAllContent, time);
    });
    
    // Continuous monitoring for 60 seconds
    let count = 0;
    const interval = setInterval(() => {
        count++;
        forceAllContent();
        if (count >= 600) clearInterval(interval); // 60 seconds
    }, 100);
    
    // Watch for any elements being hidden and force them visible
    const observer = new MutationObserver(() => {
        const hiddenElements = document.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"], [style*="opacity: 0"]');
        hiddenElements.forEach(el => {
            if (el.id !== 'space-loader' && !el.classList.contains('space-loader')) {
                const computed = window.getComputedStyle(el);
                if (computed.display === 'none' || computed.visibility === 'hidden' || parseFloat(computed.opacity) === 0) {
                    if (el.tagName === 'SECTION' || el.id === 'main' || el.classList.contains('widget')) {
                        el.style.cssText = 'opacity: 1 !important; visibility: visible !important; display: block !important;';
                    }
                }
            }
        });
    });
    
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }
})();

