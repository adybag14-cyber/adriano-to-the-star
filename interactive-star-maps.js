/**
 * Interactive Star Maps
 * Deterministic, dependency-free local stellar-neighbourhood explorer.
 *
 * Rendering is deliberately split into two layers: a tiny WebGL shader paints
 * the deep-field background while a 2D canvas keeps astrometric labels, hit
 * testing and assistive state sharp and deterministic.  If WebGL is unavailable
 * the map remains fully usable with the 2D fallback.
 */

const THREE_SAFE_CLAMP = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, Number(value) || 0));

class InteractiveStarMaps {
    constructor() {
        this.canvas = null;
        this.context = null;
        this.container = null;
        this.resizeObserver = null;
        this.animationFrame = null;
        this.cosmosFrame = null;
        this.cosmos = null;
        this.cosmosIdleId = null;
        this.cosmosDelayTimer = null;
        this.cosmosGeneration = 0;
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.pointer = { active: false, moved: false, id: null, x: 0, y: 0 };
        this.routesVisible = true;
        this.orbitsVisible = true;
        this.filter = 'all';
        this.projectionMode = 'xy';
        this.query = '';
        this.selected = null;
        this.selectedIndex = 0;
        this.tutorialStep = 0;
        this.prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
        this.stars = this.createCatalog();
        this.backgroundStars = this.createBackgroundStars(360);
    }

    createCatalog() {
        // Confirmed-world counts and Planetary OS targets are synchronized with
        // the NASA Exoplanet Archive snapshot used by this release. Host stars
        // never become procedural planets; each route names a specific world.
        const catalogue = [
            { id: 'sol', name: 'Sol', x: 0, y: 0, z: 0, distance: 0, type: 'home', spectral: 'G2V', constellation: 'Local system', magnitude: -26.74, planets: 8, educationTarget: 'Earth', description: 'Our home star and the origin point for every route shown on this map.' },
            { id: 'proxima', name: 'Proxima Centauri', x: -3.1, y: 2.8, z: -0.2, distance: 4.24, type: 'exoplanet', spectral: 'M5.5Ve', constellation: 'Centaurus', magnitude: 11.13, planets: 2, educationTarget: 'Proxima Cen b', description: 'The nearest known star to the Sun and host of two confirmed planets in the current NASA Exoplanet Archive.' },
            { id: 'alpha-centauri', name: 'Alpha Centauri A/B', x: -3.5, y: 2.55, z: -0.1, distance: 4.37, type: 'nearby', spectral: 'G2V + K1V', constellation: 'Centaurus', magnitude: -0.27, planets: 0, description: 'A bright binary pair gravitationally bound to Proxima Centauri; no confirmed planet is currently mapped here.' },
            { id: 'barnard', name: "Barnard's Star", x: -1.8, y: 5.7, z: 0.3, distance: 5.96, type: 'exoplanet', spectral: 'M4V', constellation: 'Ophiuchus', magnitude: 9.51, planets: 4, educationTarget: 'Barnard b', description: 'A high proper-motion red dwarf with four confirmed short-period, sub-Earth minimum-mass planets.' },
            { id: 'sirius', name: 'Sirius', x: 7.4, y: -4.3, z: -0.8, distance: 8.6, type: 'nearby', spectral: 'A1V + DA2', constellation: 'Canis Major', magnitude: -1.46, planets: 0, description: 'The brightest star in Earth’s night sky and a nearby binary system.' },
            { id: 'epsilon-eridani', name: 'Epsilon Eridani', x: 8.9, y: 5.2, z: 0.4, distance: 10.5, type: 'exoplanet', spectral: 'K2V', constellation: 'Eridanus', magnitude: 3.73, planets: 1, educationTarget: 'eps Eri b', description: 'A young nearby star with a debris disk and a long-period giant planet.' },
            { id: 'procyon', name: 'Procyon', x: 10.1, y: -5.6, z: 0.8, distance: 11.46, type: 'nearby', spectral: 'F5IV-V + DQZ', constellation: 'Canis Minor', magnitude: 0.34, planets: 0, description: 'A nearby binary whose primary is among the brightest stars in the sky.' },
            { id: 'tau-ceti', name: 'Tau Ceti', x: 7.9, y: 9.1, z: -1.2, distance: 11.9, type: 'exoplanet', spectral: 'G8.5V', constellation: 'Cetus', magnitude: 3.5, planets: 3, educationTarget: 'tau Cet f', description: 'A quiet Sun-like star with three controversial planetary entries in the current archive.' },
            { id: 'vega', name: 'Vega', x: -20.4, y: 15.4, z: 3.2, distance: 25.0, type: 'anchor', spectral: 'A0V', constellation: 'Lyra', magnitude: 0.03, planets: 0, description: 'A rapidly rotating blue-white star used as a historic photometric reference.' },
            { id: 'fomalhaut', name: 'Fomalhaut', x: 17.1, y: 19.2, z: -2.1, distance: 25.1, type: 'anchor', spectral: 'A3V', constellation: 'Piscis Austrinus', magnitude: 1.16, planets: 0, description: 'A bright young star surrounded by a sculpted circumstellar debris disk.' },
            { id: 'trappist-1', name: 'TRAPPIST-1', x: -22.6, y: -31.6, z: 1.8, distance: 40.7, type: 'exoplanet', spectral: 'M8V', constellation: 'Aquarius', magnitude: 18.8, planets: 7, educationTarget: 'TRAPPIST-1 e', description: 'An ultracool dwarf with seven Earth-sized planets, several near the temperate zone.' },
            { id: 'polaris', name: 'Polaris', x: -84, y: 314, z: 77, distance: 447, type: 'anchor', spectral: 'F7Ib', constellation: 'Ursa Minor', magnitude: 1.98, planets: 0, description: 'The current northern pole star and a classical Cepheid variable in a multiple system.' },
            { id: 'betelgeuse', name: 'Betelgeuse', x: 386, y: -333, z: -89, distance: 548, type: 'giant', spectral: 'M1–M2 Ia–ab', constellation: 'Orion', magnitude: 0.42, planets: 0, description: 'A pulsating red supergiant near the end of its stellar evolution.' },
            { id: 'rigel', name: 'Rigel', x: 663, y: -493, z: -110, distance: 860, type: 'giant', spectral: 'B8Ia', constellation: 'Orion', magnitude: 0.13, planets: 0, description: 'A luminous blue supergiant marking Orion’s foot.' },
            { id: 'kepler-186', name: 'Kepler-186', x: -411, y: 364, z: 183, distance: 580, type: 'kepler', spectral: 'M1V', constellation: 'Cygnus', magnitude: 14.6, planets: 5, educationTarget: 'Kepler-186 f', description: 'Host of Kepler-186 f, the first Earth-sized planet discovered in another star’s habitable zone.' },
            { id: 'kepler-452', name: 'Kepler-452', x: -1040, y: 982, z: 214, distance: 1400, type: 'kepler', spectral: 'G2V', constellation: 'Cygnus', magnitude: 13.4, planets: 1, educationTarget: 'Kepler-452 b', description: 'A Sun-like star with the controversial super-Earth entry Kepler-452 b.' },
            { id: 'toi-700', name: 'TOI-700', x: 69, y: -76, z: 14, distance: 101.4, type: 'exoplanet', spectral: 'M2V', constellation: 'Dorado', magnitude: 13.2, planets: 4, educationTarget: 'TOI-700 d', description: 'A nearby red dwarf with four confirmed small planets, including temperate-zone worlds.' }
        ];

        const physics = {
            sol: { temperature: 5772, luminosity: 1, mass: 1, radius: 1, discovery: 'Reference system', ra: 'Ephemeris', dec: 'dependent', source: 'NASA Solar System reference' },
            proxima: { temperature: 3042, luminosity: 0.0017, mass: 0.122, radius: 0.154, discovery: 'Radial velocity / astrometry', ra: '14h 29m 43s', dec: '−62° 40′ 46″', source: 'NASA Exoplanet Archive' },
            'alpha-centauri': { temperature: 5790, luminosity: 1.52, mass: 1.08, radius: 1.22, discovery: 'Binary astrometry', ra: '14h 39m 37s', dec: '−60° 50′ 02″', source: 'ESA Gaia / SIMBAD' },
            barnard: { temperature: 3195, luminosity: 0.0035, mass: 0.16, radius: 0.19, discovery: 'Radial velocity', ra: '17h 57m 49s', dec: '+04° 41′ 36″', source: 'NASA Exoplanet Archive' },
            sirius: { temperature: 9940, luminosity: 25.4, mass: 2.06, radius: 1.71, discovery: 'Binary astrometry', ra: '06h 45m 09s', dec: '−16° 42′ 58″', source: 'ESA Gaia / SIMBAD' },
            'epsilon-eridani': { temperature: 5084, luminosity: 0.34, mass: 0.82, radius: 0.74, discovery: 'Radial velocity', ra: '03h 32m 56s', dec: '−09° 27′ 30″', source: 'NASA Exoplanet Archive' },
            procyon: { temperature: 6530, luminosity: 6.9, mass: 1.50, radius: 2.05, discovery: 'Binary astrometry', ra: '07h 39m 18s', dec: '+05° 13′ 30″', source: 'ESA Gaia / SIMBAD' },
            'tau-ceti': { temperature: 5344, luminosity: 0.52, mass: 0.78, radius: 0.79, discovery: 'Radial velocity candidate', ra: '01h 44m 04s', dec: '−15° 56′ 15″', source: 'NASA Exoplanet Archive' },
            vega: { temperature: 9602, luminosity: 40.1, mass: 2.14, radius: 2.36, discovery: 'Photometric standard', ra: '18h 36m 56s', dec: '+38° 47′ 01″', source: 'ESA Gaia / SIMBAD' },
            fomalhaut: { temperature: 8590, luminosity: 16.6, mass: 1.92, radius: 1.84, discovery: 'Resolved debris disk', ra: '22h 57m 39s', dec: '−29° 37′ 20″', source: 'ESA Gaia / SIMBAD' },
            'trappist-1': { temperature: 2566, luminosity: 0.00055, mass: 0.0898, radius: 0.119, discovery: 'Transit timing', ra: '23h 06m 30s', dec: '−05° 02′ 36″', source: 'NASA Exoplanet Archive' },
            polaris: { temperature: 6015, luminosity: 1260, mass: 5.4, radius: 37.5, discovery: 'Cepheid astrometry', ra: '02h 31m 49s', dec: '+89° 15′ 51″', source: 'ESA Gaia / SIMBAD' },
            betelgeuse: { temperature: 3500, luminosity: 126000, mass: 16.5, radius: 764, discovery: 'Interferometry', ra: '05h 55m 10s', dec: '+07° 24′ 25″', source: 'SIMBAD' },
            rigel: { temperature: 12100, luminosity: 120000, mass: 21, radius: 78.9, discovery: 'Spectroscopy', ra: '05h 14m 32s', dec: '−08° 12′ 06″', source: 'SIMBAD' },
            'kepler-186': { temperature: 3788, luminosity: 0.041, mass: 0.54, radius: 0.52, discovery: 'Kepler transit', ra: '19h 54m 36s', dec: '+43° 57′ 18″', source: 'NASA Exoplanet Archive' },
            'kepler-452': { temperature: 5757, luminosity: 1.20, mass: 1.04, radius: 1.11, discovery: 'Kepler transit', ra: '19h 44m 01s', dec: '+44° 16′ 39″', source: 'NASA Exoplanet Archive' },
            'toi-700': { temperature: 3480, luminosity: 0.023, mass: 0.42, radius: 0.42, discovery: 'TESS transit', ra: '06h 28m 23s', dec: '−65° 34′ 46″', source: 'NASA Exoplanet Archive' }
        };
        return catalogue.map((star) => ({ ...star, ...physics[star.id] }));
    }

