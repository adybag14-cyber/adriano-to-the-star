/**
 * LOADER BYPASS - Complete Disable
 * 
 * Use this to completely disable the loader and test if page loads
 * Replace loader.js with this file to test
 */

(function() {
    'use strict';
    
    console.log('🚫 LOADER BYPASSED - No loader will run');
    
    // Immediately ensure page is unblocked
    function ensureUnblocked() {
        if (document.body) {
            document.body.style.overflow = '';
            document.body.style.overflowX = 'hidden';
            document.body.style.pointerEvents = 'auto';
            document.body.classList.add('loaded');
        }
        if (document.documentElement) {
            document.documentElement.style.overflow = '';
            document.documentElement.style.overflowX = 'hidden';
        }
        
        // Remove any existing loader
        const loader = document.getElementById('space-loader');
        if (loader) {
            loader.style.cssText = 'display:none!important;visibility:hidden!important;';
            try {
                if (loader.parentNode) loader.parentNode.removeChild(loader);
            } catch(e) {}
        }
        
        console.log('✅ Page unblocked (bypass mode)');
    }
    
    // Run immediately
    if (document.body) {
        ensureUnblocked();
    } else {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', ensureUnblocked);
        } else {
            setTimeout(ensureUnblocked, 10);
        }
    }
    
    // Also on window load
    window.addEventListener('load', ensureUnblocked, { once: true });
    
    console.log('✅ Bypass mode active - page should load immediately');
})();

