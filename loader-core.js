/**
 * SpaceLoader Core - Minimal, Bulletproof Loader
 * 
 * This is the ESSENTIAL loader that ALWAYS unblocks the page.
 * No dependencies, no optional features, guaranteed to work.
 * 
 * Features:
 * - Simple progress bar
 * - Guaranteed unblock (multiple fallbacks)
 * - Error-resistant
 * - Fast and lightweight
 */

(function() {
    'use strict';

    // Configuration - minimal and safe
    const CONFIG = {
        maxLoadTime: 5000,        // Maximum 5 seconds (increased so loader is visible)
        progressUpdateInterval: 20, // Update every 20ms
        minProgressTime: 2000     // Show at least 2 seconds (increased so loader is visible)
    };

    // State
    let loaderElement = null;
    let progressFill = null;
    let progressInterval = null;
    const startTime = Date.now();
    let completed = false;
    let unblockGuaranteed = false;

    /**
     * GUARANTEED UNBLOCK - This ALWAYS runs
     * 
     * Sets up multiple independent mechanisms to ensure the page is never
     * permanently blocked. Uses time-based, event-based, and error-based
     * fallbacks to guarantee page unblocking within maxLoadTime.
     * 
     * @private
     * @returns {void}
     */
    function guaranteeUnblock() {
        if (unblockGuaranteed) return;
        unblockGuaranteed = true;
        
        // Store start time for tracking
        window.loaderStartTime = window.loaderStartTime || Date.now();
        
        console.log('🛡️ GUARANTEED UNBLOCK ACTIVATED - Page will load within ' + CONFIG.maxLoadTime + 'ms no matter what');

        /**
         * Force unblock the page immediately
         * 
         * Removes loader element, restores scrolling, and ensures all
         * interactive elements are clickable. This is the final fallback
         * that runs if all other mechanisms fail.
         * 
         * @private
         * @returns {void}
         */
        function forceUnblock() {
            try {
                // Remove loader
                const loader = document.getElementById('space-loader');
                if (loader && loader.parentNode) {
                    loader.style.cssText = 'display:none!important;visibility:hidden!important;opacity:0!important;pointer-events:none!important;';
                    try {
                        loader.parentNode.removeChild(loader);
                    } catch (e) {
                        console.warn('Loader removal error (non-critical):', e);
                    }
                }

                // Unblock scrolling - CRITICAL
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

                // Ensure main content visible
                const main = document.getElementById('main');
                if (main) {
                    main.style.cssText = 'opacity:1!important;visibility:visible!important;display:block!important;pointer-events:auto!important;';
                }

                // Ensure interactive elements work
                const buttons = document.querySelectorAll('button, a, input');
                buttons.forEach(btn => {
                    btn.style.cssText = 'pointer-events:auto!important;opacity:1!important;visibility:visible!important;';
                });

                console.log('✅ Page unblocked - guaranteed fallback');
            } catch (e) {
                console.error('Error in forceUnblock (critical):', e);
                // Last resort - try to unblock even if everything fails
                if (document.body) {
                    document.body.style.cssText = 'overflow-y:auto!important;overflow-x:hidden!important;pointer-events:auto!important;';
                    document.body.classList.add('loaded');
                }
            }
        }

        // Mechanism 1: Time-based guarantee (most reliable)
        setTimeout(forceUnblock, CONFIG.maxLoadTime);

        // Mechanism 2: Window load event
        if (document.readyState === 'complete') {
            setTimeout(forceUnblock, 100);
        } else {
            window.addEventListener('load', forceUnblock, { once: true });
        }

        // Mechanism 3: DOMContentLoaded backup
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(forceUnblock, CONFIG.maxLoadTime);
            }, { once: true });
        }

        // Mechanism 4: Error handler backup
        window.addEventListener('error', () => {
            setTimeout(forceUnblock, 500);
        }, { once: true });

        // Mechanism 5: Unhandled promise rejection backup
        window.addEventListener('unhandledrejection', () => {
            setTimeout(forceUnblock, 500);
        }, { once: true });

        // Mechanism 6: Visibility change backup (if user switches tabs)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                setTimeout(forceUnblock, 1000);
            }
        });
    }

    /**
     * Creates simple loader HTML
     * 
     * Creates a minimal loader overlay with progress bar and loading text.
     * Returns false if loader cannot be created (e.g., page already loaded).
     * 
     * @private
     * @returns {boolean} True if loader was created successfully, false otherwise
     */
    function createLoader() {
        try {
            // Check if already loaded
            if (document.body && document.body.classList.contains('loaded')) {
                console.log('Page already loaded, skipping loader');
                return false;
            }

            // Wait for body if needed
            if (!document.body) {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', createLoader, { once: true });
                } else {
                    setTimeout(createLoader, 50);
                }
                return false;
            }

            // Create loader element
            loaderElement = document.createElement('div');
            loaderElement.id = 'space-loader';
            loaderElement.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #fff;
                font-family: Arial, sans-serif;
            `;

            loaderElement.innerHTML = `
                <div style="text-align: center;">
                    <h1 style="font-size: 3rem; margin: 0; color: #ffd700;">I.T.A</h1>
                    <p style="font-size: 1rem; margin: 1rem 0; color: #ba944f;">INTERSTELLAR TRAVEL AGENCY</p>
                    <div style="width: 300px; height: 4px; background: rgba(255,255,255,0.2); border-radius: 2px; margin: 2rem 0; overflow: hidden;">
                        <div class="loader-progress-fill" style="height: 100%; background: linear-gradient(90deg, #ba944f, #ffd700); width: 0%; transition: width 0.1s ease;"></div>
                    </div>
                    <div class="loader-text" style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">LOADING<span class="dots">...</span></div>
                </div>
            `;

            // Insert loader
            try {
                if (document.body.firstChild) {
                    document.body.insertBefore(loaderElement, document.body.firstChild);
                } else {
                    document.body.appendChild(loaderElement);
                }
            } catch (e) {
                console.error('Error inserting loader:', e);
                return false;
            }

            // Get references
            progressFill = loaderElement.querySelector('.loader-progress-fill');
            const loadingText = loaderElement.querySelector('.loader-text');

            // Animate loading dots
            if (loadingText) {
                let dotCount = 0;
                const dotsSpan = loadingText.querySelector('.dots');
                if (dotsSpan) {
                    setInterval(() => {
                        dotCount = (dotCount + 1) % 4;
                        dotsSpan.textContent = '.'.repeat(dotCount);
                    }, 400);
                }
            }

            return true;
        } catch (e) {
            console.error('Error creating loader:', e);
            return false;
        }
    }

    /**
     * Starts progress animation
     * 
     * Updates progress bar from 0% to 100% over the configured time period.
     * Ensures minimum display time is respected before completion.
     * 
     * @private
     * @returns {void}
     */
    function startProgress() {
        if (!progressFill) return;

        let progress = 0;
        const progressStartTime = Date.now();

        progressInterval = setInterval(() => {
            if (completed) {
                if (progressInterval) {
                    clearInterval(progressInterval);
                    progressInterval = null;
                }
                return;
            }

            const elapsed = Date.now() - progressStartTime;
            const elapsedSinceStart = Date.now() - startTime;

            // Ensure minimum display time
            if (elapsedSinceStart < CONFIG.minProgressTime) {
                progress = Math.min(90, (elapsedSinceStart / CONFIG.minProgressTime) * 90);
            } else {
                // Smooth progress to 100%
                const remainingTime = CONFIG.maxLoadTime - elapsedSinceStart;
                if (remainingTime <= 0) {
                    progress = 100;
                    complete();
                } else {
                    progress = Math.min(99, 90 + (elapsed / (CONFIG.maxLoadTime - CONFIG.minProgressTime)) * 10);
                }
            }

            if (progressFill) {
                progressFill.style.width = progress + '%';
            }
        }, CONFIG.progressUpdateInterval);
    }

    /**
     * Completes the loader
     * 
     * Animates progress to 100%, fades out loader, removes it from DOM,
     * and unblocks page scrolling. This is called when loading is complete
     * or when maxLoadTime is reached.
     * 
     * @private
     * @returns {void}
     */
    function complete() {
        if (completed) return;
        completed = true;

        console.log('Loader completing...');

        // Clear interval
        if (progressInterval) {
            clearInterval(progressInterval);
            progressInterval = null;
        }

        // Update progress to 100%
        if (progressFill) {
            progressFill.style.width = '100%';
        }

        // Update text
        const loadingText = loaderElement ? loaderElement.querySelector('.loader-text') : null;
        if (loadingText) {
            loadingText.textContent = 'WELCOME TO THE COSMOS';
        }

        // Fade out and remove
        if (loaderElement) {
            loaderElement.style.opacity = '0';
            loaderElement.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                if (loaderElement && loaderElement.parentNode) {
                    try {
                        loaderElement.parentNode.removeChild(loaderElement);
                    } catch (e) {
                        console.warn('Error removing loader:', e);
                    }
                }
                loaderElement = null;
            }, 300);
        }

        // Unblock page
        try {
            if (document.documentElement) {
                document.documentElement.style.overflow = '';
                document.documentElement.style.overflowX = 'hidden';
            }
            if (document.body) {
                document.body.style.overflow = '';
                document.body.style.overflowX = 'hidden';
                document.body.classList.add('loaded');
            }
        } catch (e) {
            console.error('Error unblocking page:', e);
        }

        console.log('✅ Loader completed');
    }

    /**
     * Initialize loader - wrapped in try-catch for safety
     * 
     * Entry point for the loader. Blocks page scrolling, activates
     * guaranteed unblock mechanism, creates loader UI, and starts
     * progress animation. Has emergency fallback if initialization fails.
     * 
     * @private
     * @returns {void}
     */
    function init() {
        try {
            // Block scrolling
            if (document.documentElement && document.body) {
                document.documentElement.style.overflow = 'hidden';
                document.body.style.overflow = 'hidden';
            }

            // Activate guarantee FIRST (most important)
            guaranteeUnblock();

            // Create and start loader
            if (createLoader()) {
                startProgress();
            } else {
                // If loader creation fails, still unblock after delay
                setTimeout(() => {
                    if (document.body) {
                        document.body.style.overflow = '';
                        document.body.classList.add('loaded');
                    }
                }, 1000);
            }
        } catch (e) {
            console.error('Critical error in loader init:', e);
            // Emergency unblock
            setTimeout(() => {
                if (document.body) {
                    document.body.style.overflow = '';
                    document.body.classList.add('loaded');
                }
            }, 500);
        }
    }

    // Start loader when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // DOM already ready
        init();
    }

    // Export for module system (if needed)
    if (typeof window !== 'undefined') {
        window.SpaceLoaderCore = {
            complete: complete,
            guaranteeUnblock: guaranteeUnblock
        };
    }
})();

