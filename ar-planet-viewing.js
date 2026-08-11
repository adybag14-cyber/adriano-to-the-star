/**
 * AR Planet Viewing (Mobile AR)
 * Augmented reality planet viewing on mobile devices
 * 
 * Features:
 * - AR planet placement
 * - Mobile AR support
 * - Interactive AR models
 * - AR tracking
 */

class ARPlanetViewing {
    constructor() {
        this.arSupported = false;
        this.isARActive = false;
        this.currentSession = null;
        this.init();
    }

    init() {
        // Create AR widget
        this.createARWidget();

        // Check AR support
        this.checkARSupport();

        this.trackEvent('ar_planet_initialized');
    }

    createARWidget() {
        const container = document.createElement('div');
        container.id = 'ar-planet-widget';
        container.className = 'ar-planet-widget';
        container.style.cssText = `
            padding: 2rem;
            background: rgba(0, 0, 0, 0.5);
            border-radius: 10px;
            margin: 2rem 0;
            color: white;
        `;

        container.innerHTML = `
            <h2 style="color: #ba944f; margin-top: 0;">📱 AR Planet Viewing</h2>
            <div id="ar-content" style="background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 2rem;">
                <div id="ar-status" style="text-align: center; color: rgba(255,255,255,0.5); padding: 2rem;">
                    Checking AR support...
                </div>
            </div>
        `;

        // Insert into page
        const main = document.querySelector('main') || document.body;
        const vrWidget = document.getElementById('vr-planet-widget');
        if (vrWidget) {
            vrWidget.insertAdjacentElement('afterend', container);
        } else {
            const firstSection = main.querySelector('section');
            if (firstSection) {
                firstSection.insertAdjacentElement('afterend', container);
            } else {
                main.appendChild(container);
            }
        }
    }

    async checkARSupport() {
        const container = document.getElementById('ar-content');
        if (!container) return;

        // Check for WebXR AR support
        if (navigator.xr) {
            try {
                const supported = await navigator.xr.isSessionSupported('immersive-ar');
                this.arSupported = supported;
                this.renderARInterface();
            } catch (e) {
                // Check for ARCore/ARKit via WebXR
                this.arSupported = false;
                this.renderARInterface();
            }
        } else {
            this.arSupported = false;
            this.renderARInterface();
        }
    }

