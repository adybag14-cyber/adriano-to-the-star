/* global THREE */

/**
 * 3D Planet Visualization Viewer using Three.js
 * 
 * Creates an interactive 3D visualization of exoplanets with:
 * - Procedural planet textures based on planet data
 * - Realistic lighting and atmosphere effects
 * - Interactive controls (rotate, zoom, pan)
 * - Starfield background
 * - Planet-specific features (rings for gas giants, atmosphere for terrestrials)
 * 
 * @class Planet3DViewer
 * @example
 * const viewer = new Planet3DViewer();
 * viewer.visualizePlanet(planetData);
 */

const FONTS = {
    RALEWAY: "'Raleway', sans-serif",
    CORMORANT: "'Cormorant Garamond', serif"
};

const EVENTS = {
    CLICK: 'click',
    RESIZE: 'resize'
};

const XR_MODES = {
    VR: 'immersive-vr',
    AR: 'immersive-ar'
};

/**
 * 3D Planet Visualization Viewer using Three.js
 * 
 * Creates an interactive 3D visualization of exoplanets with:
 * - Procedural planet textures based on planet data
 * - Realistic lighting and atmosphere effects
 * - Interactive controls (rotate, zoom, pan)
 * - Starfield background
 * - Planet-specific features (rings for gas giants, atmosphere for terrestrials)
 * 
 * @class Planet3DViewer
 * @example
 * const viewer = new Planet3DViewer();
 * viewer.visualizePlanet(planetData);
 */
