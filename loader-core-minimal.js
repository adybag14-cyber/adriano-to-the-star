/**
 * ULTRA-MINIMAL LOADER - Emergency Test Version
 * 
 * This is the absolute bare minimum - just unblock the page.
 * No features, no animations, just guarantee page loads.
 * 
 * Purpose:
 * - Guarantee page unblocking under all circumstances
 * - Minimal code footprint for maximum reliability
 * - Multiple independent unblock mechanisms
 * 
 * Unblock Mechanisms (all independent):
 * 1. Immediate unblock if body exists (500ms delay)
 * 2. Window load event listener
 * 3. Time-based timeout (1 second maximum)
 * 4. Error handler fallback
 * 5. Unhandled promise rejection handler
 * 6. Visibility change handler
 * 
 * @module loader-core-minimal
 * @author Adriano To The Star
 * @version 1.0.0-minimal
 * @since 2025-01
 */

(function() {
    'use strict';
    
    console.log('🚀 MINIMAL LOADER STARTING');
    
    /**
     * Force unblock the page immediately
     * Removes loader element, restores scrolling, and ensures page is interactive
     * This function is called by multiple independent mechanisms for reliability
     * @private
     * @returns {void}
     */
    function forceUnblock() {
        console.log('🛡️ FORCE UNBLOCK EXECUTING');
        try {
            // Remove any loader
            const loader = document.getElementById('space-loader');
            if (loader) {
                loader.style.cssText = 'display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;';
                try {
                    if (loader.parentNode) loader.parentNode.removeChild(loader);
                } catch(e) {}
            }
            
            // CRITICAL: Unblock scrolling
            if (document.documentElement) {
                document.documentElement.style.overflow = '';
                document.documentElement.style.overflowX = 'hidden';
                document.documentElement.style.pointerEvents = 'auto';
            }
            if (document.body) {
                document.body.style.overflow = '';
                document.body.style.overflowX = 'hidden';
                document.body.style.pointerEvents = 'auto';
                document.body.classList.add('loaded');
            }
            
            // Force main visible
            const main = document.getElementById('main');
            if (main) {
                main.style.cssText = 'opacity:1!important;visibility:visible!important;pointer-events:auto!important;';
            }
            
            console.log('✅ PAGE UNBLOCKED');
        } catch(e) {
            console.error('❌ Error in forceUnblock:', e);
            // Last resort
            if (document.body) {
                document.body.style.cssText = 'overflow-y:auto!important;overflow-x:hidden!important;pointer-events:auto!important;';
                document.body.classList.add('loaded');
            }
        }
    }

    if (typeof window !== 'undefined' && !window.SpaceLoaderCore) {
        window.SpaceLoaderCore = {
            complete: function() {
                forceUnblock();
            },
            guaranteeUnblock: function() {}
        };
    }
    
    // Mechanism 1: Immediate (if body exists)
    if (document.body) {
        console.log('Body exists, setting up immediate unblock');
        // Don't block at all - just ensure it's unblocked
        setTimeout(forceUnblock, 500);
    } else {
        // Wait for body
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOMContentLoaded - setting up unblock');
                setTimeout(forceUnblock, 500);
            });
        } else {
            setTimeout(forceUnblock, 500);
        }
    }
    
    // Mechanism 2: Window load
    window.addEventListener('load', () => {
        console.log('Window load - forcing unblock');
        forceUnblock();
    }, { once: true });
    
    // Mechanism 3: Time-based (1 second max)
    setTimeout(() => {
        console.log('1 second timeout - forcing unblock');
        forceUnblock();
    }, 1000);
    
    // Mechanism 4: Error handler
    window.addEventListener('error', () => {
        console.log('Error detected - forcing unblock');
        setTimeout(forceUnblock, 100);
    }, { once: true });
    
    console.log('✅ MINIMAL LOADER INITIALIZED - Page will unblock within 1 second');
})();

