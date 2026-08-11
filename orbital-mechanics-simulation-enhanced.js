/**
 * Enhanced Orbital Mechanics Simulation
 * Simulates planet orbits with realistic physics
 */

class OrbitalMechanicsSimulationEnhanced {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.planets = [];
        this.isRunning = false;
        this.animationFrame = null;
        this.timeScale = 1;
        this.init();
    }

    init() {
        this.trackEvent('o_rb_it_al_me_ch_an_ic_ss_im_ul_at_io_ne_nh_an_ce_d_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("o_rb_it_al_me_ch_an_ic_ss_im_ul_at_io_ne_nh_an_ce_d_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Initialize planets for simulation
     */
    initializePlanets(planetData) {
        this.planets = planetData.map(planet => ({
            name: planet.kepler_name || planet.kepoi_name || 'Unknown',
            kepid: planet.kepid,
            semiMajorAxis: parseFloat(planet.radius) * 0.1 || 50, // AU (scaled)
            eccentricity: Math.random() * 0.3 || 0.1,
            period: parseFloat(planet.koi_period) || 365, // days
            mass: parseFloat(planet.mass) || 1, // Earth masses
            angle: Math.random() * Math.PI * 2,
            color: this.getPlanetColor(planet),
            radius: Math.max(3, Math.min(parseFloat(planet.radius) || 1, 10))
        }));
    }

    /**
     * Get planet color based on type
     */
    getPlanetColor(planet) {
        const radius = parseFloat(planet.radius) || 1;
        if (radius < 1.5) return '#4a90e2'; // Earth-like (blue)
        if (radius < 3) return '#8b4513'; // Super-Earth (brown)
        if (radius < 6) return '#ffa500'; // Neptune-like (orange)
        return '#ff6b6b'; // Gas giant (red)
    }

    /**
     * Render simulation
     */
    renderSimulation(container) {
        if (!container) return;

        container.innerHTML = `
            <div class="orbital-simulation-container" style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem;">
                <div class="simulation-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="color: #ba944f; margin: 0;">🌌 Orbital Mechanics Simulation</h3>
                    <div class="simulation-controls" style="display: flex; gap: 0.5rem;">
                        <button class="play-pause-btn" style="background: rgba(186, 148, 79, 0.2); border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem 1.5rem; border-radius: 6px; cursor: pointer; font-weight: 600;">Play</button>
                        <button class="reset-btn" style="background: rgba(186, 148, 79, 0.2); border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">Reset</button>
                    </div>
                </div>
                <div class="time-scale-control" style="margin-bottom: 1rem;">
                    <label style="color: rgba(255, 255, 255, 0.7); margin-right: 1rem;">Time Scale:</label>
                    <input type="range" class="time-scale-slider" min="0.1" max="5" step="0.1" value="1" style="width: 200px;">
                    <span class="time-scale-value" style="color: #ba944f; margin-left: 1rem; font-weight: 600;">1x</span>
                </div>
                <canvas id="orbital-canvas" style="width: 100%; height: 600px; border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 10px; background: radial-gradient(ellipse at center, #1a1a2e 0%, #000000 100%);"></canvas>
                <div class="planet-info" style="margin-top: 1.5rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                    ${this.planets.map(planet => `
                        <div class="planet-info-card" data-planet="${planet.name}" style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 8px; padding: 1rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${planet.color};"></div>
                                <div style="font-weight: 600; color: #ba944f;">${planet.name}</div>
                            </div>
                            <div style="font-size: 0.85rem; color: rgba(255, 255, 255, 0.7);">
                                <div>Period: ${planet.period.toFixed(1)} days</div>
                                <div>Semi-major: ${planet.semiMajorAxis.toFixed(2)} AU</div>
                                <div>Eccentricity: ${planet.eccentricity.toFixed(2)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Setup canvas
        this.canvas = document.getElementById('orbital-canvas');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = 600;

        // Setup event listeners
        this.setupEventListeners();
        this.draw();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const playPauseBtn = document.querySelector('.play-pause-btn');
        const resetBtn = document.querySelector('.reset-btn');
        const timeScaleSlider = document.querySelector('.time-scale-slider');
        const timeScaleValue = document.querySelector('.time-scale-value');

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                this.toggle();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.reset();
            });
        }

        if (timeScaleSlider && timeScaleValue) {
            timeScaleSlider.addEventListener('input', (e) => {
                this.timeScale = parseFloat(e.target.value);
                timeScaleValue.textContent = `${this.timeScale.toFixed(1)}x`;
            });
        }
    }

    /**
     * Toggle simulation
     */
    toggle() {
        this.isRunning = !this.isRunning;
        const btn = document.querySelector('.play-pause-btn');
        if (btn) {
            btn.textContent = this.isRunning ? 'Pause' : 'Play';
        }

        if (this.isRunning) {
            this.animate();
        } else {
            if (this.animationFrame) {
                cancelAnimationFrame(this.animationFrame);
            }
        }
    }

    /**
     * Reset simulation
     */
    reset() {
        this.planets.forEach(planet => {
            planet.angle = Math.random() * Math.PI * 2;
        });
        this.draw();
    }

    /**
     * Animate simulation
     */
    animate() {
        if (!this.isRunning) return;

        // Update planet positions
        this.planets.forEach(planet => {
            const angularVelocity = (2 * Math.PI) / planet.period;
            planet.angle += angularVelocity * 0.01 * this.timeScale;
        });

        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * Draw simulation
     */
    draw() {
        if (!this.ctx || !this.canvas) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const scale = Math.min(this.canvas.width, this.canvas.height) * 0.3;

        // Draw star (center)
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw orbits
        this.planets.forEach(planet => {
            const a = planet.semiMajorAxis * scale;
            const b = a * Math.sqrt(1 - planet.eccentricity * planet.eccentricity);
            
            this.ctx.strokeStyle = 'rgba(186, 148, 79, 0.2)';
            this.ctx.lineWidth = 1;
            this.ctx.beginPath();
            this.ctx.ellipse(centerX, centerY, a, b, 0, 0, Math.PI * 2);
            this.ctx.stroke();
        });

        // Draw planets
        this.planets.forEach(planet => {
            const a = planet.semiMajorAxis * scale;
            const b = a * Math.sqrt(1 - planet.eccentricity * planet.eccentricity);
            
            const x = centerX + a * Math.cos(planet.angle);
            const y = centerY + b * Math.sin(planet.angle);

            // Draw planet
            this.ctx.fillStyle = planet.color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, planet.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw planet name
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(planet.name, x + planet.radius + 5, y);
        });
    }
}

// Initialize enhanced orbital mechanics simulation
if (typeof window !== 'undefined') {
    window.OrbitalMechanicsSimulationEnhanced = OrbitalMechanicsSimulationEnhanced;
    window.orbitalMechanicsSimulationEnhanced = new OrbitalMechanicsSimulationEnhanced();
}