class Planet3DViewer {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.planet = null;
        this.controls = null;
        this.animationId = null;
        this.isOpen = false;
        this.planetData = null;
        this.vrSession = null; // WebXR VR session
        this.arSession = null; // WebXR AR session
        this.vrSupported = false;
        this.arSupported = false;
        this.resizeHandler = null; // Store resize handler for cleanup
        this.arGround = null;
        this.arAnchor = null;
        this.xrChecked = false;
        this.xrBannerTimeout = null;
    }

    init() {
        if (this.isOpen) return;

        // Create modal container
        this.createModal();

        // Initialize Three.js
        this.initThreeJS();

        // Initialize XR Experience
        if (typeof ExoplanetXRExperience !== 'undefined') {
            this.xrExperience = new ExoplanetXRExperience(this);
        }

        // Detect XR support and update UI
        this.checkXRSupport();

        this.isOpen = true;
        this.animate();
    }

    createModal() {
        const modal = document.createElement('div');
        modal.id = 'planet-3d-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        modal.innerHTML = `
            <div style="padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.8); border-bottom: 1px solid #ba944f;">
                <div>
                    <h2 id="planet-3d-title" style="color: #ba944f; margin: 0; font-family: ${FONTS.CORMORANT};">Planet View</h2>
                    <p id="planet-3d-info" style="color: rgba(255,255,255,0.7); margin: 0.5rem 0 0 0; font-size: 0.9rem; font-family: ${FONTS.RALEWAY};"></p>
                </div>
                <button id="close-3d-btn" style="background: transparent; border: none; color: #ba944f; font-size: 2rem; cursor: pointer; transition: transform 0.2s;">×</button>
            </div>
            <div id="canvas-container" style="flex: 1; position: relative; overflow: hidden;"></div>
            <div style="padding: 1rem; display: flex; justify-content: center; gap: 2rem; flex-wrap: wrap; background: rgba(0,0,0,0.5);">
                <div style="text-align: center; color: rgba(255,255,255,0.7); font-size: 0.85rem; font-family: ${FONTS.RALEWAY};">
                    <div style="font-weight: 600; margin-bottom: 0.25rem; color: #ba944f;">Controls</div>
                    <div>Left Click: Rotate</div>
                    <div>Right Click: Pan</div>
                    <div>Scroll: Zoom</div>
                </div>
                <div style="text-align: center; color: rgba(255,255,255,0.7); font-size: 0.85rem; font-family: ${FONTS.RALEWAY};">
                    <div style="font-weight: 600; margin-bottom: 0.25rem; color: #ba944f;">Info</div>
                    <div id="planet-3d-stats" style="font-size: 0.75rem; opacity: 0.8;"></div>
                </div>
                <button id="reset-view-btn" style="background: rgba(186, 148, 79, 0.2); border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: ${FONTS.RALEWAY}; font-size: 0.85rem;">
                    Reset View
                </button>
                <button id="vr-mode-btn" style="background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.5); color: #8b5cf6; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: ${FONTS.RALEWAY}; font-size: 0.85rem; display: none;">
                    🥽 Enter VR
                </button>
                <button id="ar-mode-btn" style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.5); color: #10b981; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: ${FONTS.RALEWAY}; font-size: 0.85rem; display: none;">
                    📱 Enter AR
                </button>
                <button id="cardboard-btn" style="background: rgba(234, 179, 8, 0.18); border: 1px solid rgba(234, 179, 8, 0.4); color: #facc15; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: ${FONTS.RALEWAY}; font-size: 0.85rem;">
                    🥽 Cardboard Mode
                </button>
                <button id="surface-view-btn" style="background: rgba(74, 144, 226, 0.2); border: 1px solid rgba(74, 144, 226, 0.5); color: #4a90e2; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: ${FONTS.RALEWAY}; font-size: 0.85rem;">
                    🌍 Surface View
                </button>
                <button id="orbital-view-btn" style="background: rgba(186, 148, 79, 0.2); border: 1px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: ${FONTS.RALEWAY}; font-size: 0.85rem;">
                    🪐 Orbital View
                </button>
                <button id="governance-btn" style="background: rgba(74, 144, 226, 0.2); border: 1px solid rgba(74, 144, 226, 0.5); color: #88ccff; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: ${FONTS.RALEWAY}; font-size: 0.85rem;">
                    🏛️ Colony
                </button>
                <button id="market-btn" style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.5); color: #10b981; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: ${FONTS.RALEWAY}; font-size: 0.85rem;">
                    🏭 Market
                </button>
                <button id="combat-btn" style="background: rgba(239, 68, 68, 0.2); border: 1px solid rgba(239, 68, 68, 0.5); color: #ef4444; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: ${FONTS.RALEWAY}; font-size: 0.85rem;">
                    ⚔️ Deploy Fleet
                </button>
                <button id="invasion-btn" style="background: rgba(245, 158, 11, 0.2); border: 1px solid rgba(245, 158, 11, 0.5); color: #fbbf24; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: ${FONTS.RALEWAY}; font-size: 0.85rem;">
                    🪖 Invade
                </button>
                <button id="diplomacy-btn" style="background: rgba(136, 204, 255, 0.2); border: 1px solid rgba(136, 204, 255, 0.5); color: #88ccff; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: ${FONTS.RALEWAY}; font-size: 0.85rem;">
                    🤝 Diplomacy
                </button>
                <button id="build-btn" style="background: rgba(167, 139, 250, 0.2); border: 1px solid rgba(167, 139, 250, 0.5); color: #a78bfa; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: ${FONTS.RALEWAY}; font-size: 0.85rem;">
                    🏗️ Build
                </button>
                <button id="ascension-btn" style="background: rgba(236, 72, 153, 0.2); border: 1px solid rgba(236, 72, 153, 0.5); color: #ec4899; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: ${FONTS.RALEWAY}; font-size: 0.85rem;">
                    ✨ Ascension
                </button>
                <button id="council-btn" style="background: rgba(96, 165, 250, 0.2); border: 1px solid rgba(96, 165, 250, 0.5); color: #60a5fa; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: ${FONTS.RALEWAY}; font-size: 0.85rem;">
                    🏛️ Council
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        // Fade in
        requestAnimationFrame(() => {
            modal.style.opacity = '1';
        });

        const closeBtn = document.getElementById('close-3d-btn');
        if (closeBtn) {
            closeBtn.addEventListener(EVENTS.CLICK, () => this.close());
            closeBtn.addEventListener('mouseenter', () => { closeBtn.style.transform = 'scale(1.1)'; });
            closeBtn.addEventListener('mouseleave', () => { closeBtn.style.transform = 'scale(1)'; });
        }

        const resetBtn = document.getElementById('reset-view-btn');
        if (resetBtn) {
            resetBtn.addEventListener(EVENTS.CLICK, () => this.resetView());
        }

        // VR/AR buttons (lightweight WebXR)
        const vrBtn = document.getElementById('vr-mode-btn');
        if (vrBtn) {
            vrBtn.addEventListener(EVENTS.CLICK, () => this.startXRSession(XR_MODES.VR));
        }
        const arBtn = document.getElementById('ar-mode-btn');
        if (arBtn) {
            arBtn.addEventListener(EVENTS.CLICK, () => this.startXRSession(XR_MODES.AR));
        }
        const cardboardBtn = document.getElementById('cardboard-btn');
        if (cardboardBtn) {
            cardboardBtn.addEventListener(EVENTS.CLICK, () => this.toggleCardboardMode());
        }

        // Surface view button
        const surfaceBtn = document.getElementById('surface-view-btn');
        if (surfaceBtn) {
            surfaceBtn.addEventListener(EVENTS.CLICK, () => this.showSurfaceView());
        }

        // Orbital view button
        const orbitalBtn = document.getElementById('orbital-view-btn');
        if (orbitalBtn) {
            orbitalBtn.addEventListener(EVENTS.CLICK, () => this.showOrbitalView());
        }

        // Governance button (Q2 Feature)
        const govBtn = document.getElementById('governance-btn');
        if (govBtn && window.colonyGovernanceSystem) {
            govBtn.addEventListener(EVENTS.CLICK, () => {
                if (this.planetData) {
                    window.colonyGovernanceSystem.showGovernanceUI(
                        this.planetData.kepid || this.planetData.kepler_name,
                        this.planetData.kepler_name
                    );
                }
            });
        }

        // Economy/Market Button (Q2 Feature)
        const marketBtn = document.getElementById('market-btn');
        if (marketBtn && window.economySystem) {
            marketBtn.addEventListener(EVENTS.CLICK, () => {
                window.economySystem.showMarketUI();
            });
        }

        // Combat Button (Q3 Feature)
        const combatBtn = document.getElementById('combat-btn');
        if (combatBtn && window.tacticalCombatSystem) {
            combatBtn.addEventListener(EVENTS.CLICK, () => {
                if (this.planetData) {
                    window.tacticalCombatSystem.startBattle(this.planetData.kepler_name);
                }
            });
        }

        // Invasion Button (Q3 Feature)
        const invasionBtn = document.getElementById('invasion-btn');
        if (invasionBtn && window.groundWarfareSystem) {
            invasionBtn.addEventListener(EVENTS.CLICK, () => {
                if (this.planetData) {
                    window.groundWarfareSystem.startInvasion(this.planetData.kepler_name, this.planetData);
                }
            });
        }

        // Diplomacy Button (Q3 Feature)
        const diploBtn = document.getElementById('diplomacy-btn');
        if (diploBtn && window.diplomacySystem) {
            diploBtn.addEventListener(EVENTS.CLICK, () => {
                window.diplomacySystem.showDiplomacyUI();
            });
        }

        // Build Button (Q4 Feature)
        const buildBtn = document.getElementById('build-btn');
        if (buildBtn && window.megastructuresSystem) {
            buildBtn.addEventListener(EVENTS.CLICK, () => {
                if (this.planetData) {
                    window.megastructuresSystem.showUI(this.planetData.kepler_name);
                }
            });
        }

        // Ascension Button (Q4 Feature)
        const ascBtn = document.getElementById('ascension-btn');
        if (ascBtn && window.ascensionSystem) {
            ascBtn.addEventListener(EVENTS.CLICK, () => {
                window.ascensionSystem.showUI();
            });
        }

        // Galactic Council Button (Q4 Feature)
        const councilBtn = document.getElementById('council-btn');
        if (councilBtn && window.galacticCouncilSystem) {
            councilBtn.addEventListener(EVENTS.CLICK, () => {
                window.galacticCouncilSystem.showUI();
            });
        }
    }

    showXRBanner(message, type = 'info') {
        let banner = document.getElementById('xr-support-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'xr-support-banner';
            banner.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.85);
                color: #fff;
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 8px;
                padding: 0.65rem 1rem;
                z-index: 10002;
                font-family: ${FONTS.RALEWAY};
                font-size: 0.9rem;
                box-shadow: 0 8px 20px rgba(0,0,0,0.35);
            `;
            document.body.appendChild(banner);
        }
        banner.textContent = message;
        banner.style.borderColor = type === 'warning' ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.2)';
        banner.style.color = type === 'warning' ? '#fca5a5' : '#fff';

        if (this.xrBannerTimeout) clearTimeout(this.xrBannerTimeout);
        this.xrBannerTimeout = setTimeout(() => {
            if (banner.parentNode) banner.remove();
            this.xrBannerTimeout = null;
        }, 4000);
    }

    async startXRSession(mode) {
        if (!this.xrChecked) {
            await this.checkXRSupport();
        }

        if (mode === XR_MODES.VR) {
            if (!this.vrSupported) {
                this.showXRBanner('VR not supported on this device/browser. Try Cardboard mode.', 'warning');
                return;
            }
            if (typeof this.enterVRMode === 'function') {
                return this.enterVRMode();
            }
        }

        if (mode === XR_MODES.AR) {
            if (!this.arSupported) {
                this.showXRBanner('AR not supported on this device/browser.', 'warning');
                return;
            }
            this.showARPlaceholder();
            // Placeholder: in a full AR build, we would start an AR session with hit-test and anchors.
        }
    }

    showARPlaceholder() {
        const container = document.getElementById('canvas-container');
        if (!container) {
            this.showXRBanner('AR view unavailable (no container). Use VR or Cardboard.', 'warning');
            return;
        }
        let overlay = document.getElementById('ar-placeholder');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'ar-placeholder';
            overlay.style.cssText = `
                position: absolute;
                inset: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,0.65);
                border: 1px dashed rgba(255,255,255,0.3);
                border-radius: 10px;
                z-index: 5;
                color: #e5e7eb;
                text-align: center;
                font-family: ${FONTS.RALEWAY};
                padding: 1rem;
            `;
            overlay.innerHTML = `
                <div>
                    <div style="color:#ba944f; font-weight:700; margin-bottom:6px;">AR Preview Placeholder</div>
                    <div style="font-size:0.95rem; line-height:1.4;">This build does not include AR hit-test. Use VR or Cardboard, or run on a WebXR AR-capable device with full AR build.</div>
                </div>
            `;
            container.appendChild(overlay);
        }
        this.showXRBanner('AR placeholder shown. Use VR or Cardboard.', 'warning');
    }

    async checkXRSupport() {
        try {
            if (!navigator.xr || typeof navigator.xr.isSessionSupported !== 'function') {
                this.vrSupported = false;
                this.arSupported = false;
            } else {
                this.vrSupported = await navigator.xr.isSessionSupported(XR_MODES.VR);
                this.arSupported = await navigator.xr.isSessionSupported(XR_MODES.AR);
            }
        } catch (e) {
            console.warn('XR support check failed', e);
            this.vrSupported = false;
            this.arSupported = false;
        }

        this.xrChecked = true;
        this.updateXRButtonsVisibility();
    }

    updateXRButtonsVisibility() {
        const vrBtn = document.getElementById('vr-mode-btn');
        const arBtn = document.getElementById('ar-mode-btn');
        if (vrBtn) {
            const supported = this.vrSupported;
            vrBtn.style.display = supported ? 'inline-flex' : 'inline-flex';
            vrBtn.disabled = !supported;
            vrBtn.style.opacity = supported ? '1' : '0.35';
            vrBtn.title = supported ? 'Enter VR' : 'VR not supported on this device/browser';
            vrBtn.textContent = supported ? '🥽 Enter VR' : '🥽 VR Unsupported';
        }
        if (arBtn) {
            const supported = this.arSupported;
            arBtn.style.display = 'inline-flex';
            arBtn.disabled = !supported;
            arBtn.style.opacity = supported ? '1' : '0.35';
            arBtn.title = supported ? 'Enter AR' : 'AR not supported on this device/browser';
            arBtn.textContent = supported ? '📱 Enter AR' : '📵 AR Unsupported';
        }
    }

    initThreeJS() {
        try {
            const container = document.getElementById('canvas-container');
            if (!container) return;

            const width = container.clientWidth;
            const height = container.clientHeight;

            // Scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x000000);

            // Camera
            this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
            this.camera.position.z = 5;

            // Renderer
            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            this.renderer.setSize(width, height);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75)); // cap for perf
            container.appendChild(this.renderer.domElement);

            // Lights
            const ambientLight = new THREE.AmbientLight(0x333333);
            this.scene.add(ambientLight);

            const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
            sunLight.position.set(5, 3, 5);
            this.scene.add(sunLight);

            const backLight = new THREE.DirectionalLight(0x4444ff, 0.3);
            backLight.position.set(-5, -3, -5);
            this.scene.add(backLight);

            // Store references for dynamic updates (Galactic Events)
            this.lights = { sun: sunLight, ambient: ambientLight, back: backLight };
            this.baseLightIntensity = { sun: 1.5, ambient: 1.0 }; // Default base values

            // Starfield
            this.createStarfield();

            // Controls
            if (typeof THREE.OrbitControls !== 'undefined') {
                this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
                this.controls.enableDamping = true;
                this.controls.dampingFactor = 0.05;
                this.controls.minDistance = 2;
                this.controls.maxDistance = 10;
            }

            // Handle resize - store handler for cleanup
            this.resizeHandler = () => this.onWindowResize();
            window.addEventListener(EVENTS.RESIZE, this.resizeHandler, false);
        } catch (error) {
            console.error("Failed to initialize 3D Viewer:", error);
            const container = document.getElementById('canvas-container');
            if (container) {
                container.innerHTML = `<div style="display:flex;justify-content:center;align-items:center;height:100%;color:#ba944f;flex-direction:column;">
                    <p style="font-size:1.2rem;margin-bottom:0.5rem;">⚠️ 3D View Unavailable</p>
                    <p style="font-size:0.9rem;opacity:0.7;">WebGL is not supported or disabled.</p>
                </div>`;
            }
        }
    }

    createStarfield() {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const colors = [];

        for (let i = 0; i < 1800; i++) {
            vertices.push(
                THREE.MathUtils.randFloatSpread(400),
                THREE.MathUtils.randFloatSpread(400),
                THREE.MathUtils.randFloatSpread(400)
            );

            const color = new THREE.Color();
            color.setHSL(Math.random(), 0.2, Math.random() * 0.5 + 0.5);
            colors.push(color.r, color.g, color.b);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({ size: 0.5, vertexColors: true });
        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);
    }

    /**
     * Open viewer for a specific named planet (quick access)
     * @param {string} planetName - Name of the planet to show
     */
    openViewer(planetName) {
        // Mock data for common planets if not in database
        let data = {
            kepler_name: planetName,
            radius: 1,
            temp: 288,
            type: 'Terrestrial'
        };

        if (planetName === 'Earth') {
            data = { kepler_name: 'Earth', radius: 1, temp: 288, type: 'Terrestrial', distance: 0 };
        } else if (planetName === 'Mars') {
            data = { kepler_name: 'Mars', radius: 0.53, temp: 210, type: 'Terrestrial', distance: 0 };
        }

        this.visualizePlanet(data);
    }

    visualizePlanet(planetData) {
        this.planetData = planetData;
        if (!this.isOpen) this.init();

        this.updatePlanetInfoUI(planetData);
        this.clearExistingPlanet();

        // Create new planet based on data
        const geometry = new THREE.SphereGeometry(1.5, 64, 64);
        const material = this.getPlanetMaterial(planetData);

        this.planet = new THREE.Mesh(geometry, material);
        this.scene.add(this.planet);

        this.setupPlanetEffects(planetData);
    }

    updatePlanetInfoUI(planetData) {
        const title = document.getElementById('planet-3d-title');
        const info = document.getElementById('planet-3d-info');

        if (title) title.textContent = planetData.kepler_name || planetData.kepoi_name || `KOI-${planetData.kepid}`;
        if (info) {
            const radius = planetData.radius ? `${planetData.radius.toFixed(2)}x Earth` : 'Unknown Size';
            const temp = planetData.temp ? `${Math.round(planetData.temp)}K` : 'Unknown Temp';
            const type = this.inferPlanetType(planetData);
            info.textContent = `${type} • ${radius} • ${temp}`;
        }

        // Notify Anomaly Research System (Q1 Feature)
        if (window.anomalyResearchSystem) {
            // Wait for DOM to update with modal contents if needed, or rely on existing elements
            setTimeout(() => window.anomalyResearchSystem.onPlanetViewed(planetData), 100);
        }

        // Update stats panel
        const statsPanel = document.getElementById('planet-3d-stats');
        if (statsPanel) {
            const mass = planetData.mass ? `${planetData.mass.toFixed(2)}x Earth` : 'Unknown';
            const distance = planetData.distance ? `${planetData.distance.toFixed(0)} ly` : 'Unknown';
            const period = planetData.disc_year ? `Discovered: ${planetData.disc_year}` : '';
            statsPanel.innerHTML = `
                <div>Mass: ${mass}</div>
                <div>Distance: ${distance}</div>
                ${period ? `<div>${period}</div>` : ''}
            `;
        }
    }

    clearExistingPlanet() {
        if (this.planet) {
            this.scene.remove(this.planet);
            if (this.planet.geometry) this.planet.geometry.dispose();
            if (this.planet.material) {
                if (this.planet.material.map) this.planet.material.map.dispose();
                this.planet.material.dispose();
            }
            this.planet = null;
        }
    }

    setupPlanetEffects(planetData) {
        // Initialize Atmospheric Simulation
        if (window.AtmosphericSimulation) {
            this.forceAtmosphere = this.isTerrestrial(planetData);
            this.atmosSim = new window.AtmosphericSimulation(planetData);
        }

        // Add atmosphere glow if terrestrial or habitable
        if (this.isTerrestrial(planetData)) {
            this.addAtmosphere();
        } else if (this.isGasGiant(planetData)) {
            this.addRings(planetData);
        }
    }

    inferPlanetType(data) {
        if (data.type) return data.type;
        const radius = data.radius || 1;
        if (radius > 10) return 'Gas Giant';
        if (radius > 6) return 'Ice Giant';
        if (radius > 1.5) return 'Super Earth';
        return 'Terrestrial';
    }

    getPlanetMaterial(data) {
        const type = this.inferPlanetType(data).toLowerCase();
        const temp = data.temp || 300;

        // Base color based on temperature and type
        const color = new THREE.Color(0xaaaaaa);

        if (type.includes('gas') || type.includes('giant')) {
            // Gas Giant colors
            if (temp > 1000) color.setHex(0xffaa00); // Hot Jupiter
            else if (temp < 150) color.setHex(0x88aaff); // Ice Giant
            else color.setHex(0xd4af37); // Saturn-like
        } else {
            // Terrestrial colors
            if (data.kepler_name === 'Earth') {
                // SPECIAL EARTH HANDLING
                // We attempt to load the real texture.
                // If checking only base color, use blue.
                color.setHex(0x1a3a6e);
            }
            else if (temp > 1000) color.setHex(0xff4400); // Molten
            else if (temp > 400) color.setHex(0xcc8844); // Desert/Mars-like
            else if (temp > 250 && temp < 350) color.setHex(0x2288cc); // Earth-like
            else color.setHex(0xaaaaaa); // Rocky/Barren
        }

        let texture;

        // Try Texture Loading for Earth
        if (data.kepler_name === 'Earth') {
            const loader = new THREE.TextureLoader();
            // We use a procedural fallback initially while texture loads
            // Or return a material that updates
            const earthMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.6,
                metalness: 0.1
            });

            loader.load(
                'images/earth_texture_map.png',
                (tex) => {
                    earthMat.map = tex;
                    earthMat.needsUpdate = true;
                },
                undefined,
                (err) => {
                    console.warn('Earth texture load failed, using procedural fallback.', err);
                    earthMat.map = this.generateProceduralTexture(type, color, data);
                    earthMat.needsUpdate = true;
                }
            );
            return earthMat;
        }

        // Shader-based generation (Advanced Generation)
        if (window.PlanetShaders) {
            if (temp > 1000 && !type.includes('gas')) {
                // Lava Planet
                return new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0 },
                        noiseTexture: { value: null } // Would need noise texture, but using procedural noise in shader
                    },
                    vertexShader: window.PlanetShaders.vertexShader,
                    fragmentShader: window.PlanetShaders.lavaFragmentShader,
                    side: THREE.BackSide
                });
            } else if (type.includes('ice') || (temp < 200 && !type.includes('gas'))) {
                // Ice Planet
                return new THREE.ShaderMaterial({
                    uniforms: {},
                    vertexShader: window.PlanetShaders.vertexShader,
                    fragmentShader: window.PlanetShaders.iceFragmentShader
                });
            } else if (type.includes('gas') || type.includes('giant')) {
                // Gas Giant Shader
                return new THREE.ShaderMaterial({
                    uniforms: {
                        time: { value: 0 }
                    },
                    vertexShader: window.PlanetShaders.vertexShader,
                    fragmentShader: window.PlanetShaders.gasGiantFragmentShader
                });
            }
        }

        // Texture generation (Fallback or Terrestrial)
        texture = this.generateProceduralTexture(type, color, data);

        // Enhanced material with better lighting
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: type.includes('gas') ? 0.3 : 0.7,
            metalness: type.includes('gas') ? 0.2 : 0.1,
            emissive: type.includes('gas') ? new THREE.Color(0x222222) : new THREE.Color(0x000000),
            emissiveIntensity: type.includes('gas') ? 0.1 : 0
        });

        // Add normal map for surface detail (simulated)
        if (!type.includes('gas')) {
            material.normalScale = new THREE.Vector2(0.5, 0.5);
        }

        return material;
    }

    generateProceduralTexture(type, baseColor, data) {
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');

        // Fill background
        ctx.fillStyle = '#' + baseColor.getHexString();
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (type.includes('gas') || type.includes('giant')) {
            this.generateGasGiantTexture(ctx, canvas.width, canvas.height, baseColor);
        } else {
            this.generateTerrestrialTexture(ctx, canvas.width, canvas.height, baseColor, type, data);
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = 16;
        return texture;
    }

    generateGasGiantTexture(ctx, width, height, baseColor) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        const bands = Math.floor(Math.random() * 8) + 6;

        for (let i = 0; i <= bands; i++) {
            const offset = (Math.random() * 0.25) - 0.125;
            const r = Math.max(0, Math.min(1, baseColor.r + offset));
            const g = Math.max(0, Math.min(1, baseColor.g + offset));
            const b = Math.max(0, Math.min(1, baseColor.b + offset));
            gradient.addColorStop(i / bands, `rgb(${r * 255},${g * 255},${b * 255})`);
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Enhanced turbulence/storms with more variety
        for (let i = 0; i < 40; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const rx = Math.random() * 150 + 75;
            const ry = Math.random() * 30 + 15;

            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, Math.random() * Math.PI * 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.15 + 0.05})`;
            ctx.fill();
        }

        // Add Great Red Spot-like features
        for (let i = 0; i < 3; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const r = Math.random() * 120 + 60;

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${baseColor.r * 200},${baseColor.g * 150},${baseColor.b * 100},${Math.random() * 0.3 + 0.2})`;
            ctx.fill();
        }
    }

    generateTerrestrialTexture(ctx, width, height, baseColor, type, data) {
        if (data && data.kepler_name === 'Earth') {
            // Special handling for Earth to make it look realistic
            // Base ocean is already set

            // 1. Draw Continents (Green/Brown)
            const continentColor = 'rgba(34, 139, 34, 0.8)'; // Forest Green
            const desertColor = 'rgba(210, 180, 140, 0.8)'; // Tan

            // Draw roughly 7 major landmasses
            for (let i = 0; i < 7; i++) {
                const cx = Math.random() * width;
                const cy = Math.random() * (height - 224) + 112; // Avoid poles slightly
                const size = Math.random() * 160 + 90;

                ctx.fillStyle = Math.random() > 0.3 ? continentColor : desertColor;

                // Draw blobs for continents
                ctx.beginPath();
                for (let j = 0; j < 10; j++) {
                    const angle = (j / 10) * Math.PI * 2;
                    const r = size + (Math.random() - 0.5) * size * 0.8;
                    const px = cx + Math.cos(angle) * r;
                    const py = cy + Math.sin(angle) * r * 0.6; // Flatten slightly for projection
                    if (j === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                ctx.closePath();
                ctx.fill();

                // Add detail/islands around
                for (let k = 0; k < 5; k++) {
                    const ix = cx + (Math.random() - 0.5) * size * 2;
                    const iy = cy + (Math.random() - 0.5) * size;
                    const isize = Math.random() * 40 + 10;
                    ctx.beginPath();
                    ctx.arc(ix, iy, isize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // 2. Polar Ice Caps
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(0, 0, width, 80); // North
            ctx.fillRect(0, height - 80, width, 80); // South

            // 3. Clouds (White opacity)
            for (let i = 0; i < 20; i++) {
                const cx = Math.random() * width;
                const cy = Math.random() * height;
                const rx = Math.random() * 200 + 80;
                const ry = Math.random() * 60 + 30;

                ctx.beginPath();
                ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`;
                ctx.fill();
            }

        } else {
            // Enhanced Terrestrial Surface with more detail
            // Perlin-like noise simulation
            for (let i = 0; i < 2400; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const r = Math.random() * 8 + 1;

                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.3})`;
                ctx.fill();
            }

            // Enhanced continents with varied shapes
            for (let i = 0; i < 12; i++) {
                const x = Math.random() * width;
                const y = Math.random() * height;
                const r = Math.random() * 110 + 60;

                // Create irregular continent shape
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${baseColor.r * 255 + 50},${baseColor.g * 255 + 50},${baseColor.b * 255 + 50},${Math.random() * 0.4 + 0.3})`;
                ctx.fill();

                // Add sub-features (mountains, valleys)
                for (let j = 0; j < 5; j++) {
                    const subX = x + (Math.random() - 0.5) * r;
                    const subY = y + (Math.random() - 0.5) * r;
                    const subR = Math.random() * 24 + 8;

                    ctx.beginPath();
                    ctx.arc(subX, subY, subR, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${baseColor.r * 255 + 80},${baseColor.g * 255 + 80},${baseColor.b * 255 + 80},0.4)`;
                    ctx.fill();
                }
            }

            // Enhanced ice caps with gradient
            if (baseColor.b > baseColor.r && baseColor.b > 0.5) {
                const northGradient = ctx.createLinearGradient(0, 0, 0, 80);
                northGradient.addColorStop(0, 'rgba(255,255,255,0.9)');
                northGradient.addColorStop(1, 'rgba(200,220,255,0.6)');
                ctx.fillStyle = northGradient;
                ctx.fillRect(0, 0, width, 80); // North

                const southGradient = ctx.createLinearGradient(0, height - 80, 0, height);
                southGradient.addColorStop(0, 'rgba(200,220,255,0.6)');
                southGradient.addColorStop(1, 'rgba(255,255,255,0.9)');
                ctx.fillStyle = southGradient;
                ctx.fillRect(0, height - 80, width, 80); // South
            }

            // Add craters for rocky planets
            if (type.includes('rocky') || type.includes('barren')) {
                for (let i = 0; i < 30; i++) {
                    const x = Math.random() * width;
                    const y = Math.random() * height;
                    const r = Math.random() * 40 + 10;

                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(0,0,0,${Math.random() * 0.4 + 0.2})`;
                    ctx.fill();

                    // Crater rim highlight
                    ctx.beginPath();
                    ctx.arc(x, y, r * 0.7, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255,255,255,0.1)`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        }
    }

    isTerrestrial(data) {
        const type = this.inferPlanetType(data).toLowerCase();
        return type.includes('terrestrial') || type.includes('earth') || type.includes('rocky') || type.includes('super earth');
    }

    isGasGiant(data) {
        const type = this.inferPlanetType(data).toLowerCase();
        return type.includes('gas') || type.includes('giant') || type.includes('jupiter') || type.includes('saturn');
    }

    addAtmosphere() {
        // Enhanced atmosphere with multiple layers
        // Enhanced atmosphere with multiple layers driven by simulation
        const params = this.atmosSim ? this.atmosSim.getVisualParams() : { atmosphereColor: 0x44aaff, cloudOpacity: 0.2 };

        const innerGeometry = new THREE.SphereGeometry(1.6, 64, 64);
        const innerMaterial = new THREE.MeshPhongMaterial({
            color: params.atmosphereColor,
            transparent: true,
            opacity: params.cloudOpacity,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const innerAtmosphere = new THREE.Mesh(innerGeometry, innerMaterial);
        this.planet.add(innerAtmosphere);

        // Outer atmosphere glow
        const outerGeometry = new THREE.SphereGeometry(1.7, 64, 64);
        const outerMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(params.atmosphereColor).multiplyScalar(1.2), // Brighter outer
            transparent: true,
            opacity: params.cloudOpacity * 0.5,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        const outerAtmosphere = new THREE.Mesh(outerGeometry, outerMaterial);
        this.planet.add(outerAtmosphere);

        // Store references for cleanup
        this.atmosphereLayers = [innerAtmosphere, outerAtmosphere];
    }

    addRings(data) {
        // Always show rings for Saturn, 30% chance for other gas giants
        const planetName = (data.kepler_name || '').toLowerCase();
        const isSaturn = planetName.includes('saturn');

        if (isSaturn || Math.random() > 0.7) {
            const innerRadius = 2.0;
            const outerRadius = 3.5;

            // Use a RingGeometry - this creates a flat disc by default (lies in XY plane)
            const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 128);

            // Create a gradient texture for realistic Saturn-like rings
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 8;
            const ctx = canvas.getContext('2d');

            // Create Saturn-like ring pattern with gaps
            const gradient = ctx.createLinearGradient(0, 0, 512, 0);
            gradient.addColorStop(0, 'rgba(180, 150, 120, 0.1)');      // Inner edge (faint)
            gradient.addColorStop(0.1, 'rgba(200, 170, 130, 0.7)');    // C ring
            gradient.addColorStop(0.2, 'rgba(220, 190, 150, 0.9)');    // B ring inner
            gradient.addColorStop(0.3, 'rgba(230, 200, 160, 1.0)');    // B ring bright
            gradient.addColorStop(0.38, 'rgba(50, 40, 30, 0.1)');      // Cassini Division (gap)
            gradient.addColorStop(0.42, 'rgba(50, 40, 30, 0.1)');      // Cassini Division
            gradient.addColorStop(0.45, 'rgba(210, 180, 140, 0.8)');   // A ring
            gradient.addColorStop(0.6, 'rgba(200, 170, 130, 0.6)');    // A ring outer
            gradient.addColorStop(0.65, 'rgba(100, 80, 60, 0.2)');     // Encke Gap
            gradient.addColorStop(0.7, 'rgba(180, 150, 120, 0.4)');    // Outer A ring
            gradient.addColorStop(1, 'rgba(150, 130, 100, 0.1)');      // F ring (faint)

            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 512, 8);

            const ringTexture = new THREE.CanvasTexture(canvas);
            ringTexture.rotation = Math.PI / 2;
            ringTexture.wrapS = THREE.ClampToEdgeWrapping;
            ringTexture.wrapT = THREE.RepeatWrapping;

            const material = new THREE.MeshBasicMaterial({
                map: ringTexture,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.9,
                depthWrite: false  // Prevents z-fighting issues
            });

            const rings = new THREE.Mesh(geometry, material);

            // Rotate the ring to lie in the XZ plane (horizontal)
            rings.rotation.x = Math.PI / 2;

            // Add Saturn's characteristic axial tilt (~27 degrees)
            if (isSaturn) {
                rings.rotation.z = 27 * (Math.PI / 180);
            } else {
                // Random tilt for other planets
                rings.rotation.z = Math.random() * 0.4;
            }

            this.planet.add(rings);
            this.rings = rings;
        }
    }

    animate() {
        if (this.renderer) {
            this.renderer.setAnimationLoop(() => {
                this.render();
            });
        }
    }

    render() {
        if (!this.isOpen) return;

        if (this.planet) {
            this.planet.rotation.y += 0.001;

            // Update Atmospheric Simulation
            if (this.atmosSim && this.atmosphereLayers) {
                this.atmosSim.update();
                // Randomly drift clouds or pulse atmosphere based on sim
                if (Math.random() < 0.05) {
                    const visual = this.atmosSim.getVisualParams();
                    if (this.atmosphereLayers[0]) {
                        this.atmosphereLayers[0].material.opacity = THREE.MathUtils.lerp(
                            this.atmosphereLayers[0].material.opacity,
                            visual.cloudOpacity,
                            0.05
                        );
                        this.atmosphereLayers[0].material.color.setHex(visual.atmosphereColor);
                    }
                }
            }
        }

        if (this.controls) {
            this.controls.update();
        }

        // The original `if (this.xrExperience) { this.xrExperience.update(); }` is now replaced by the new, more specific one.

        if (this.planet && this.planet.material instanceof THREE.ShaderMaterial && this.planet.material.uniforms.time) {
            this.planet.material.uniforms.time.value += 0.01;
        }

        // Apply Galactic Event Visuals
        if (window.galacticEventSystem && this.lights) {
            const effects = window.galacticEventSystem.getActiveEffects();
            if (effects) { /* effectively used if we did something with it, but currently unused so we might just comment it or use _ */ }
            const events = window.galacticEventSystem.activeEvents || [];

            // Solar Flare: Intensity boost + Camera Shake
            const solarFlare = events.find(e => e.id === 'sf');
            if (solarFlare) {
                // Pulse light intensity
                const pulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
                this.lights.sun.intensity = this.baseLightIntensity.sun + (pulse * 2.0);
                this.lights.sun.color.setHSL(0.08, 1.0, 0.6 + pulse * 0.2); // Shift to Orange/Yellow

                // Micro camera shake
                if (this.camera) {
                    this.camera.position.x += (Math.random() - 0.5) * 0.02;
                    this.camera.position.y += (Math.random() - 0.5) * 0.02;
                }
            } else {
                // Reset checks
                if (this.lights.sun.intensity !== this.baseLightIntensity.sun) {
                    this.lights.sun.intensity = THREE.MathUtils.lerp(this.lights.sun.intensity, this.baseLightIntensity.sun, 0.1);
                    this.lights.sun.color.setHex(0xffffff);
                }
            }

            // Supernova: Blue tint + Global flash
            const supernova = events.find(e => e.id === 'sn');
            if (supernova) {
                this.scene.background = new THREE.Color(0x111144); // Temporary background shift
                this.lights.ambient.intensity = 2.0;
            } else {
                if (this.scene.background && this.scene.background.getHex() === 0x111144) {
                    this.scene.background.setHex(0x000000);
                    this.lights.ambient.intensity = 0.5; // Reset to default (approx)
                }
            }
        }

        // Render Combat (Q3 Feature)
        if (window.tacticalCombatSystem && window.tacticalCombatSystem.activeBattle) {
            this.renderCombat(window.tacticalCombatSystem);
        }

        // Render Megastructures (Q4 Feature)
        if (window.megastructuresSystem && this.planetData) {
            const struct = window.megastructuresSystem.getStructure(this.planetData.kepler_name);
            if (struct && struct.state === 'active') {
                this.renderMegastructure(struct.type);
            }
        }

        this.renderer.render(this.scene, this.camera);
    }

    renderCombat(combatSystem) {
        if (!this.combatGroup) {
            this.combatGroup = new THREE.Group();
            this.scene.add(this.combatGroup);
            this.shipMeshes = new Map(); // id -> mesh
        }

        const fleets = [...combatSystem.fleets.player, ...combatSystem.fleets.enemy];
        const activeIds = new Set(fleets.map(f => f.id));

        // Update or Create Ships
        fleets.forEach(ship => {
            if (ship.hp <= 0) return; // exploding handled separately or hidden

            let mesh = this.shipMeshes.get(ship.id);
            if (!mesh) {
                const geom = new THREE.ConeGeometry(0.5, 1.5, 8);
                const mat = new THREE.MeshBasicMaterial({ color: ship.side === 'player' ? 0x00ff00 : 0xff0000 });
                mesh = new THREE.Mesh(geom, mat);
                mesh.rotation.x = Math.PI / 2; // Point forward
                if (ship.side === 'enemy') mesh.rotation.z = Math.PI; // Face player
                this.combatGroup.add(mesh);
                this.shipMeshes.set(ship.id, mesh);
            }

            // Sync position
            mesh.position.set(ship.position.x, ship.position.y, ship.position.z);

            // Pulse effect when hit
            if (ship.lastHitTime && Date.now() - ship.lastHitTime < 200) {
                mesh.material.color.setHex(0xffffff);
            } else {
                mesh.material.color.setHex(ship.side === 'player' ? 0x00ff00 : 0xff0000);
            }
        });

        // Cleanup dead ships
        this.shipMeshes.forEach((mesh, id) => {
            if (!activeIds.has(id)) {
                this.combatGroup.remove(mesh);
                this.shipMeshes.delete(id);
            }
        });

        // Render Projectiles (Beams)
        // For simplicity, just drawing lines between attacking ships mid-fire this frame?
        // Ideally combatSystem would expose 'activeShots', but we simulate visual
        if (Math.random() > 0.8) {
            // Mock laser
            const pShips = fleets.filter(s => s.side === 'player' && s.hp > 0);
            const eShips = fleets.filter(s => s.side === 'enemy' && s.hp > 0);
            if (pShips.length && eShips.length) {
                const s = pShips[Math.floor(Math.random() * pShips.length)];
                const t = eShips[Math.floor(Math.random() * eShips.length)];
                if (this.shipMeshes.get(s.id) && this.shipMeshes.get(t.id)) {
                    this.drawLaser(this.shipMeshes.get(s.id).position, this.shipMeshes.get(t.id).position, 0x00ff00);
                }
            }
        }
    }

    renderMegastructure(type) {
        if (this.currentMegastructureType === type) return; // Already rendered

        if (!this.megastructureGroup) {
            this.megastructureGroup = new THREE.Group();
            this.scene.add(this.megastructureGroup);
        } else {
            this.megastructureGroup.clear();
        }

        this.currentMegastructureType = type;

        if (type === 'orbital_ring') {
            const geometry = new THREE.TorusGeometry(3.5, 0.1, 16, 100);
            const material = new THREE.MeshBasicMaterial({ color: 0xa78bfa, wireframe: true });
            const ring = new THREE.Mesh(geometry, material);
            ring.rotation.x = Math.PI / 2;
            this.megastructureGroup.add(ring);
        } else if (type === 'dyson_swarm') {
            const geometry = new THREE.IcosahedronGeometry(4, 1);
            const material = new THREE.MeshBasicMaterial({ color: 0xfbbf24, wireframe: true, transparent: true, opacity: 0.3 });
            const sphere = new THREE.Mesh(geometry, material);
            this.megastructureGroup.add(sphere);
        }
    }

    drawLaser(from, to, color) {
        // Immediate mode laser (inefficient but works for small scale)
        const ge = new THREE.BufferGeometry().setFromPoints([from, to]);
        const ma = new THREE.LineBasicMaterial({ color: color });
        const line = new THREE.Line(ge, ma);
        setTimeout(() => this.scene.remove(line), 100);
    }

    toggleCardboardMode() {
        const container = document.getElementById('canvas-container');
        if (!container) return;

        const isFullscreen = document.fullscreenElement === container;
        if (!isFullscreen) {
            if (container.requestFullscreen) container.requestFullscreen();
            container.style.filter = 'grayscale(0) contrast(1.05)';
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            container.style.filter = 'none';
        }

        // Orientation hint overlay
        let hint = document.getElementById('cardboard-orientation-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'cardboard-orientation-hint';
            hint.style.cssText = `
                position: fixed;
                bottom: 24px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0,0,0,0.75);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 10px;
                padding: 0.6rem 1rem;
                color: #e5e7eb;
                font-family: ${FONTS.RALEWAY};
                font-size: 0.9rem;
                z-index: 10005;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            `;
            hint.innerHTML = `🥽 Cardboard Mode — rotate your device to landscape; press Cardboard again to exit.`;
            document.body.appendChild(hint);
            setTimeout(() => hint.remove(), 6000);
        }
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;

        const container = document.getElementById('canvas-container');
        if (!container) return;

        const width = container.clientWidth;
        const height = container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    resetView() {
        if (this.camera && this.controls) {
            this.camera.position.set(0, 0, 5);
            this.controls.reset();
            if (this.planet) {
                this.planet.rotation.set(0, 0, 0);
            }
        }
    }

    close() {
        this.isOpen = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);

        const modal = document.getElementById('planet-3d-modal');
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => modal.remove(), 300);
        }

        // Remove resize event listener
        if (this.resizeHandler) {
            window.removeEventListener(EVENTS.RESIZE, this.resizeHandler, false);
            this.resizeHandler = null;
        }

        // Cleanup Three.js resources
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }

        if (this.renderer) {
            this.renderer.dispose();
            this.renderer.forceContextLoss();
            this.renderer.domElement = null;
            this.renderer = null;
        }

        if (this.scene) {
            this.scene.clear();
            this.scene = null;
        }

        this.planet = null;
        this.camera = null;

        // End VR session if active
        if (this.vrSession) {
            this.exitVRMode();
        }

        // Reset AR references
        this.arSession = null;
        this.arGround = null;
        this.arAnchor = null;
        this.xrChecked = false;
        this.vrSupported = false;
        this.arSupported = false;
        this.updateXRButtonsVisibility();
    }

    /**
     * Enter VR mode using WebXR with enhanced features
     */
    async enterVRMode() {
        if (!window.webXR || !window.webXR()) {
            alert('VR is not available in this browser. Please use a VR-compatible browser like Chrome or Edge.');
            return;
        }

        const xr = window.webXR();
        if (!xr.isVRAvailable()) {
            alert('VR hardware not detected. Please connect a VR headset.');
            return;
        }

        try {
            const glContext = this.renderer.getContext();

            // Request VR session with hand tracking and teleportation
            const sessionInit = {
                requiredFeatures: ['local-floor'],
                optionalFeatures: ['bounded-floor', 'hand-tracking', 'hit-test']
            };

            this.vrSession = await xr.requestVRSession(glContext, sessionInit);

            if (!this.vrSession) {
                throw new Error('Failed to start VR session');
            }

            // Enable XR rendering
            this.renderer.xr.enabled = true;
            this.renderer.xr.setSession(this.vrSession);

            // Set up VR controls
            this.setupVRControls();

            // Set up hand tracking if available
            if (this.vrSession.enabledFeatures && this.vrSession.enabledFeatures.includes('hand-tracking')) {
                this.setupHandTracking();
            }

            // Set up teleportation
            this.setupTeleportation();

            // Update VR button
            const vrBtn = document.getElementById('vr-mode-btn');
            if (vrBtn) {
                vrBtn.textContent = '🚪 Exit VR';
                vrBtn.style.background = 'rgba(239, 68, 68, 0.2)';
                vrBtn.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                vrBtn.style.color = '#ef4444';
            }

            // Show VR instructions
            this.showVRInstructions();

            // Handle session end
            this.vrSession.addEventListener('end', () => {
                this.exitVRMode();
            });

            // Start VR animation loop
            this.startVRAnimation();

            console.log('🥽 VR mode activated with enhanced features');
        } catch (error) {
            console.error('Failed to enter VR mode:', error);
            alert('Failed to enter VR mode: ' + error.message);
        }
    }

    /**
     * Set up VR controls (controller-based)
     */
    setupVRControls() {
        if (!this.vrSession) return;

        // Track controller positions
        this.controllers = [];
        this.vrSession.inputSources.forEach((inputSource) => {
            if (inputSource.targetRayMode === 'tracked-pointer') {
                this.controllers.push(inputSource);
            }
        });

        // Listen for new controllers
        this.vrSession.addEventListener('inputsourceschange', (event) => {
            event.added.forEach((inputSource) => {
                if (inputSource.targetRayMode === 'tracked-pointer') {
                    this.controllers.push(inputSource);
                }
            });
            event.removed.forEach((inputSource) => {
                const index = this.controllers.indexOf(inputSource);
                if (index > -1) {
                    this.controllers.splice(index, 1);
                }
            });
        });
    }

    /**
     * Set up hand tracking
     */
    setupHandTracking() {
        if (!this.vrSession || !this.vrSession.enabledFeatures.includes('hand-tracking')) {
            return;
        }

        this.handTrackingEnabled = true;
        this.hands = [];

        // Track hands
        this.vrSession.inputSources.forEach((inputSource) => {
            if (inputSource.hand) {
                this.hands.push(inputSource);
            }
        });

        // Listen for hand tracking changes
        this.vrSession.addEventListener('inputsourceschange', (event) => {
            event.added.forEach((inputSource) => {
                if (inputSource.hand) {
                    this.hands.push(inputSource);
                }
            });
            event.removed.forEach((inputSource) => {
                const index = this.hands.indexOf(inputSource);
                if (index > -1) {
                    this.hands.splice(index, 1);
                }
            });
        });

        console.log('✋ Hand tracking enabled');
    }

    /**
     * Set up teleportation controls
     */
    setupTeleportation() {
        if (!this.vrSession) return;

        this.teleportTarget = null;
        this.teleportEnabled = true;

        // Handle controller select events for teleportation
        this.vrSession.addEventListener('select', (event) => {
            if (this.teleportEnabled && event.inputSource.targetRaySpace) {
                this.handleTeleportation(event);
            }
        });

        console.log('🚀 Teleportation enabled');
    }

    /**
     * Handle teleportation
     */
    handleTeleportation(event) {
        // Get ray from controller
        const raySpace = event.inputSource.targetRaySpace;
        const frame = event.frame;

        if (!frame || !raySpace) return;

        // Create ray from controller
        const rayOrigin = new THREE.Vector3();
        const rayDirection = new THREE.Vector3(0, 0, -1);

        // Transform to world space (simplified - in production use proper XR transforms)
        // For now, teleport to a fixed distance in front of controller
        const teleportDistance = 3;
        const newPosition = new THREE.Vector3(
            rayOrigin.x + rayDirection.x * teleportDistance,
            0, // Keep on floor
            rayOrigin.z + rayDirection.z * teleportDistance
        );

        // Move camera to new position
        if (this.camera) {
            this.camera.position.lerp(newPosition, 1);
        }

        console.log('🚀 Teleported to:', newPosition);
    }

    /**
     * Show VR instructions
     */
    showVRInstructions() {
        const instructions = document.createElement('div');
        instructions.id = 'vr-instructions';
        instructions.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #ba944f;
            border-radius: 8px;
            padding: 1.5rem;
            color: #fff;
            font-family: ${FONTS.RALEWAY};
            z-index: 10001;
            max-width: 500px;
            text-align: center;
        `;
        instructions.innerHTML = `
            <h3 style="color: #ba944f; margin: 0 0 1rem 0;">🥽 VR Mode Active</h3>
            <div style="text-align: left; font-size: 0.9rem; line-height: 1.6;">
                <p style="margin: 0.5rem 0;">• Use controllers to rotate and zoom</p>
                ${this.handTrackingEnabled ? '<p style="margin: 0.5rem 0;">• ✋ Hand tracking enabled</p>' : ''}
                ${this.teleportEnabled ? '<p style="margin: 0.5rem 0;">• 🚀 Press trigger to teleport</p>' : ''}
                <p style="margin: 0.5rem 0;">• Look around to explore the planet</p>
            </div>
            <button id="close-vr-instructions" style="margin-top: 1rem; background: #ba944f; color: #000; border: none; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 600;">
                Got it!
            </button>
        `;
        document.body.appendChild(instructions);

        document.getElementById('close-vr-instructions').addEventListener('click', () => {
            instructions.remove();
        });

        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (instructions.parentNode) {
                instructions.style.opacity = '0';
                instructions.style.transition = 'opacity 0.5s';
                setTimeout(() => instructions.remove(), 500);
            }
        }, 10000);
    }

    /**
     * Start VR animation loop
     */
    startVRAnimation() {
        if (!this.vrSession) return;

        const onXRFrame = (time, frame) => {
            if (!this.vrSession) return;

            // Update controllers and hands
            this.updateVRInputs(frame);

            // Continue animation
            this.vrSession.requestAnimationFrame(onXRFrame);
        };

        this.vrSession.requestAnimationFrame(onXRFrame);
    }

    /**
     * Update VR inputs (controllers, hands)
     */
    updateVRInputs(frame) {
        if (!frame) return;

        // Update controller positions (simplified - in production use proper XR transforms)
        this.controllers.forEach(() => {
            // Controller tracking would go here
        });

        // Update hand positions (simplified)
        if (this.handTrackingEnabled) {
            this.hands.forEach(() => {
                // Hand tracking would go here
            });
        }
    }

    /**
     * Show surface view
     */
    showSurfaceView() {
        if (!this.planetData) {
            alert('No planet data available');
            return;
        }

        // Create surface view modal
        const modal = document.createElement('div');
        modal.id = 'surface-view-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10001;
            display: flex;
            flex-direction: column;
        `;

        modal.innerHTML = `
            <div style="padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.8); border-bottom: 1px solid #ba944f;">
                <h2 style="color: #ba944f; margin: 0; font-family: ${FONTS.CORMORANT};">Planet Surface View</h2>
                <button id="close-surface-view" style="background: transparent; border: none; color: #ba944f; font-size: 2rem; cursor: pointer;">×</button>
            </div>
            <div id="surface-view-container" style="flex: 1; position: relative; overflow: hidden;"></div>
        `;

        document.body.appendChild(modal);

        // Initialize surface visualization
        if (window.planetSurfaceViz) {
            window.planetSurfaceViz.createCanvas('surface-view-container');
            window.planetSurfaceViz.visualizePlanet(this.planetData);
        }

        // Close button
        document.getElementById('close-surface-view').addEventListener('click', () => {
            if (window.planetSurfaceViz) {
                window.planetSurfaceViz.destroy();
            }
            modal.remove();
        });
    }

    /**
     * Show orbital view
     */
    showOrbitalView() {
        if (!this.planetData) {
            alert('No planet data available');
            return;
        }

        // Create orbital view modal
        const modal = document.createElement('div');
        modal.id = 'orbital-view-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10001;
            display: flex;
            flex-direction: column;
        `;

        modal.innerHTML = `
            <div style="padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.8); border-bottom: 1px solid #ba944f;">
                <h2 style="color: #ba944f; margin: 0; font-family: ${FONTS.CORMORANT};">Orbital Mechanics Simulation</h2>
                <button id="close-orbital-view" style="background: transparent; border: none; color: #ba944f; font-size: 2rem; cursor: pointer;">×</button>
            </div>
            <div id="orbital-view-container" style="flex: 1; position: relative; overflow: hidden;"></div>
            <div style="padding: 1rem; display: flex; gap: 1rem; justify-content: center; background: rgba(0,0,0,0.5);">
                <button id="orbital-pause-btn" style="background: rgba(186, 148, 79, 0.2); border: 1px solid #ba944f; color: #ba944f; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">⏸️ Pause</button>
                <button id="orbital-reset-btn" style="background: rgba(186, 148, 79, 0.2); border: 1px solid #ba944f; color: #ba944f; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer;">🔄 Reset</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Initialize orbital simulation
        if (window.orbitalMechanics) {
            window.orbitalMechanics.createCanvas('orbital-view-container');
            window.orbitalMechanics.addPlanet(this.planetData);
        }

        // Control buttons
        document.getElementById('orbital-pause-btn').addEventListener('click', () => {
            if (window.orbitalMechanics) {
                window.orbitalMechanics.togglePause();
                const btn = document.getElementById('orbital-pause-btn');
                btn.textContent = window.orbitalMechanics.isPaused ? '▶️ Resume' : '⏸️ Pause';
            }
        });

        document.getElementById('orbital-reset-btn').addEventListener('click', () => {
            if (window.orbitalMechanics) {
                window.orbitalMechanics.reset();
            }
        });

        // Close button
        document.getElementById('close-orbital-view').addEventListener('click', () => {
            if (window.orbitalMechanics) {
                window.orbitalMechanics.destroy();
            }
            modal.remove();
        });
    }

    /**
     * Exit VR mode
     */
    exitVRMode() {
        if (this.vrSession) {
            this.vrSession.end();
            this.vrSession = null;
        }

        if (this.renderer) {
            this.renderer.xr.enabled = false;
        }

        // Update UI
        const vrBtn = document.getElementById('vr-mode-btn');
        if (vrBtn) {
            vrBtn.textContent = '🥽 Enter VR';
            vrBtn.style.background = 'rgba(139, 92, 246, 0.2)';
            vrBtn.style.borderColor = 'rgba(139, 92, 246, 0.5)';
            vrBtn.style.color = '#8b5cf6';
        }

        console.log('🚪 VR mode deactivated');
    }
}

// Expose globally
window.Planet3DViewer = Planet3DViewer;

// Initialize global instance
let planet3DViewerInstance = null;

function initPlanet3DViewer() {
    if (!planet3DViewerInstance) {
        planet3DViewerInstance = new Planet3DViewer();
    }
    return planet3DViewerInstance;
}

// Make available globally
window.planet3DViewer = initPlanet3DViewer();