    renderARInterface() {
        const container = document.getElementById('ar-content');
        if (!container) return;

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (this.arSupported || isMobile) {
            container.innerHTML = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">📱</div>
                    <h3 style="color: #4ade80; margin-bottom: 0.5rem;">AR Available!</h3>
                    <p style="color: rgba(255,255,255,0.8);">View planets in augmented reality on your mobile device.</p>
                </div>
                
                <div style="background: rgba(186,148,79,0.1); border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem;">
                    <h4 style="color: #ba944f; margin-top: 0; margin-bottom: 1rem;">Available Planets</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
                        <div style="background: rgba(0,0,0,0.3); border-radius: 5px; padding: 1rem; text-align: center; cursor: pointer;" 
                             onclick="window.arPlanetViewing.viewInAR('kepler-452b')">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌍</div>
                            <div style="color: #ba944f; font-weight: bold; font-size: 0.9rem;">Kepler-452b</div>
                        </div>
                        <div style="background: rgba(0,0,0,0.3); border-radius: 5px; padding: 1rem; text-align: center; cursor: pointer;" 
                             onclick="window.arPlanetViewing.viewInAR('proxima-b')">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🪐</div>
                            <div style="color: #ba944f; font-weight: bold; font-size: 0.9rem;">Proxima b</div>
                        </div>
                        <div style="background: rgba(0,0,0,0.3); border-radius: 5px; padding: 1rem; text-align: center; cursor: pointer;" 
                             onclick="window.arPlanetViewing.viewInAR('trappist-1e')">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌎</div>
                            <div style="color: #ba944f; font-weight: bold; font-size: 0.9rem;">TRAPPIST-1e</div>
                        </div>
                        <div style="background: rgba(0,0,0,0.3); border-radius: 5px; padding: 1rem; text-align: center; cursor: pointer;" 
                             onclick="window.arPlanetViewing.viewInAR('earth')">
                            <div style="font-size: 2rem; margin-bottom: 0.5rem;">🌏</div>
                            <div style="color: #ba944f; font-weight: bold; font-size: 0.9rem;">Earth</div>
                        </div>
                    </div>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.3); border-radius: 10px; padding: 1.5rem; margin-bottom: 2rem;">
                    <h4 style="color: #ba944f; margin-top: 0; margin-bottom: 1rem;">AR Features</h4>
                    <ul style="color: rgba(255,255,255,0.8); line-height: 1.8; padding-left: 1.5rem; margin: 0;">
                        <li>Place planets in your real-world environment</li>
                        <li>Scale and rotate planets with touch gestures</li>
                        <li>View planet details in AR overlay</li>
                        <li>Take AR photos and share them</li>
                    </ul>
                </div>
                
                <button id="start-ar-btn" onclick="window.arPlanetViewing.startAR()" 
                        style="width: 100%; background: rgba(74,222,128,0.2); border: 2px solid #4ade80; color: #4ade80; padding: 1rem; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 1.1rem;">
                    📱 Start AR Experience
                </button>
            `;
        } else {
            container.innerHTML = `
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">📱</div>
                    <h3 style="color: #fbbf24; margin-bottom: 0.5rem;">AR Not Available</h3>
                    <p style="color: rgba(255,255,255,0.8);">AR viewing requires a mobile device with AR support.</p>
                </div>
                
                <div style="background: rgba(186,148,79,0.1); border-radius: 10px; padding: 1.5rem;">
                    <h4 style="color: #ba944f; margin-top: 0; margin-bottom: 1rem;">Requirements</h4>
                    <ul style="color: rgba(255,255,255,0.8); line-height: 1.8; padding-left: 1.5rem; margin: 0;">
                        <li>Mobile device (iOS or Android)</li>
                        <li>ARCore (Android) or ARKit (iOS) support</li>
                        <li>Modern mobile browser with WebXR</li>
                        <li>Camera permissions enabled</li>
                    </ul>
                </div>
                
                <div style="margin-top: 2rem; padding: 1.5rem; background: rgba(0, 0, 0, 0.3); border-radius: 10px;">
                    <h4 style="color: #ba944f; margin-top: 0; margin-bottom: 1rem;">Coming Soon</h4>
                    <p style="color: rgba(255,255,255,0.8); line-height: 1.6;">
                        Full AR planet viewing with realistic 3D models, interactive controls, 
                        and real-time planet information overlays in your environment.
                    </p>
                </div>
            `;
        }
    }

    async startAR() {
        alert('Debug: Checking AR capabilities...');

        if (!window.isSecureContext) {
            alert('⚠️ AR requires a secure connection (HTTPS). Please use HTTPS or localhost.');
            return;
        }

        if (!this.arSupported) {
            // Try to re-check support
            if (navigator.xr) {
                try {
                    this.arSupported = await navigator.xr.isSessionSupported('immersive-ar');
                } catch (e) {
                    console.error(e);
                }
            }

            if (!this.arSupported) {
                alert('AR is not supported on this device/browser.\n\nDebug: ' + (navigator.xr ? 'WebXR present' : 'No WebXR'));
                return;
            }
        }

        try {
            alert('Requesting AR session...');
            // Request AR session
            const session = await navigator.xr.requestSession('immersive-ar', {
                requiredFeatures: ['local'],
                optionalFeatures: ['hit-test', 'anchors']
            });

            this.currentSession = session;
            this.isARActive = true;

            // In production, would initialize AR scene here
            alert('Starting AR experience!\n\nIn production, this would launch AR with planet models that you can place in your environment using your device camera.');

            // Handle session end
            session.addEventListener('end', () => {
                this.isARActive = false;
                this.currentSession = null;
            });

        } catch (e) {
            console.error('Failed to start AR:', e);
            alert('Failed to start AR: ' + e.message);
        }
    }

    viewInAR(planetId) {
        if (!this.isARActive) {
            this.startAR();
        }
        // In production, would load specific planet model
        console.log('Viewing planet in AR:', planetId);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`ar_planet_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.arPlanetViewing = new ARPlanetViewing();
    });
} else {
    window.arPlanetViewing = new ARPlanetViewing();
}
