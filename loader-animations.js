/**
 * SpaceLoader Animations Module (Optional)
 * 
 * Adds visual effects: particles, star field, canvas animations
 * This module is OPTIONAL and can fail without breaking the page
 */

(function() {
    'use strict';

    // Only load if core loader exists
    if (!window.SpaceLoaderCore) {
        return;
    }

    const CONFIG = {
        particleCount: 20,
        starCount: 50,
        useWebWorker: false // Disable by default for reliability
    };

    let animationFrameId = null;
    let particles = [];

    /**
     * Creates particles (optional visual effect)
     * 
     * Adds animated particles to the loader for visual appeal.
     * Respects user's reduced motion preference. Non-critical - failures
     * are caught and logged without breaking the page.
     * 
     * @private
     * @returns {void}
     */
    function createParticles() {
        try {
            const loader = document.getElementById('space-loader');
            if (!loader) return;

            // Check if user prefers reduced motion
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                console.log('Reduced motion preferred, skipping particles');
                return;
            }

            for (let i = 0; i < CONFIG.particleCount; i++) {
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: rgba(186, 148, 79, 0.8);
                    border-radius: 50%;
                    box-shadow: 0 0 10px 2px rgba(186, 148, 79, 0.8);
                    left: ${Math.random() * 100}%;
                    top: ${Math.random() * 100}%;
                    pointer-events: none;
                `;
                loader.appendChild(particle);
                particles.push(particle);
            }
        } catch (e) {
            console.warn('Error creating particles (non-critical):', e);
        }
    }

    /**
     * Creates simple star field (optional visual effect)
     * 
     * Creates a canvas-based animated star field background.
     * Uses requestAnimationFrame for smooth animation. Respects
     * user's reduced motion preference. Non-critical - failures
     * are caught and logged without breaking the page.
     * 
     * @private
     * @returns {void}
     */
    function createStarField() {
        try {
            const loader = document.getElementById('space-loader');
            if (!loader) return;

            // Check if user prefers reduced motion
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                return;
            }

            const canvas = document.createElement('canvas');
            canvas.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
                pointer-events: none;
                opacity: 0.5;
            `;

            loader.insertBefore(canvas, loader.firstChild);

            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const stars = [];
            for (let i = 0; i < CONFIG.starCount; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2,
                    opacity: Math.random()
                });
            }

            /**
             * Animation loop for star field
             * 
             * Continuously redraws stars on canvas using requestAnimationFrame.
             * Automatically stops when loader is removed from DOM.
             * 
             * @private
             * @returns {void}
             */
            function animate() {
                // Check if loader still exists
                if (!document.getElementById('space-loader')) {
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                    }
                    return;
                }

                ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                stars.forEach(star => {
                    ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                    ctx.beginPath();
                    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                    ctx.fill();
                });

                animationFrameId = requestAnimationFrame(animate);
            }

            animate();
        } catch (e) {
            console.warn('Error creating star field (non-critical):', e);
        }
    }

    /**
     * Cleanup animations
     * 
     * Cancels animation frame and clears particle references.
     * Should be called when loader is removed or page unloads.
     * 
     * @private
     * @returns {void}
     */
    function cleanup() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        particles = [];
    }

    /**
     * Initialize animations when loader is ready
     * 
     * Waits for loader element to be created, then initializes
     * particles and star field. Non-critical - failures are caught
     * and logged without breaking the page.
     * 
     * @private
     * @returns {void}
     */
    function init() {
        try {
            // Wait a bit for loader to be created
            setTimeout(() => {
                createParticles();
                createStarField();
            }, 100);
        } catch (e) {
            console.warn('Error initializing animations (non-critical):', e);
        }
    }

    // Start when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);
})();

