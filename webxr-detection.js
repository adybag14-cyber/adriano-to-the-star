/**
 * WebXR Detection and VR/AR Capability Checker
 * 
 * Detects VR/AR support and provides utilities for WebXR features.
 * Foundation for future VR/AR planet exploration features.
 * 
 * @class WebXRDetection
 * @example
 * const xr = new WebXRDetection();
 * if (xr.isVRAvailable()) {
 *   // Enable VR mode
 * }
 */
class WebXRDetection {
    constructor() {
        this.vrSupported = false;
        this.arSupported = false;
        this.session = null;
        this.init();
    }

    /**
     * Initialize WebXR detection
     */
    async init() {
        if (!navigator.xr) {
            console.log('⚠️ WebXR not supported in this browser');
            return;
        }

        // Check VR support
        this.vrSupported = await navigator.xr.isSessionSupported('immersive-vr');

        // Check AR support
        this.arSupported = await navigator.xr.isSessionSupported('immersive-ar');

        console.log('🌐 WebXR Support:', {
            vr: this.vrSupported,
            ar: this.arSupported
        });
    }

    /**
     * Track analytics events
     */
    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("webxr_detection_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Check if VR is available
     * @returns {boolean} True if VR is supported
     */
    isVRAvailable() {
        return this.vrSupported;
    }

    /**
     * Check if AR is available
     * @returns {boolean} True if AR is supported
     */
    isARAvailable() {
        return this.arSupported;
    }

    /**
     * Request VR session
     * @param {WebGLRenderingContext} glContext - WebGL context for rendering
     * @returns {Promise<XRSession>} VR session or null
     */
    async requestVRSession(glContext, sessionInit = null) {
        if (!this.vrSupported) {
            console.warn('VR not supported');
            return null;
        }

        try {
            const defaultInit = {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['bounded-floor', 'hand-tracking', 'hit-test']
            };

            const init = sessionInit || defaultInit;
            const session = await navigator.xr.requestSession('immersive-vr', init);

            // Set up WebGL layer
            if (glContext) {
                const xrLayer = new XRWebGLLayer(session, glContext);
                session.updateRenderState({ baseLayer: xrLayer });
            }

            this.session = session;
            return session;
        } catch (error) {
            console.error('Failed to request VR session:', error);
            return null;
        }
    }

    /**
     * Request AR session
     * @param {WebGLRenderingContext} glContext - WebGL context for rendering
     * @returns {Promise<XRSession>} AR session or null
     */
    async requestARSession(glContext) {
        if (!this.arSupported) {
            console.warn('AR not supported');
            return null;
        }

        try {
            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local'],
                optionalFeatures: ['hit-test', 'anchors']
            });

            // Set up WebGL layer
            if (glContext) {
                const xrLayer = new XRWebGLLayer(session, glContext);
                session.updateRenderState({ baseLayer: xrLayer });
            }

            this.session = session;
            return session;
        } catch (error) {
            console.error('Failed to request AR session:', error);
            return null;
        }
    }

    /**
     * End current XR session
     */
    endSession() {
        if (this.session) {
            this.session.end();
            this.session = null;
        }
    }

    /**
     * Get device info
     * @returns {Object} Device information
     */
    getDeviceInfo() {
        return {
            vrSupported: this.vrSupported,
            arSupported: this.arSupported,
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
    }

    /**
     * Create VR mode button (if VR is available)
     * @param {HTMLElement} container - Container to add button to
     */
    createVRButton(container) {
        if (!this.vrSupported) return;

        const button = document.createElement('button');
        button.className = 'vr-mode-btn';
        button.innerHTML = '🥽 Enter VR';
        button.style.cssText = `
            padding: 0.75rem 1.5rem;
            background: rgba(186, 148, 79, 0.2);
            border: 2px solid rgba(186, 148, 79, 0.5);
            border-radius: 8px;
            color: #ba944f;
            cursor: pointer;
            font-family: 'Raleway', sans-serif;
            font-weight: 600;
            transition: all 0.3s ease;
        `;

        button.addEventListener('click', () => {
            this.onVRButtonClick();
        });

        container.appendChild(button);
    }

    /**
     * Handle VR button click
     */
    async onVRButtonClick() {
        // This will be implemented when VR mode is fully developed
        console.log('VR mode requested - Feature in development');
        alert('🥽 VR mode is coming soon! This feature is currently in development.');
    }
}

// Initialize WebXR detection
let webXRInstance = null;

function initWebXR() {
    if (!webXRInstance) {
        webXRInstance = new WebXRDetection();
    }
    return webXRInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWebXR);
} else {
    initWebXR();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebXRDetection;
}

// Make available globally
window.WebXRDetection = WebXRDetection;
window.webXR = () => webXRInstance;