    createBackgroundStars(count) {
        let seed = 0x5f3759df;
        const random = () => {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            return seed / 0xffffffff;
        };
        return Array.from({ length: count }, () => ({
            x: random(), y: random(), radius: 0.25 + random() * 1.15, alpha: 0.16 + random() * 0.58
        }));
    }

    initCosmosRenderer() {
        const canvas = this.container?.querySelector('#star-map-cosmos');
        if (!canvas) return;
        const gl = canvas.getContext('webgl', {
            alpha: false,
            antialias: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false
        });
        if (!gl) {
            this.container.dataset.cosmosRenderer = 'canvas-fallback';
            return;
        }

        const compile = (type, source) => {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                const message = gl.getShaderInfoLog(shader) || 'Unknown shader compilation error';
                gl.deleteShader(shader);
                throw new Error(message);
            }
            return shader;
        };

        try {
            const vertex = compile(gl.VERTEX_SHADER, `
                attribute vec2 a_position;
                void main(){ gl_Position = vec4(a_position, 0.0, 1.0); }
            `);
            const fragment = compile(gl.FRAGMENT_SHADER, `
                precision highp float;
                uniform vec2 u_resolution;
                uniform float u_time;
                uniform vec2 u_camera;

                float hash21(vec2 p) {
                    p = fract(p * vec2(123.34, 456.21));
                    p += dot(p, p + 45.32);
                    return fract(p.x * p.y);
                }
                float noise(vec2 p) {
                    vec2 i = floor(p), f = fract(p);
                    f = f * f * (3.0 - 2.0 * f);
                    return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
                               mix(hash21(i + vec2(0.0, 1.0)), hash21(i + 1.0), f.x), f.y);
                }
                float stars(vec2 uv, float scale, float threshold) {
                    vec2 cell = floor(uv * scale);
                    vec2 local = fract(uv * scale) - 0.5;
                    float seed = hash21(cell);
                    vec2 offset = vec2(hash21(cell + 2.4), hash21(cell + 7.1)) - 0.5;
                    float d = length(local - offset * 0.62);
                    float flare = max(0.0, 1.0 - d * (23.0 + seed * 13.0));
                    return flare * smoothstep(threshold, 1.0, seed);
                }
                void main() {
                    vec2 resolution = max(u_resolution, vec2(1.0));
                    vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / resolution.y;
                    vec2 drift = u_camera / resolution * 0.08;
                    float t = u_time * 0.008;
                    float n = noise((uv + drift) * 2.3 + vec2(t, -t));
                    n += 0.5 * noise((uv - drift) * 5.1 - vec2(t * 0.7, t));
                    float band = exp(-pow(abs(uv.y + 0.10 + sin(uv.x * 2.2) * 0.12), 2.0) * 10.0);
                    vec3 color = vec3(0.002, 0.008, 0.025);
                    color += vec3(0.015, 0.09, 0.16) * n * band;
                    color += vec3(0.08, 0.025, 0.17) * pow(n, 2.2) * (0.35 + band);
                    float s = stars(uv + drift, 54.0, 0.90);
                    s += stars(uv * 1.31 - drift * 0.7, 103.0, 0.965) * 0.72;
                    color += vec3(0.72, 0.88, 1.0) * s;
                    float vignette = smoothstep(1.25, 0.18, length(uv));
                    gl_FragColor = vec4(color * (0.58 + 0.42 * vignette), 1.0);
                }
            `);
            const program = gl.createProgram();
            gl.attachShader(program, vertex);
            gl.attachShader(program, fragment);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Shader link failed');
            gl.deleteShader(vertex);
            gl.deleteShader(fragment);
            const buffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
            const position = gl.getAttribLocation(program, 'a_position');
            gl.enableVertexAttribArray(position);
            gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
            this.cosmos = {
                canvas,
                gl,
                program,
                buffer,
                resolution: gl.getUniformLocation(program, 'u_resolution'),
                time: gl.getUniformLocation(program, 'u_time'),
                camera: gl.getUniformLocation(program, 'u_camera'),
                started: performance.now()
            };
            this.container.dataset.cosmosRenderer = 'webgl';
            this.renderCosmos(performance.now());
        } catch (error) {
            console.warn('Star Maps GPU background unavailable; using deterministic 2D fallback.', error);
            this.container.dataset.cosmosRenderer = 'canvas-fallback';
            this.cosmos = null;
        }
    }

    scheduleCosmosRenderer(container) {
        const generation = ++this.cosmosGeneration;
        container.dataset.cosmosRenderer = 'canvas-fallback';

        const initialise = () => {
            this.cosmosIdleId = null;
            this.cosmosDelayTimer = null;
            if (generation !== this.cosmosGeneration || this.container !== container || !container.isConnected || this.cosmos) return;
            this.initCosmosRenderer();
            this.scheduleRender();
        };

        const scheduleIdle = () => {
            if (generation !== this.cosmosGeneration || this.container !== container || !container.isConnected) return;
            if (typeof window.requestIdleCallback === 'function') {
                this.cosmosIdleId = window.requestIdleCallback(initialise, { timeout: 1600 });
            } else {
                this.cosmosDelayTimer = window.setTimeout(initialise, 120);
            }
        };

        // The complete deterministic canvas, controls, catalogue and tutorial
        // are painted first. Shader compilation is then promoted during idle
        // time, keeping the WebGL deep field as an enhancement rather than a
        // startup dependency.
        requestAnimationFrame(() => requestAnimationFrame(scheduleIdle));
    }

    renderCosmos(now) {
        if (!this.cosmos || document.hidden) return;
        const { canvas, gl, program } = this.cosmos;
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
        const width = Math.max(1, Math.round(rect.width * ratio));
        const height = Math.max(1, Math.round(rect.height * ratio));
        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
            gl.viewport(0, 0, width, height);
        }
        gl.useProgram(program);
        gl.uniform2f(this.cosmos.resolution, width, height);
        gl.uniform1f(this.cosmos.time, this.prefersReducedMotion ? 0 : (now - this.cosmos.started) / 1000);
        gl.uniform2f(this.cosmos.camera, this.camera.x, this.camera.y);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (!this.prefersReducedMotion) {
            this.cosmosFrame = requestAnimationFrame((time) => this.renderCosmos(time));
        }
    }

    createCanvas(containerOrId) {
        const container = typeof containerOrId === 'string' ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return null;
        this.destroy();
        this.container = container;
        container.innerHTML = this.template();
        container.dataset.starMapReady = 'true';
        this.canvas = container.querySelector('#star-map');
        this.context = this.canvas.getContext('2d', { alpha: true });
        this.bindControls();
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(container.querySelector('.stellar-map-viewport'));
        this.resize();
        this.selectStar(this.stars[0], false);
        this.scheduleCosmosRenderer(container);
        return this.canvas;
    }

    createMap(containerOrId) { return this.createCanvas(containerOrId); }

    template() {
        return `
            <section class="stellar-map-shell" aria-labelledby="stellar-map-heading">
                <div class="stellar-map-command">
                    <div>
                        <p class="stellar-map-eyebrow">LOCAL STELLAR REFERENCE FRAME · ICRS-INSPIRED EDUCATIONAL PROJECTION</p>
                        <h2 id="stellar-map-heading">Astrometry flight console</h2>
                    </div>
                    <button id="stellar-map-tutorial" class="stellar-map-button stellar-map-tutorial-button" type="button" aria-haspopup="dialog">Guided tutorial</button>
                </div>
                <div class="stellar-map-toolbar">
                    <label class="stellar-map-field">Find a star or system
                        <input id="stellar-map-search" type="search" placeholder="Try TRAPPIST-1 or Kepler" autocomplete="off">
                    </label>
                    <label class="stellar-map-field">Catalogue layer
                        <select id="stellar-map-filter">
                            <option value="all">All mapped objects</option>
                            <option value="exoplanet">Nearby exoplanets</option>
                            <option value="kepler">Kepler targets</option>
                            <option value="anchor">Navigation anchors</option>
                            <option value="giant">Giant stars</option>
                        </select>
                    </label>
                    <label class="stellar-map-field">Projection plane
                        <select id="stellar-map-projection">
                            <option value="xy">Galactic XY</option>
                            <option value="xz">Galactic XZ</option>
                            <option value="yz">Galactic YZ</option>
                        </select>
                    </label>
                    <button id="stellar-map-routes" class="stellar-map-button" type="button" aria-pressed="true">Routes on</button>
                    <button id="stellar-map-orbits" class="stellar-map-button" type="button" aria-pressed="true">Habitable zones on</button>
                    <button id="stellar-map-reset" class="stellar-map-button" type="button">Reset view</button>
                </div>
                <div class="stellar-map-stage">
                    <div class="stellar-map-viewport">
                        <canvas id="star-map-cosmos" class="stellar-map-cosmos" aria-hidden="true"></canvas>
                        <canvas id="star-map" class="stellar-map-canvas" tabindex="0" role="application" aria-label="Interactive stellar map" aria-describedby="stellar-map-instructions stellar-map-announcer"></canvas>
                        <p id="stellar-map-instructions" class="visually-hidden">Use arrow keys to pan, plus and minus to zoom, N and P to move between stars, V to change projection, L to toggle routes, T to open the tutorial, Enter to center the selected star, and R to reset.</p>
                        <div class="stellar-map-hud" aria-hidden="true">
                            <span class="stellar-map-status">GPU deep field · deterministic astrometry</span>
                            <span id="stellar-map-coordinates" class="stellar-map-coordinates">XY · 0, 0 · 100%</span>
                        </div>
                        <div class="stellar-map-zoom" aria-label="Map zoom controls">
                            <button id="stellar-map-zoom-in" class="stellar-map-button" type="button" aria-label="Zoom in">+</button>
                            <button id="stellar-map-zoom-out" class="stellar-map-button" type="button" aria-label="Zoom out">−</button>
                        </div>
                    </div>
                    <aside class="stellar-map-detail" aria-labelledby="stellar-map-name">
                        <p class="stellar-map-kicker" id="stellar-map-kicker">Home system</p>
                        <h2 id="stellar-map-name">Sol</h2>
                        <p class="stellar-map-detail-copy" id="stellar-map-description"></p>
                        <dl class="stellar-map-facts">
                            <div><dt>Distance</dt><dd id="stellar-map-distance">0 ly</dd></div>
                            <div><dt>Spectral class</dt><dd id="stellar-map-spectral">G2V</dd></div>
                            <div><dt>Constellation</dt><dd id="stellar-map-constellation">Local system</dd></div>
                            <div><dt>Known worlds</dt><dd id="stellar-map-planets">8</dd></div>
                            <div><dt>Effective temperature</dt><dd id="stellar-map-temperature">5,772 K</dd></div>
                            <div><dt>Luminosity</dt><dd id="stellar-map-luminosity">1 L☉</dd></div>
                            <div><dt>Mass / radius</dt><dd id="stellar-map-mass-radius">1 / 1 solar</dd></div>
                            <div><dt>Parallax proxy</dt><dd id="stellar-map-parallax">—</dd></div>
                            <div><dt>RA / Dec</dt><dd id="stellar-map-radec">—</dd></div>
                        </dl>
                        <div class="stellar-map-equation" aria-label="Derived astrophysics">
                            <span>DERIVED PHYSICS</span>
                            <p id="stellar-map-derivation">Select a target to inspect distance modulus and habitable-zone scaling.</p>
                        </div>
                        <div class="stellar-map-detail-actions">
                            <button id="stellar-map-center" class="stellar-map-button" type="button">Center target</button>
                            <a id="stellar-map-education" href="education.html?target=Earth">Open Earth in Planetary OS</a>
                        </div>
                    </aside>
                </div>
                <div class="stellar-map-catalogue" aria-labelledby="stellar-map-catalogue-title">
                    <div>
                        <p class="stellar-map-eyebrow">KEYBOARD-ADDRESSABLE CATALOGUE</p>
                        <h3 id="stellar-map-catalogue-title">Visible systems</h3>
                    </div>
                    <div id="stellar-map-object-list" class="stellar-map-object-list" role="listbox" aria-label="Visible stars and systems"></div>
                </div>
                <div class="stellar-map-legend" aria-label="Map legend">
                    <span style="--legend-color:#f8fafc">Home / nearby</span>
                    <span style="--legend-color:#67e8f9">Exoplanet system</span>
                    <span style="--legend-color:#a78bfa">Kepler target</span>
                    <span style="--legend-color:#bef264">Navigation anchor</span>
                    <span style="--legend-color:#fb7185">Giant star</span>
                </div>
                <div class="stellar-map-provenance">
                    <p><strong>Data provenance.</strong> Positions are a compact, pedagogical 3D neighbourhood—not a precision navigation solution. Stellar and exoplanet properties are curated from authoritative archives; values may have heterogeneous literature uncertainties.</p>
                    <div class="stellar-map-source-links">
                        <a href="https://exoplanetarchive.ipac.caltech.edu/" rel="noopener noreferrer" target="_blank">NASA Exoplanet Archive</a>
                        <a href="https://www.cosmos.esa.int/web/gaia/dr3" rel="noopener noreferrer" target="_blank">ESA Gaia DR3</a>
                        <a href="https://simbad.cds.unistra.fr/simbad/" rel="noopener noreferrer" target="_blank">CDS SIMBAD</a>
                        <a href="https://science.nasa.gov/exoplanets/" rel="noopener noreferrer" target="_blank">NASA Exoplanet Science</a>
                    </div>
                </div>
                <p id="stellar-map-announcer" class="visually-hidden" aria-live="polite"></p>
                <dialog id="stellar-map-tutorial-dialog" class="stellar-map-tutorial-dialog" aria-labelledby="stellar-map-tutorial-title" aria-describedby="stellar-map-tutorial-copy">
                    <form method="dialog">
                        <div class="stellar-map-tutorial-progress" aria-hidden="true"><span id="stellar-map-tutorial-meter"></span></div>
                        <p class="stellar-map-eyebrow">ASTROMETRY FIELD LAB · <span id="stellar-map-tutorial-count">1 / 5</span></p>
                        <h2 id="stellar-map-tutorial-title">Read the reference frame</h2>
                        <p id="stellar-map-tutorial-copy"></p>
                        <div class="stellar-map-tutorial-actions">
                            <button id="stellar-map-tutorial-back" class="stellar-map-button" type="button">Previous</button>
                            <button class="stellar-map-button" value="cancel">Close</button>
                            <button id="stellar-map-tutorial-next" class="stellar-map-button stellar-map-button-primary" type="button">Next</button>
                        </div>
                    </form>
                </dialog>
            </section>`;
    }

    bindControls() {
        const search = this.container.querySelector('#stellar-map-search');
        const filter = this.container.querySelector('#stellar-map-filter');
        const projection = this.container.querySelector('#stellar-map-projection');
        const routes = this.container.querySelector('#stellar-map-routes');
        const orbits = this.container.querySelector('#stellar-map-orbits');
        search.addEventListener('input', () => {
            this.query = search.value.trim().toLowerCase();
            const exact = this.visibleStars().find(star => star.name.toLowerCase().includes(this.query));
            if (this.query && exact) this.selectStar(exact, true);
            this.renderObjectList();
            this.scheduleRender();
        });
        filter.addEventListener('change', () => {
            this.filter = filter.value;
            const visible = this.visibleStars();
            if (visible[0] && !visible.includes(this.selected)) this.selectStar(visible[0], false);
            this.renderObjectList();
            this.scheduleRender();
        });
        projection.addEventListener('change', () => this.setProjection(projection.value));
        routes.addEventListener('click', () => {
            this.routesVisible = !this.routesVisible;
            routes.setAttribute('aria-pressed', String(this.routesVisible));
            routes.textContent = this.routesVisible ? 'Routes on' : 'Routes off';
            this.announce(`Navigation routes ${this.routesVisible ? 'shown' : 'hidden'}.`);
            this.scheduleRender();
        });
        orbits.addEventListener('click', () => {
            this.orbitsVisible = !this.orbitsVisible;
            orbits.setAttribute('aria-pressed', String(this.orbitsVisible));
            orbits.textContent = this.orbitsVisible ? 'Habitable zones on' : 'Habitable zones off';
            this.announce(`Habitable-zone overlays ${this.orbitsVisible ? 'shown' : 'hidden'}.`);
            this.scheduleRender();
        });
        this.container.querySelector('#stellar-map-reset').addEventListener('click', () => this.resetView());
        this.container.querySelector('#stellar-map-center').addEventListener('click', () => this.centerSelected());
        this.container.querySelector('#stellar-map-zoom-in').addEventListener('click', () => this.zoomBy(1.28));
        this.container.querySelector('#stellar-map-zoom-out').addEventListener('click', () => this.zoomBy(0.78));
        this.container.querySelector('#stellar-map-tutorial').addEventListener('click', () => this.openTutorial());
        this.container.querySelector('#stellar-map-tutorial-back').addEventListener('click', () => this.changeTutorialStep(-1));
        this.container.querySelector('#stellar-map-tutorial-next').addEventListener('click', () => this.changeTutorialStep(1));

        this.canvas.addEventListener('pointerdown', event => {
            this.pointer = { active: true, moved: false, id: event.pointerId, x: event.clientX, y: event.clientY };
            this.canvas.setPointerCapture(event.pointerId);
            this.canvas.classList.add('is-dragging');
        });
        this.canvas.addEventListener('pointermove', event => {
            if (!this.pointer.active || event.pointerId !== this.pointer.id) return;
            const dx = event.clientX - this.pointer.x;
            const dy = event.clientY - this.pointer.y;
            if (Math.abs(dx) + Math.abs(dy) > 2) this.pointer.moved = true;
            this.camera.x += dx;
            this.camera.y += dy;
            this.pointer.x = event.clientX;
            this.pointer.y = event.clientY;
            this.scheduleRender();
        });
        const endPointer = event => {
            if (!this.pointer.active || event.pointerId !== this.pointer.id) return;
            const moved = this.pointer.moved;
            this.pointer.active = false;
            this.canvas.classList.remove('is-dragging');
            if (!moved) this.pick(event.offsetX, event.offsetY);
        };
        this.canvas.addEventListener('pointerup', endPointer);
        this.canvas.addEventListener('pointercancel', endPointer);
        this.canvas.addEventListener('wheel', event => {
            event.preventDefault();
            const factor = Math.exp(-event.deltaY * 0.0012);
            this.zoomAt(factor, event.offsetX, event.offsetY);
        }, { passive: false });
        this.canvas.addEventListener('keydown', event => {
            const amount = event.shiftKey ? 70 : 30;
            if (event.key === 'ArrowLeft') this.camera.x += amount;
            else if (event.key === 'ArrowRight') this.camera.x -= amount;
            else if (event.key === 'ArrowUp') this.camera.y += amount;
            else if (event.key === 'ArrowDown') this.camera.y -= amount;
            else if (event.key === '+' || event.key === '=') this.zoomBy(1.2);
            else if (event.key === '-') this.zoomBy(0.82);
            else if (event.key.toLowerCase() === 'r') this.resetView();
            else if (event.key.toLowerCase() === 'n') this.stepSelection(1);
            else if (event.key.toLowerCase() === 'p') this.stepSelection(-1);
            else if (event.key.toLowerCase() === 'v') this.cycleProjection();
            else if (event.key.toLowerCase() === 'l') routes.click();
            else if (event.key.toLowerCase() === 't') this.openTutorial();
            else if (event.key === 'Home') this.selectStar(this.stars[0], true);
            else if (event.key === 'Enter') this.centerSelected();
            else return;
            event.preventDefault();
            this.scheduleRender();
        });
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.cosmos && !this.cosmosFrame) this.renderCosmos(performance.now());
            if (document.hidden && this.cosmosFrame) {
                cancelAnimationFrame(this.cosmosFrame);
                this.cosmosFrame = null;
            }
        }, { signal: this.createAbortController().signal });
        this.renderObjectList();
    }

    createAbortController() {
        if (!this.abortController || this.abortController.signal.aborted) this.abortController = new AbortController();
        return this.abortController;
    }

    announce(message) {
        const node = this.container?.querySelector('#stellar-map-announcer');
        if (!node) return;
        node.textContent = '';
        requestAnimationFrame(() => { node.textContent = message; });
    }

    setProjection(mode) {
        if (!['xy', 'xz', 'yz'].includes(mode)) return;
        this.projectionMode = mode;
        const select = this.container?.querySelector('#stellar-map-projection');
        if (select) select.value = mode;
        this.camera = { x: 0, y: 0, zoom: this.camera.zoom };
        this.updateCanvasAccessibilityLabel();
        this.announce(`${mode.toUpperCase()} projection selected.`);
        this.scheduleRender();
    }

    cycleProjection() {
        const modes = ['xy', 'xz', 'yz'];
        this.setProjection(modes[(modes.indexOf(this.projectionMode) + 1) % modes.length]);
    }

    stepSelection(delta) {
        const visible = this.visibleStars();
        if (!visible.length) return;
        const current = Math.max(0, visible.indexOf(this.selected));
        const next = (current + delta + visible.length) % visible.length;
        this.selectStar(visible[next], true);
    }

    renderObjectList() {
        const list = this.container?.querySelector('#stellar-map-object-list');
        if (!list) return;
        const visible = this.visibleStars();
        list.replaceChildren(...visible.map((star) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'stellar-map-object';
            button.setAttribute('role', 'option');
            button.setAttribute('aria-selected', String(this.selected?.id === star.id));
            button.dataset.starId = star.id;
            button.innerHTML = `<span class="stellar-map-object-spectrum">${star.spectral}</span><strong>${star.name}</strong><span>${star.distance.toLocaleString()} ly</span>`;
            button.addEventListener('click', () => this.selectStar(star, true));
            return button;
        }));
    }

    tutorialSteps() {
        return [
            { title: 'Read the reference frame', copy: 'This is a compact 3D educational projection. Galactic XY, XZ and YZ views reveal why a flat sky chart cannot encode true spatial neighbourhoods.' },
            { title: 'Interrogate the catalogue', copy: 'Search or filter the map, then use N and P on the focused canvas to move between objects. The list below the viewport offers the same targets as ordinary accessible buttons.' },
            { title: 'Translate parallax into distance', copy: 'For nearby stars, distance in parsecs is approximately 1 divided by parallax in arcseconds. The console reports the equivalent milliarcsecond parallax and distance modulus.' },
            { title: 'Compare stellar physics', copy: 'Temperature, luminosity, mass, radius and spectral class place a star on the Hertzsprung–Russell diagram. Habitable-zone rings scale approximately with the square root of luminosity.' },
            { title: 'Treat uncertainty as data', copy: 'Catalogue values are heterogeneous literature measurements. Follow the NASA Exoplanet Archive, ESA Gaia and CDS SIMBAD links, inspect uncertainties and cite the originating paper for research use.' }
        ];
    }

    openTutorial() {
        const dialog = this.container?.querySelector('#stellar-map-tutorial-dialog');
        if (!dialog) return;
        this.tutorialStep = 0;
        this.renderTutorial();
        if (typeof dialog.showModal === 'function') dialog.showModal();
        else dialog.setAttribute('open', '');
        requestAnimationFrame(() => dialog.querySelector('#stellar-map-tutorial-next')?.focus());
    }

    changeTutorialStep(delta) {
        const steps = this.tutorialSteps();
        const next = this.tutorialStep + delta;
        if (next >= steps.length) {
            this.container?.querySelector('#stellar-map-tutorial-dialog')?.close();
            this.canvas?.focus();
            this.announce('Tutorial complete. Focus returned to the stellar map.');
            return;
        }
        this.tutorialStep = Math.max(0, next);
        this.renderTutorial();
    }

    renderTutorial() {
        const steps = this.tutorialSteps();
        const step = steps[this.tutorialStep];
        const set = (id, value) => { const node = this.container?.querySelector(`#${id}`); if (node) node.textContent = value; };
        set('stellar-map-tutorial-title', step.title);
        set('stellar-map-tutorial-copy', step.copy);
        set('stellar-map-tutorial-count', `${this.tutorialStep + 1} / ${steps.length}`);
        set('stellar-map-tutorial-next', this.tutorialStep === steps.length - 1 ? 'Finish' : 'Next');
        const meter = this.container?.querySelector('#stellar-map-tutorial-meter');
        if (meter) meter.style.width = `${((this.tutorialStep + 1) / steps.length) * 100}%`;
        const back = this.container?.querySelector('#stellar-map-tutorial-back');
        if (back) back.disabled = this.tutorialStep === 0;
    }

    visibleStars() {
        return this.stars.filter(star => {
            const matchesFilter = this.filter === 'all' || star.type === this.filter || (this.filter === 'exoplanet' && ['exoplanet', 'kepler'].includes(star.type));
            const matchesQuery = !this.query || `${star.name} ${star.constellation} ${star.spectral}`.toLowerCase().includes(this.query);
            return matchesFilter && matchesQuery;
        });
    }

    resize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        this.canvas.width = Math.max(1, Math.round(rect.width * ratio));
        this.canvas.height = Math.max(1, Math.round(rect.height * ratio));
        this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
        this.viewport = { width: rect.width, height: rect.height, ratio };
        this.scheduleRender();
    }

    scheduleRender() {
        if (this.animationFrame) return;
        this.animationFrame = requestAnimationFrame(() => {
            this.animationFrame = null;
            this.render();
        });
    }

    projection(star) {
        const axes = this.projectionMode === 'xz' ? [star.x, star.z] : this.projectionMode === 'yz' ? [star.y, star.z] : [star.x, star.y];
        const compressedX = Math.sign(axes[0]) * Math.sqrt(Math.abs(axes[0])) * 33;
        const compressedY = Math.sign(axes[1]) * Math.sqrt(Math.abs(axes[1])) * 33;
        return {
            x: this.viewport.width / 2 + this.camera.x + compressedX * this.camera.zoom,
            y: this.viewport.height / 2 + this.camera.y + compressedY * this.camera.zoom
        };
    }

    render() {
        if (!this.context || !this.viewport) return;
        const ctx = this.context;
        const { width, height } = this.viewport;
        ctx.clearRect(0, 0, width, height);
        if (!this.cosmos) {
            const gradient = ctx.createRadialGradient(width * 0.52, height * 0.48, 20, width * 0.52, height * 0.48, Math.max(width, height) * 0.74);
            gradient.addColorStop(0, '#08162e');
            gradient.addColorStop(0.5, '#040a19');
            gradient.addColorStop(1, '#01030a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            this.drawBackground(ctx, width, height);
        }
        this.drawGrid(ctx, width, height);
        if (this.routesVisible) this.drawRoutes(ctx);
        this.labelBoxes = [];
        this.visibleStars().forEach(star => this.drawStar(ctx, star));
        const coords = this.container.querySelector('#stellar-map-coordinates');
        if (coords) coords.textContent = `${this.projectionMode.toUpperCase()} · ${Math.round(this.camera.x)}, ${Math.round(this.camera.y)} · ${Math.round(this.camera.zoom * 100)}%`;
    }

    drawBackground(ctx, width, height) {
        for (const star of this.backgroundStars) {
            const x = (star.x * width + this.camera.x * 0.06 + width) % width;
            const y = (star.y * height + this.camera.y * 0.06 + height) % height;
            ctx.globalAlpha = star.alpha;
            ctx.fillStyle = '#dcecff';
            ctx.beginPath();
            ctx.arc(x, y, star.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawGrid(ctx, width, height) {
        const spacing = Math.max(48, 92 * this.camera.zoom);
        const offsetX = ((this.camera.x % spacing) + spacing) % spacing;
        const offsetY = ((this.camera.y % spacing) + spacing) % spacing;
        ctx.strokeStyle = 'rgba(103, 232, 249, 0.075)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = offsetX; x < width; x += spacing) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
        for (let y = offsetY; y < height; y += spacing) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.08)';
        ctx.beginPath();
        ctx.moveTo(0, height * 0.72 + this.camera.y * 0.05);
        ctx.bezierCurveTo(width * 0.28, height * 0.46, width * 0.7, height * 0.86, width, height * 0.55);
        ctx.stroke();
    }

    drawRoutes(ctx) {
        const home = this.projection(this.stars[0]);
        ctx.save();
        ctx.setLineDash([4, 8]);
        ctx.lineWidth = 1;
        for (const star of this.visibleStars()) {
            if (!['exoplanet', 'kepler'].includes(star.type)) continue;
            const point = this.projection(star);
            const route = ctx.createLinearGradient(home.x, home.y, point.x, point.y);
            route.addColorStop(0, 'rgba(103,232,249,0.42)');
            route.addColorStop(1, star.type === 'kepler' ? 'rgba(167,139,250,0.2)' : 'rgba(103,232,249,0.16)');
            ctx.strokeStyle = route;
            ctx.beginPath();
            ctx.moveTo(home.x, home.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
        }
        ctx.restore();
    }

    colorFor(star) {
        return ({ home: '#f8fafc', nearby: '#e2e8f0', exoplanet: '#67e8f9', kepler: '#a78bfa', anchor: '#bef264', giant: '#fb7185' })[star.type] || '#f8fafc';
    }

    drawStar(ctx, star) {
        const point = this.projection(star);
        if (point.x < -80 || point.x > this.viewport.width + 80 || point.y < -80 || point.y > this.viewport.height + 80) return;
        const selected = this.selected?.id === star.id;
        const color = this.colorFor(star);
        const base = star.type === 'giant' ? 7 : star.type === 'home' ? 6 : 4.2;
        const radius = Math.max(2.8, base * Math.min(1.35, Math.sqrt(this.camera.zoom)));
        if (this.orbitsVisible && Number(star.luminosity) > 0 && ['home', 'exoplanet', 'kepler'].includes(star.type)) {
            const hzCenter = Math.sqrt(star.luminosity);
            const hzInner = THREE_SAFE_CLAMP(Math.sqrt(star.luminosity / 1.1), 0.025, 12);
            const hzOuter = THREE_SAFE_CLAMP(Math.sqrt(star.luminosity / 0.35), 0.04, 18);
            const scale = 5.5 * Math.max(0.8, Math.sqrt(this.camera.zoom));
            ctx.save();
            ctx.strokeStyle = 'rgba(190, 242, 100, 0.34)';
            ctx.lineWidth = selected ? 1.4 : 0.8;
            ctx.setLineDash([2, 3]);
            ctx.beginPath();
            ctx.arc(point.x, point.y, Math.max(radius + 5, hzInner * scale + radius), 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(103, 232, 249, 0.22)';
            ctx.beginPath();
            ctx.arc(point.x, point.y, Math.max(radius + 9, hzOuter * scale + radius), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
            star.hzCenter = hzCenter;
        }
        const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius * (selected ? 6.4 : 4.4));
        glow.addColorStop(0, color);
        glow.addColorStop(0.2, color);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius * (selected ? 6.4 : 4.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
        if (selected) {
            ctx.strokeStyle = '#bef264';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(point.x, point.y, radius + 7, 0, Math.PI * 2);
            ctx.stroke();
        }
        if (this.camera.zoom >= 0.62 || selected || star.type === 'home') {
            ctx.font = `${selected ? 700 : 600} 12px "DM Mono", ui-monospace, monospace`;
            const distanceLabel = `${star.distance.toLocaleString()} ly`;
            const nameWidth = ctx.measureText(star.name).width;
            let distanceWidth = 0;
            if (selected) {
                ctx.font = '600 9px "DM Mono", ui-monospace, monospace';
                distanceWidth = ctx.measureText(distanceLabel).width;
            }
            const labelWidth = Math.max(nameWidth, distanceWidth) + 2;
            const labelHeight = selected ? 31 : 18;
            const gap = radius + 9;
            const candidates = [
                { x: point.x + gap, y: point.y - labelHeight / 2 },
                { x: point.x - gap - labelWidth, y: point.y - labelHeight / 2 },
                { x: point.x - labelWidth / 2, y: point.y - radius - labelHeight - 11 },
                { x: point.x - labelWidth / 2, y: point.y + radius + 11 }
            ];
            const overlaps = box => this.labelBoxes.some(existing => !(
                box.x + box.width + 5 < existing.x ||
                box.x > existing.x + existing.width + 5 ||
                box.y + box.height + 4 < existing.y ||
                box.y > existing.y + existing.height + 4
            ));
            const inside = box => box.x >= 5 && box.y >= 5 &&
                box.x + box.width <= this.viewport.width - 5 &&
                box.y + box.height <= this.viewport.height - 5;
            const availableLabelBox = candidates
                .map(candidate => ({ ...candidate, width: labelWidth, height: labelHeight }))
                .find(candidate => inside(candidate) && !overlaps(candidate));
            if (!availableLabelBox && !selected && star.type !== 'home') return;
            const labelBox = availableLabelBox ||
                { ...candidates[0], width: labelWidth, height: labelHeight };
            this.labelBoxes.push(labelBox);
            ctx.font = `${selected ? 700 : 600} 12px "DM Mono", ui-monospace, monospace`;
            ctx.fillStyle = selected ? '#ffffff' : '#c9d7eb';
            ctx.textBaseline = 'middle';
            ctx.fillText(star.name, labelBox.x, labelBox.y + (selected ? 8 : 9));
            if (selected) {
                ctx.font = '600 9px "DM Mono", ui-monospace, monospace';
                ctx.fillStyle = '#8fa3be';
                ctx.fillText(distanceLabel, labelBox.x, labelBox.y + 24);
            }
        }
    }

    pick(x, y) {
        let nearest = null;
        let distance = 22;
        for (const star of this.visibleStars()) {
            const point = this.projection(star);
            const candidate = Math.hypot(point.x - x, point.y - y);
            if (candidate < distance) { nearest = star; distance = candidate; }
        }
        if (nearest) this.selectStar(nearest, false);
    }

    selectStar(star, center) {
        if (!star) return;
        this.selected = star;
        this.selectedIndex = Math.max(0, this.stars.indexOf(star));
        this.container.dataset.starMapSelected = star.id;
        const set = (id, value) => { const node = this.container.querySelector(`#${id}`); if (node) node.textContent = value; };
        set('stellar-map-kicker', ({ home: 'Home system', nearby: 'Nearby system', exoplanet: 'Exoplanet system', kepler: 'Kepler archive target', anchor: 'Navigation anchor', giant: 'Evolved giant' })[star.type]);
        set('stellar-map-name', star.name);
        set('stellar-map-description', star.description);
        set('stellar-map-distance', `${star.distance.toLocaleString()} ly`);
        set('stellar-map-spectral', star.spectral);
        set('stellar-map-constellation', star.constellation);
        set('stellar-map-planets', String(star.planets));
        set('stellar-map-temperature', star.temperature ? `${Number(star.temperature).toLocaleString()} K` : 'Literature dependent');
        set('stellar-map-luminosity', star.luminosity != null ? `${Number(star.luminosity).toLocaleString(undefined, { maximumFractionDigits: 5 })} L☉` : 'Literature dependent');
        set('stellar-map-mass-radius', `${Number(star.mass || 0).toLocaleString()} / ${Number(star.radius || 0).toLocaleString()} solar`);
        const parsecs = Number(star.distance || 0) / 3.26156;
        const parallaxMas = parsecs > 0 ? 1000 / parsecs : null;
        const distanceModulus = parsecs > 0 ? 5 * Math.log10(parsecs) - 5 : null;
        const hzInner = Number(star.luminosity) > 0 ? Math.sqrt(star.luminosity / 1.1) : null;
        const hzOuter = Number(star.luminosity) > 0 ? Math.sqrt(star.luminosity / 0.35) : null;
        set('stellar-map-parallax', parallaxMas ? `${parallaxMas.toFixed(parallaxMas > 100 ? 1 : 2)} mas` : 'Reference origin');
        set('stellar-map-radec', `${star.ra || '—'} / ${star.dec || '—'}`);
        set('stellar-map-derivation', parsecs > 0
            ? `d = ${parsecs.toFixed(2)} pc · m−M = ${distanceModulus.toFixed(2)} mag · simple HZ ≈ ${hzInner?.toFixed(2)}–${hzOuter?.toFixed(2)} AU · ${star.discovery || 'catalogued object'} · ${star.source || 'literature compilation'}`
            : `Solar reference: d = 0 pc · L = 1 L☉ · simple HZ ≈ ${hzInner?.toFixed(2)}–${hzOuter?.toFixed(2)} AU.`);
        const education = this.container.querySelector('#stellar-map-education');
        if (star.educationTarget) {
            education.href = `education.html?target=${encodeURIComponent(star.educationTarget)}`;
            education.removeAttribute('aria-disabled');
            education.removeAttribute('tabindex');
            education.style.opacity = '';
            education.style.pointerEvents = '';
            education.textContent = `Open ${star.educationTarget} in Planetary OS`;
        } else {
            education.removeAttribute('href');
            education.setAttribute('aria-disabled', 'true');
            education.setAttribute('tabindex', '-1');
            education.style.opacity = '0.48';
            education.style.pointerEvents = 'none';
            education.textContent = 'No confirmed planet available';
        }
        this.updateCanvasAccessibilityLabel();
        this.renderObjectList();
        this.announce(`${star.name} selected. ${star.spectral}, ${star.distance.toLocaleString()} light-years, ${star.planets} known worlds.`);
        if (center) this.centerSelected();
        this.scheduleRender();
    }

    updateCanvasAccessibilityLabel() {
        if (!this.canvas || !this.selected) return;
        this.canvas.setAttribute('aria-label', `${this.selected.name} selected in ${this.projectionMode.toUpperCase()} projection, ${this.selected.distance.toLocaleString()} light-years away. Use N and P to change target or Enter to center.`);
    }

    centerSelected() {
        if (!this.selected) return;
        const axes = this.projectionMode === 'xz' ? [this.selected.x, this.selected.z] : this.projectionMode === 'yz' ? [this.selected.y, this.selected.z] : [this.selected.x, this.selected.y];
        const compressedX = Math.sign(axes[0]) * Math.sqrt(Math.abs(axes[0])) * 33;
        const compressedY = Math.sign(axes[1]) * Math.sqrt(Math.abs(axes[1])) * 33;
        this.camera.x = -compressedX * this.camera.zoom;
        this.camera.y = -compressedY * this.camera.zoom;
        this.announce(`${this.selected.name} centered.`);
        this.scheduleRender();
    }

    zoomAt(factor, x, y) {
        const previous = this.camera.zoom;
        const next = Math.min(4.5, Math.max(0.28, previous * factor));
        const centerX = x - this.viewport.width / 2 - this.camera.x;
        const centerY = y - this.viewport.height / 2 - this.camera.y;
        this.camera.x -= centerX * (next / previous - 1);
        this.camera.y -= centerY * (next / previous - 1);
        this.camera.zoom = next;
        this.scheduleRender();
    }

    zoomBy(factor) { this.zoomAt(factor, this.viewport.width / 2, this.viewport.height / 2); }

    resetView() {
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.query = '';
        this.filter = 'all';
        this.projectionMode = 'xy';
        this.routesVisible = true;
        this.orbitsVisible = true;
        const search = this.container.querySelector('#stellar-map-search');
        const filter = this.container.querySelector('#stellar-map-filter');
        const projection = this.container.querySelector('#stellar-map-projection');
        if (search) search.value = '';
        if (filter) filter.value = 'all';
        if (projection) projection.value = 'xy';
        const routes = this.container.querySelector('#stellar-map-routes');
        if (routes) { routes.setAttribute('aria-pressed', 'true'); routes.textContent = 'Routes on'; }
        const orbits = this.container.querySelector('#stellar-map-orbits');
        if (orbits) { orbits.setAttribute('aria-pressed', 'true'); orbits.textContent = 'Habitable zones on'; }
        this.selectStar(this.stars[0], false);
        this.announce('Map reset to Sol in the Galactic XY projection.');
    }

    destroy() {
        this.cosmosGeneration += 1;
        this.resizeObserver?.disconnect();
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        if (this.cosmosFrame) cancelAnimationFrame(this.cosmosFrame);
        if (this.cosmosIdleId !== null && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(this.cosmosIdleId);
        if (this.cosmosDelayTimer !== null) clearTimeout(this.cosmosDelayTimer);
        this.abortController?.abort();
        if (this.cosmos?.gl) {
            this.cosmos.gl.deleteBuffer(this.cosmos.buffer);
            this.cosmos.gl.deleteProgram(this.cosmos.program);
        }
        this.animationFrame = null;
        this.cosmosFrame = null;
        this.cosmosIdleId = null;
        this.cosmosDelayTimer = null;
        this.cosmos = null;
    }
}

let interactiveStarMapsInstance = null;
function starMaps() {
    if (!interactiveStarMapsInstance) interactiveStarMapsInstance = new InteractiveStarMaps();
    return interactiveStarMapsInstance;
}
window.InteractiveStarMaps = InteractiveStarMaps;
window.starMaps = starMaps;
window.interactiveStarMaps = starMaps();
