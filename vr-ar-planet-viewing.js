/**
 * VR/AR Planet Viewing using WebXR API
 * Enables virtual and augmented reality planet exploration
 */

class VRARPlanetViewing {
    constructor() {
        this.xrSession = null;
        this.xrSpace = null;
        this.isSupported = false;
        this.currentPlanet = null;
        this.isInitialized = false;

        this.init();
    }

    async init() {
        // Check for WebXR support
        if (navigator.xr) {
            this.isSupported = await navigator.xr.isSessionSupported('immersive-vr');
            console.log('VR Support:', this.isSupported);
        }

        // Check for AR support
        if (navigator.xr) {
            const arSupported = await navigator.xr.isSessionSupported('immersive-ar');
            console.log('AR Support:', arSupported);
        }

        this.isInitialized = true;
        console.log('🥽 VR/AR Planet Viewing System initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("v_ra_rp_la_ne_tv_ie_wi_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Check if VR is supported
     */
    async checkVRSupport() {
        if (!navigator.xr) return false;
        return await navigator.xr.isSessionSupported('immersive-vr');
    }

    /**
     * Start VR Session
     */
    async startVRSession() {
        if (!this.isSupported) {
            alert('VR is not supported on this device/browser');
            return;
        }

        try {
            this.trackEvent('vr_session_start_requested');
            const session = await navigator.xr.requestSession('immersive-vr', {
                optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking']
            });

            this.onSessionStarted(session);
        } catch (error) {
            console.error('Error starting VR session:', error);
            this.trackEvent('vr_session_start_failed', { error: error.message });
        }
    }

    /**
     * Start AR Session
     */
    async startARSession() {
        try {
            this.trackEvent('ar_session_start_requested');
            const session = await navigator.xr.requestSession('immersive-ar', {
                optionalFeatures: ['hit-test', 'dom-overlay'],
                domOverlay: { root: document.body }
            });

            this.onSessionStarted(session);
        } catch (error) {
            console.error('Error starting AR session:', error);
            this.trackEvent('ar_session_start_failed', { error: error.message });
        }
    }

    /**
     * Handle Session Started
     */
    async onSessionStarted(session) {
        this.xrSession = session;
        session.addEventListener('end', this.onSessionEnded.bind(this));

        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl', { xrCompatible: true });

        // This would typically integrate with Three.js WebXRManager
        if (window.renderer && window.renderer.xr) {
            window.renderer.xr.setSession(session);
        }

        this.xrSpace = await session.requestReferenceSpace('local');

        this.trackEvent('xr_session_started', { mode: session.mode });
        console.log(`🚀 ${session.mode.toUpperCase()} session started`);

        session.requestAnimationFrame(this.onXRFrame.bind(this));
    }

    /**
     * Handle Session Ended
     */
    onSessionEnded() {
        this.trackEvent('xr_session_ended');
        this.xrSession = null;
        console.log('📴 XR session ended');
    }

    /**
     * XR Frame Loop
     */
    onXRFrame(time, frame) {
        const session = frame.session;
        session.requestAnimationFrame(this.onXRFrame.bind(this));

        const pose = frame.getViewerPose(this.xrSpace);
        if (pose) {
            // Render logic here
        }
    }

    /**
     * Set current planet for viewing
     */
    setCurrentPlanet(planet) {
        this.currentPlanet = planet;
        this.trackEvent('planet_selected', { planetId: planet.kepid });
        console.log('Setting XR planet:', planet.kepler_name);
    }

    /**
     * Update visualization based on planet data
     */
    updateVisualization() {
        if (!this.currentPlanet || !this.xrSession) return;
        // Update textures, scale, etc.
    }

    /**
     * Exit XR Session
     */
    async exitXR() {
        if (this.xrSession) {
            await this.xrSession.end();
        }
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.vrarPlanetViewing = new VRARPlanetViewing();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VRARPlanetViewing;
}
