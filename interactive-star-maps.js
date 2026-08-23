/**
 * Interactive Star Maps
 * Deterministic, dependency-free local stellar-neighbourhood explorer.
 */

class InteractiveStarMaps {
    constructor() {
        this.canvas = null;
        this.context = null;
        this.container = null;
        this.resizeObserver = null;
        this.animationFrame = null;
        this.camera = { x: 0, y: 0, zoom: 1 };
        this.pointer = { active: false, moved: false, id: null, x: 0, y: 0 };
        this.routesVisible = true;
        this.filter = 'all';
        this.query = '';
        this.selected = null;
        this.stars = this.createCatalog();
        this.backgroundStars = this.createBackgroundStars(360);
    }

    createCatalog() {
        return [
            { id: 'sol', name: 'Sol', x: 0, y: 0, z: 0, distance: 0, type: 'home', spectral: 'G2V', constellation: 'Local system', magnitude: -26.74, planets: 8, description: 'Our home star and the origin point for every route shown on this map.' },
            { id: 'proxima', name: 'Proxima Centauri', x: -3.1, y: 2.8, z: -0.2, distance: 4.24, type: 'exoplanet', spectral: 'M5.5Ve', constellation: 'Centaurus', magnitude: 11.13, planets: 3, description: 'The nearest known star to the Sun and host of the temperate candidate Proxima Centauri b.' },
            { id: 'alpha-centauri', name: 'Alpha Centauri A/B', x: -3.5, y: 2.55, z: -0.1, distance: 4.37, type: 'nearby', spectral: 'G2V + K1V', constellation: 'Centaurus', magnitude: -0.27, planets: 'Candidate', description: 'A bright binary pair gravitationally bound to Proxima Centauri.' },
            { id: 'barnard', name: "Barnard's Star", x: -1.8, y: 5.7, z: 0.3, distance: 5.96, type: 'exoplanet', spectral: 'M4V', constellation: 'Ophiuchus', magnitude: 9.51, planets: 1, description: 'A high proper-motion red dwarf with a confirmed sub-Earth-mass planet candidate.' },
            { id: 'sirius', name: 'Sirius', x: 7.4, y: -4.3, z: -0.8, distance: 8.6, type: 'nearby', spectral: 'A1V + DA2', constellation: 'Canis Major', magnitude: -1.46, planets: 0, description: 'The brightest star in Earth’s night sky and a nearby binary system.' },
            { id: 'epsilon-eridani', name: 'Epsilon Eridani', x: 8.9, y: 5.2, z: 0.4, distance: 10.5, type: 'exoplanet', spectral: 'K2V', constellation: 'Eridanus', magnitude: 3.73, planets: 1, description: 'A young nearby star with a debris disk and a long-period giant planet.' },
            { id: 'procyon', name: 'Procyon', x: 10.1, y: -5.6, z: 0.8, distance: 11.46, type: 'nearby', spectral: 'F5IV-V + DQZ', constellation: 'Canis Minor', magnitude: 0.34, planets: 0, description: 'A nearby binary whose primary is among the brightest stars in the sky.' },
            { id: 'tau-ceti', name: 'Tau Ceti', x: 7.9, y: 9.1, z: -1.2, distance: 11.9, type: 'exoplanet', spectral: 'G8.5V', constellation: 'Cetus', magnitude: 3.5, planets: 4, description: 'A quiet Sun-like star with a compact candidate planetary system.' },
            { id: 'vega', name: 'Vega', x: -20.4, y: 15.4, z: 3.2, distance: 25.0, type: 'anchor', spectral: 'A0V', constellation: 'Lyra', magnitude: 0.03, planets: 0, description: 'A rapidly rotating blue-white star used as a historic photometric reference.' },
            { id: 'fomalhaut', name: 'Fomalhaut', x: 17.1, y: 19.2, z: -2.1, distance: 25.1, type: 'anchor', spectral: 'A3V', constellation: 'Piscis Austrinus', magnitude: 1.16, planets: 'Debris disk', description: 'A bright young star surrounded by a sculpted circumstellar debris disk.' },
            { id: 'trappist-1', name: 'TRAPPIST-1', x: -22.6, y: -31.6, z: 1.8, distance: 40.7, type: 'exoplanet', spectral: 'M8V', constellation: 'Aquarius', magnitude: 18.8, planets: 7, description: 'An ultracool dwarf with seven Earth-sized planets, several near the temperate zone.' },
            { id: 'polaris', name: 'Polaris', x: -84, y: 314, z: 77, distance: 447, type: 'anchor', spectral: 'F7Ib', constellation: 'Ursa Minor', magnitude: 1.98, planets: 0, description: 'The current northern pole star and a classical Cepheid variable in a multiple system.' },
            { id: 'betelgeuse', name: 'Betelgeuse', x: 386, y: -333, z: -89, distance: 548, type: 'giant', spectral: 'M1–M2 Ia–ab', constellation: 'Orion', magnitude: 0.42, planets: 0, description: 'A pulsating red supergiant near the end of its stellar evolution.' },
            { id: 'rigel', name: 'Rigel', x: 663, y: -493, z: -110, distance: 860, type: 'giant', spectral: 'B8Ia', constellation: 'Orion', magnitude: 0.13, planets: 0, description: 'A luminous blue supergiant marking Orion’s foot.' },
            { id: 'kepler-186', name: 'Kepler-186', x: -411, y: 364, z: 183, distance: 580, type: 'kepler', spectral: 'M1V', constellation: 'Cygnus', magnitude: 14.6, planets: 5, description: 'Host of Kepler-186f, the first Earth-sized planet discovered in another star’s habitable zone.' },
            { id: 'kepler-452', name: 'Kepler-452', x: -1040, y: 982, z: 214, distance: 1400, type: 'kepler', spectral: 'G2V', constellation: 'Cygnus', magnitude: 13.4, planets: 1, description: 'A Sun-like star with the candidate super-Earth Kepler-452b.' },
            { id: 'toi-700', name: 'TOI-700', x: 69, y: -76, z: 14, distance: 101.4, type: 'exoplanet', spectral: 'M2V', constellation: 'Dorado', magnitude: 13.2, planets: 4, description: 'A nearby red dwarf with multiple small planets, including temperate-zone worlds.' }
        ];
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

    createCanvas(containerOrId) {
        const container = typeof containerOrId === 'string' ? document.getElementById(containerOrId) : containerOrId;
        if (!container) return null;
        this.destroy();
        this.container = container;
        container.innerHTML = this.template();
        container.dataset.starMapReady = 'true';
        this.canvas = container.querySelector('#star-map');
        this.context = this.canvas.getContext('2d', { alpha: false });
        this.bindControls();
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(container.querySelector('.stellar-map-viewport'));
        this.resize();
        this.selectStar(this.stars[0], false);
        return this.canvas;
    }

    createMap(containerOrId) { return this.createCanvas(containerOrId); }

    template() {
        return `
            <section class="stellar-map-shell" aria-label="Interactive stellar neighbourhood map">
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
                    <button id="stellar-map-routes" class="stellar-map-button" type="button" aria-pressed="true">Routes on</button>
                    <button id="stellar-map-reset" class="stellar-map-button" type="button">Reset view</button>
                </div>
                <div class="stellar-map-stage">
                    <div class="stellar-map-viewport">
                        <canvas id="star-map" class="stellar-map-canvas" tabindex="0" role="img" aria-label="Pan and zoom a map of nearby stars and selected exoplanet systems. Click a star for details."></canvas>
                        <div class="stellar-map-hud" aria-hidden="true">
                            <span class="stellar-map-status">Interactive catalogue online</span>
                            <span id="stellar-map-coordinates" class="stellar-map-coordinates">0, 0 · 100%</span>
                        </div>
                        <div class="stellar-map-zoom" aria-label="Map zoom controls">
                            <button id="stellar-map-zoom-in" class="stellar-map-button" type="button" aria-label="Zoom in">+</button>
                            <button id="stellar-map-zoom-out" class="stellar-map-button" type="button" aria-label="Zoom out">−</button>
                        </div>
                    </div>
                    <aside class="stellar-map-detail" aria-live="polite">
                        <p class="stellar-map-kicker" id="stellar-map-kicker">Home system</p>
                        <h2 id="stellar-map-name">Sol</h2>
                        <p class="stellar-map-detail-copy" id="stellar-map-description"></p>
                        <dl class="stellar-map-facts">
                            <div><dt>Distance</dt><dd id="stellar-map-distance">0 ly</dd></div>
                            <div><dt>Spectral class</dt><dd id="stellar-map-spectral">G2V</dd></div>
                            <div><dt>Constellation</dt><dd id="stellar-map-constellation">Local system</dd></div>
                            <div><dt>Known worlds</dt><dd id="stellar-map-planets">8</dd></div>
                        </dl>
                        <div class="stellar-map-detail-actions">
                            <button id="stellar-map-center" class="stellar-map-button" type="button">Center target</button>
                            <a id="stellar-map-education" href="education.html">Open in Planetary OS</a>
                        </div>
                    </aside>
                </div>
                <div class="stellar-map-legend" aria-label="Map legend">
                    <span style="--legend-color:#f8fafc">Home / nearby</span>
                    <span style="--legend-color:#67e8f9">Exoplanet system</span>
                    <span style="--legend-color:#a78bfa">Kepler target</span>
                    <span style="--legend-color:#bef264">Navigation anchor</span>
                    <span style="--legend-color:#fb7185">Giant star</span>
                </div>
            </section>`;
    }

    bindControls() {
        const search = this.container.querySelector('#stellar-map-search');
        const filter = this.container.querySelector('#stellar-map-filter');
        const routes = this.container.querySelector('#stellar-map-routes');
        search.addEventListener('input', () => {
            this.query = search.value.trim().toLowerCase();
            const exact = this.visibleStars().find(star => star.name.toLowerCase().includes(this.query));
            if (this.query && exact) this.selectStar(exact, true);
            this.scheduleRender();
        });
        filter.addEventListener('change', () => {
            this.filter = filter.value;
            const visible = this.visibleStars();
            if (visible[0] && !visible.includes(this.selected)) this.selectStar(visible[0], false);
            this.scheduleRender();
        });
        routes.addEventListener('click', () => {
            this.routesVisible = !this.routesVisible;
            routes.setAttribute('aria-pressed', String(this.routesVisible));
            routes.textContent = this.routesVisible ? 'Routes on' : 'Routes off';
            this.scheduleRender();
        });
        this.container.querySelector('#stellar-map-reset').addEventListener('click', () => this.resetView());
        this.container.querySelector('#stellar-map-center').addEventListener('click', () => this.centerSelected());
        this.container.querySelector('#stellar-map-zoom-in').addEventListener('click', () => this.zoomBy(1.28));
        this.container.querySelector('#stellar-map-zoom-out').addEventListener('click', () => this.zoomBy(0.78));

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
            else return;
            event.preventDefault();
            this.scheduleRender();
        });
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
        const compressedX = Math.sign(star.x) * Math.sqrt(Math.abs(star.x)) * 33;
        const compressedY = Math.sign(star.y) * Math.sqrt(Math.abs(star.y)) * 33;
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
        const gradient = ctx.createRadialGradient(width * 0.52, height * 0.48, 20, width * 0.52, height * 0.48, Math.max(width, height) * 0.74);
        gradient.addColorStop(0, '#08162e');
        gradient.addColorStop(0.5, '#040a19');
        gradient.addColorStop(1, '#01030a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        this.drawBackground(ctx, width, height);
        this.drawGrid(ctx, width, height);
        if (this.routesVisible) this.drawRoutes(ctx);
        this.labelBoxes = [];
        this.visibleStars().forEach(star => this.drawStar(ctx, star));
        const coords = this.container.querySelector('#stellar-map-coordinates');
        if (coords) coords.textContent = `${Math.round(this.camera.x)}, ${Math.round(this.camera.y)} · ${Math.round(this.camera.zoom * 100)}%`;
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
        this.container.dataset.starMapSelected = star.id;
        const set = (id, value) => { const node = this.container.querySelector(`#${id}`); if (node) node.textContent = value; };
        set('stellar-map-kicker', ({ home: 'Home system', nearby: 'Nearby system', exoplanet: 'Exoplanet system', kepler: 'Kepler archive target', anchor: 'Navigation anchor', giant: 'Evolved giant' })[star.type]);
        set('stellar-map-name', star.name);
        set('stellar-map-description', star.description);
        set('stellar-map-distance', `${star.distance.toLocaleString()} ly`);
        set('stellar-map-spectral', star.spectral);
        set('stellar-map-constellation', star.constellation);
        set('stellar-map-planets', String(star.planets));
        const education = this.container.querySelector('#stellar-map-education');
        education.href = `education.html?target=${encodeURIComponent(star.name)}`;
        if (center) this.centerSelected();
        this.scheduleRender();
    }

    centerSelected() {
        if (!this.selected) return;
        const compressedX = Math.sign(this.selected.x) * Math.sqrt(Math.abs(this.selected.x)) * 33;
        const compressedY = Math.sign(this.selected.y) * Math.sqrt(Math.abs(this.selected.y)) * 33;
        this.camera.x = -compressedX * this.camera.zoom;
        this.camera.y = -compressedY * this.camera.zoom;
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
        const search = this.container.querySelector('#stellar-map-search');
        const filter = this.container.querySelector('#stellar-map-filter');
        if (search) search.value = '';
        if (filter) filter.value = 'all';
        this.selectStar(this.stars[0], false);
    }

    destroy() {
        this.resizeObserver?.disconnect();
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
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
