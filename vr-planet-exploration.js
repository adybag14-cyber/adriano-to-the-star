/**
 * VR Planet Exploration (WebXR)
 * Virtual reality planet viewing experience
 * 
 * Features:
 * - WebXR support
 * - VR planet viewing
 * - Immersive experience
 * - VR controls
 */

class VRPlanetExploration {
    constructor() {
        this.vrSupported = false;
        this.isVRActive = false;
        this.currentSession = null;
        this.init();
    }
    
    init() {
        // Create VR widget
        this.createVRWidget();
        
        // Check VR support
        this.checkVRSupport();
        
        console.log('🥽 VR Planet Exploration initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("v_rp_la_ne_te_xp_lo_ra_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    createVRWidget() {
        const container = document.createElement('div');
        container.id = 'vr-planet-widget';
        container.className = 'vr-planet-widget';
        container.style.cssText = `
            padding: 2rem;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            margin: 2rem 0;
            color: white;
        `;
        
        container.innerHTML = `
            <h2 style="color: #ba944f; margin-top: 0;">🥽 VR Planet Exploration</h2>
            <div id="vr-content" style="background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 2rem;">
                <div id="vr-status" style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">
                    Checking VR support...
                </div>
            </div>
        `;
        
        // Insert into page
        const main = document.querySelector('main') || document.body;
        const twoFactorWidget = document.getElementById('2fa-widget');
        if (twoFactorWidget) {
            twoFactorWidget.insertAdjacentElement('afterend', container);
        } else {
            const firstSection = main.querySelector('section');
            if (firstSection) {
                firstSection.insertAdjacentElement('afterend', container);
            } else {
                main.appendChild(container);
            }
        }
    }
    
    async checkVRSupport() {
        const container = document.getElementById('vr-content');
        if (!container) return;
        
        // Check for WebXR support
        if (navigator.xr) {
            try {
                const supported = await navigator.xr.isSessionSupported('immersive-vr');
                this.vrSupported = supported;
                this.renderVRInterface();
            } catch (e) {
                console.warn('WebXR check failed:', e);
                this.vrSupported = false;
                this.renderVRInterface();
            }
        } else {
            this.vrSupported = false;
            this.renderVRInterface();
        }
    }
    
    renderVRInterface() {
        const container = document.getElementById('vr-content');
        if (!container) return;
        
        if (this.vrSupported) {
            container.innerHTML = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🥽</div>
                    <h3 style="color: #4ade80; margin-bottom: 0.5rem;">VR Supported!</h3>
                    <p style="color: rgba(255,255,255,0.8);">Your device supports WebXR for immersive planet exploration.</p>
                </div>
                
                <div style="background: rgba(186,148,79,0.1); border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem;">
                    <h4 style="color: #ba944f; margin-top: 0; margin-bottom: 1rem;">Available Planets</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div style="background: rgba(0,0,0,0.3); border-radius: 5px; padding: 1rem; text-align: center; cursor: pointer;" 
                             onclick="window.vrPlanetExploration.enterVR('kepler-452b')">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌍</div>
                            <div style="color: #ba944f; font-weight: bold;">Kepler-452b</div>
                        </div>
                        <div style="background: rgba(0,0,0,0.3); border-radius: 5px; padding: 1rem; text-align: center; cursor: pointer;" 
                             onclick="window.vrPlanetExploration.enterVR('proxima-b')">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🪐</div>
                            <div style="color: #ba944f; font-weight: bold;">Proxima Centauri b</div>
                        </div>
                        <div style="background: rgba(0,0,0,0.3); border-radius: 5px; padding: 1rem; text-align: center; cursor: pointer;" 
                             onclick="window.vrPlanetExploration.enterVR('trappist-1e')">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌎</div>
                            <div style="color: #ba944f; font-weight: bold;">TRAPPIST-1e</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem;">
                    <h4 style="color: #ba944f; margin-top: 0; margin-bottom: 1rem;">VR Controls</h4>
                    <ul style="color: rgba(255,255,255,0.8); line-height: 1.8; padding-left: 1.5rem; margin: 0;">
                        <li>Use VR controllers to navigate and interact</li>
                        <li>Gaze at planets to view details</li>
                        <li>Use hand tracking for natural interactions</li>
                        <li>Teleport to different locations</li>
                    </ul>
                </div>
                
                <button id="enter-vr-btn" onclick="window.vrPlanetExploration.enterVR('default')" 
                        style="width: 100%; background: rgba(74,222,128,0.2); border: 2px solid #4ade80; color: #4ade80; padding: 1rem; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 1.1rem;">
                    🥽 Enter VR Experience
                </button>
            `;
        } else {
            container.innerHTML = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🥽</div>
                    <h3 style="color: #fbbf24; margin-bottom: 0.5rem;">VR Not Available</h3>
                    <p style="color: rgba(255,255,255,0.8);">WebXR is not supported on your device.</p>
                </div>
                
                <div style="background: rgba(186,148,79,0.1); border-radius: 10px; padding: 1.5rem;">
                    <h4 style="color: #ba944f; margin-top: 0; margin-bottom: 1rem;">Requirements</h4>
                    <ul style="color: rgba(255,255,255,0.8); line-height: 1.8; padding-left: 1.5rem; margin: 0;">
                        <li>VR headset (Oculus, HTC Vive, etc.)</li>
                        <li>WebXR-compatible browser (Chrome, Firefox, Edge)</li>
                        <li>HTTPS connection (required for WebXR)</li>
                        <li>VR controllers for interaction</li>
                    </ul>
                </div>
                
                <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(0, 0, 0, 0.3); border-radius: 10px;">
                    <h4 style="color: #ba944f; margin-top: 0; margin-bottom: 1rem;">Coming Soon</h4>
                    <p style="color: rgba(255,255,255,0.8); line-height: 1.6;">
                        Full VR planet exploration experience with immersive 3D environments, 
                        interactive planet surfaces, and real-time space navigation.
                    </p>
                </div>
            `;
        }
    }
    
    async enterVR(planetId) {
        if (!this.vrSupported) {
            alert('VR is not supported on your device. Please use a VR headset with WebXR support.');
            return;
        }
        
        try {
            // Request VR session
            const session = await navigator.xr.requestSession('immersive-vr', {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['hand-tracking', 'bounded-floor']
            });
            
            this.currentSession = session;
            this.isVRActive = true;
            
            // In production, would initialize VR scene here
            alert(`Entering VR experience for ${planetId}!\n\nIn production, this would launch a full immersive VR environment with 3D planet models, interactive controls, and spatial audio.`);
            
            // Handle session end
            session.addEventListener('end', () => {
                this.isVRActive = false;
                this.currentSession = null;
            });
            
        } catch (e) {
            console.error('Failed to enter VR:', e);
            alert('Failed to enter VR. Please ensure your VR headset is connected and WebXR is enabled.');
        }
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.vrPlanetExploration = new VRPlanetExploration();
    });
} else {
    window.vrPlanetExploration = new VRPlanetExploration();
}

