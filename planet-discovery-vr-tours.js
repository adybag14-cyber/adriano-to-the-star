/**
 * Planet Discovery Virtual Reality Tours
 * Immersive VR experiences for exploring exoplanets
 */

class PlanetDiscoveryVRTours {
    constructor() {
        this.tours = [];
        this.currentTour = null;
        this.xrSession = null;
        this.isSupported = false;
        this.init();
    }

    init() {
        this.loadTours();
        this.checkVRSupport();
        console.log('🥽 VR Tours initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_vr_to_ur_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadTours() {
        this.tours = [
            {
                id: 'kepler-system-tour',
                title: 'Kepler System Tour',
                description: 'Explore the Kepler-186 system with 5 planets',
                duration: '15 minutes',
                planets: ['Kepler-186b', 'Kepler-186c', 'Kepler-186d', 'Kepler-186e', 'Kepler-186f'],
                difficulty: 'beginner'
            },
            {
                id: 'habitable-zone-tour',
                title: 'Habitable Zone Exploration',
                description: 'Visit planets in the Goldilocks zone',
                duration: '20 minutes',
                planets: ['Proxima Centauri b', 'TRAPPIST-1e', 'Kepler-452b'],
                difficulty: 'intermediate'
            },
            {
                id: 'gas-giant-tour',
                title: 'Gas Giant Adventure',
                description: 'Experience the massive gas giants',
                duration: '25 minutes',
                planets: ['HD 209458 b', 'WASP-12b', 'KELT-9b'],
                difficulty: 'advanced'
            }
        ];
    }

    async checkVRSupport() {
        if (navigator.xr) {
            try {
                this.isSupported = await navigator.xr.isSessionSupported('immersive-vr');
            } catch (error) {
                console.warn('VR support check failed:', error);
            }
        }
    }

    renderTours(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="vr-tours-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">🥽 Virtual Reality Tours</h3>
                
                ${!this.isSupported ? `
                    <div style="background: rgba(239, 68, 68, 0.2); border: 2px solid rgba(239, 68, 68, 0.5); border-radius: 10px; padding: 1rem; margin-bottom: 2rem; text-align: center;">
                        <p style="color: rgba(255, 255, 255, 0.9);">⚠️ VR not supported on this device. Tours will run in 3D mode instead.</p>
                    </div>
                ` : ''}
                
                <div class="tours-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem;">
        `;

        this.tours.forEach(tour => {
            html += this.createTourCard(tour);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Setup event listeners
        this.tours.forEach(tour => {
            const card = document.querySelector(`[data-tour-id="${tour.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.startTour(tour.id);
                });
            }
        });
    }

    createTourCard(tour) {
        return `
            <div class="tour-card" data-tour-id="${tour.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <div style="text-align: center; margin-bottom: 1rem;">
                    <div style="font-size: 4rem; margin-bottom: 0.5rem;">🥽</div>
                    <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${tour.title}</h4>
                    <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">${tour.description}</p>
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; opacity: 0.7; margin-bottom: 1rem;">
                        <span>⏱️ ${tour.duration}</span>
                        <span style="text-transform: capitalize;">${tour.difficulty}</span>
                    </div>
                    <div style="margin-top: 1rem;">
                        <p style="font-size: 0.85rem; opacity: 0.7; margin-bottom: 0.5rem;">Planets in tour:</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;">
                            ${tour.planets.map(planet => `<span style="background: rgba(186, 148, 79, 0.2); padding: 0.25rem 0.5rem; border-radius: 5px; font-size: 0.75rem;">${planet}</span>`).join('')}
                        </div>
                    </div>
                    <button style="margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600; width: 100%;">
                        🚀 Start Tour
                    </button>
                </div>
            </div>
        `;
    }

    async startTour(tourId) {
        const tour = this.tours.find(t => t.id === tourId);
        if (!tour) {
            console.error(`Tour ${tourId} not found`);
            return;
        }

        this.currentTour = tour;

        if (this.isSupported && navigator.xr) {
            await this.startVRTour(tour);
        } else {
            await this.start3DTour(tour);
        }
    }

    async startVRTour(tour) {
        // Create VR canvas
        const canvas = document.createElement('canvas');
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 10000;
        `;
        document.body.appendChild(canvas);

        try {
            const gl = canvas.getContext('webgl', { xrCompatible: true });
            if (!gl) {
                throw new Error('WebGL not available');
            }

            this.xrSession = await navigator.xr.requestSession('immersive-vr', {
                requiredFeatures: ['local-floor']
            });

            const xrSpace = await this.xrSession.requestReferenceSpace('local-floor');
            
            gl.makeXRCompatible().then(() => {
                this.xrSession.updateRenderState({
                    baseLayer: new XRWebGLLayer(this.xrSession, gl)
                });

                // Start render loop
                this.xrSession.requestAnimationFrame((time, frame) => {
                    this.renderVRTour(gl, xrSpace, frame, tour);
                });
            });

            // Add exit button
            this.addVRExitButton();

        } catch (error) {
            console.error('Error starting VR tour:', error);
            canvas.remove();
            await this.start3DTour(tour);
        }
    }

    renderVRTour(gl, xrSpace, frame, tour) {
        const pose = frame.getViewerPose(xrSpace);
        if (!pose) {
            this.xrSession.requestAnimationFrame((time, frame) => {
                this.renderVRTour(gl, xrSpace, frame, tour);
            });
            return;
        }

        // Clear canvas
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Render planets in VR space
        // This is a simplified version - full implementation would use Three.js or similar
        this.renderPlanetsInVR(gl, pose, tour);

        // Continue render loop
        this.xrSession.requestAnimationFrame((time, frame) => {
            this.renderVRTour(gl, xrSpace, frame, tour);
        });
    }

    renderPlanetsInVR(gl, pose, tour) {
        // Simplified planet rendering
        // Full implementation would use proper 3D rendering
        tour.planets.forEach((planetName, index) => {
            // Render planet at position based on index
            // This is a placeholder - would need proper 3D math
        });
    }

    addVRExitButton() {
        const exitBtn = document.createElement('button');
        exitBtn.textContent = 'Exit VR';
        exitBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 1rem 2rem;
            background: rgba(239, 68, 68, 0.8);
            border: 2px solid rgba(239, 68, 68, 1);
            border-radius: 10px;
            color: white;
            cursor: pointer;
            font-weight: 600;
            z-index: 10001;
        `;
        exitBtn.addEventListener('click', () => {
            this.exitVRTour();
        });
        document.body.appendChild(exitBtn);
    }

    async exitVRTour() {
        if (this.xrSession) {
            await this.xrSession.end();
            this.xrSession = null;
        }
        
        // Remove canvas and exit button
        const canvas = document.querySelector('canvas[style*="z-index: 10000"]');
        if (canvas) canvas.remove();
        
        const exitBtn = document.querySelector('button[style*="Exit VR"]');
        if (exitBtn) exitBtn.remove();
    }

    async start3DTour(tour) {
        // Fallback 3D tour using WebGL
        const modal = document.createElement('div');
        modal.id = 'vr-tour-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        `;

        modal.innerHTML = `
            <div style="max-width: 1200px; width: 100%; position: relative;">
                <button id="close-tour-modal" style="position: absolute; top: -3rem; right: 0; background: transparent; border: 2px solid #ba944f; color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600; z-index: 10001;">
                    ✕ Close Tour
                </button>
                
                <div style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                    <h2 style="color: #ba944f; margin-bottom: 1rem;">${tour.title}</h2>
                    <p style="opacity: 0.8; margin-bottom: 2rem;">${tour.description}</p>
                    
                    <div id="tour-3d-container" style="width: 100%; height: 500px; background: rgba(0, 0, 0, 0.5); border-radius: 10px; position: relative; overflow: hidden;">
                        <canvas id="tour-3d-canvas" style="width: 100%; height: 100%;"></canvas>
                        <div id="tour-info-overlay" style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0, 0, 0, 0.9), transparent); padding: 2rem; color: white;">
                            <h3 id="current-planet-name" style="color: #ba944f; margin-bottom: 0.5rem;">${tour.planets[0]}</h3>
                            <p id="current-planet-info" style="opacity: 0.8;">Exploring planet in 3D...</p>
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1rem; justify-content: center;">
                        <button id="prev-planet-btn" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                            ← Previous
                        </button>
                        <button id="next-planet-btn" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                            Next →
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup 3D rendering
        this.setup3DTour(tour, modal);

        // Event listeners
        document.getElementById('close-tour-modal').addEventListener('click', () => {
            modal.remove();
        });
    }

    setup3DTour(tour, modal) {
        const canvas = document.getElementById('tour-3d-canvas');
        if (!canvas) return;

        const gl = canvas.getContext('webgl');
        if (!gl) {
            console.error('WebGL not supported');
            return;
        }

        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);

        let currentPlanetIndex = 0;

        const renderPlanet = () => {
            gl.clearColor(0, 0, 0.1, 1);
            gl.clear(gl.COLOR_BUFFER_BIT);

            // Render simple planet representation
            // This would be enhanced with proper 3D rendering
            const planetName = tour.planets[currentPlanetIndex];
            const planetInfo = document.getElementById('current-planet-info');
            const planetNameEl = document.getElementById('current-planet-name');
            
            if (planetNameEl) planetNameEl.textContent = planetName;
            if (planetInfo) planetInfo.textContent = `Exploring ${planetName} in 3D space...`;

            requestAnimationFrame(renderPlanet);
        };

        renderPlanet();

        // Navigation
        document.getElementById('next-planet-btn').addEventListener('click', () => {
            currentPlanetIndex = (currentPlanetIndex + 1) % tour.planets.length;
        });

        document.getElementById('prev-planet-btn').addEventListener('click', () => {
            currentPlanetIndex = (currentPlanetIndex - 1 + tour.planets.length) % tour.planets.length;
        });
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryVRTours = new PlanetDiscoveryVRTours();
}

