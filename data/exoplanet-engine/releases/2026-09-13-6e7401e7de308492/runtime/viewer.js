/* global Option */
import { EvidenceLoader } from './loader.js';
import { adopted, central, freeze, validateEvidence, stableJSON } from './contracts.js';
import { compilePacket, DISCLOSURES } from './policy.js';
import { C } from './physics.js';
const label = {
    radius: 'Radius',
    mass: 'True mass',
    minimumMass: 'Minimum mass M sin(i)',
    hostTemperature: 'Host effective temperature',
    equilibriumTemperature: 'Equilibrium temperature',
    surfaceTemperature: 'Surface temperature',
    gravity: 'Reference gravity',
    density: 'Bulk density',
    orbitalPeriod: 'Orbital period',
    semiMajorAxis: 'Semi-major axis',
    distance: 'System distance',
    hostRadius: 'Host radius',
    hostMass: 'Host mass',
    hostLuminosity: 'Host luminosity',
    eccentricity: 'Eccentricity',
    transitDepth: 'Transit depth',
    radiusRatio: 'Radius ratio',
    pressure: 'Atmospheric pressure',
};
const displayUnits = {
    radius: [C.earthRadius, 'R⊕'],
    mass: [C.earthMass, 'M⊕'],
    minimumMass: [C.earthMass, 'M⊕'],
    hostRadius: [C.sunRadius, 'R☉'],
    hostMass: [C.sunMass, 'M☉'],
    hostLuminosity: [C.sunLuminosity, 'L☉'],
    distance: [9.4607304725808e15, 'ly'],
    semiMajorAxis: [C.au, 'AU'],
    orbitalPeriod: [C.day, 'days'],
    density: [1000, 'g/cm³'],
};
export function formatQuantity(q) {
    if (q?.state !== 'known') return 'Unknown';
    const c = q.constraint,
        [factor, unit] = displayUnits[q.key] || [1, q.unit],
        n = (v) => Number(v / factor).toLocaleString('en', { maximumSignificantDigits: 5 });
    if (c.kind === 'interval') return `${n(c.lower)}–${n(c.upper)} ${unit}`;
    if (c.kind === 'distribution') return `Distribution (${unit})`;
    const v = `${c.kind === 'upper_limit' ? '< ' : c.kind === 'lower_limit' ? '> ' : ''}${n(c.value)} ${unit}`;
    return v;
}
function el(tag, text, className) {
    const e = document.createElement(tag);
    if (text !== undefined) e.textContent = text;
    if (className) e.className = className;
    return e;
}
function link(title, url) {
    const a = el('a', title);
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
}
function spectrumChart(observation) {
    const ns = 'http://www.w3.org/2000/svg',
        svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 640 340');
    svg.setAttribute('role', 'img');
    svg.setAttribute(
        'aria-label',
        `${observation.instrument} published transmission-depth estimates with reported error bars. Wavelength in micrometres, transit depth in percent.`
    );
    svg.style.width = '100%';
    const points = observation.bands.filter((b) => b.constraint.kind === 'estimate'),
        lo = Math.min(...points.map((b) => b.lower)),
        hi = Math.max(...points.map((b) => b.upper)),
        minY = Math.min(
            ...points.map((b) => (b.constraint.value - (b.constraint.errorMinus || 0)) * 100)
        ),
        maxY = Math.max(
            ...points.map((b) => (b.constraint.value + (b.constraint.errorPlus || 0)) * 100)
        );
    const X = (v) => 58 + ((v - lo) / (hi - lo)) * 560,
        Y = (v) => 286 - ((v - minY) / (maxY - minY)) * 246;
    const add = (tag, attrs, text) => {
        const n = document.createElementNS(ns, tag);
        for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
        if (text !== undefined) n.textContent = text;
        svg.append(n);
    };
    add('rect', { x: 0, y: 0, width: 640, height: 340, rx: 8, fill: '#07131e' });
    for (let i = 0; i <= 4; i++) {
        const y = minY + ((maxY - minY) * i) / 4,
            x = lo + ((hi - lo) * i) / 4;
        add('line', { x1: 58, x2: 618, y1: Y(y), y2: Y(y), stroke: '#263f51', 'stroke-width': 1 });
        add(
            'text',
            { x: 48, y: Y(y) + 4, fill: '#bfced9', 'font-size': 13, 'text-anchor': 'end' },
            y.toFixed(2)
        );
        add(
            'text',
            { x: X(x), y: 310, fill: '#bfced9', 'font-size': 13, 'text-anchor': 'middle' },
            x.toFixed(2)
        );
    }
    for (const b of points) {
        const c = b.constraint,
            x = X(b.centre ?? (b.lower + b.upper) / 2),
            y = Y(c.value * 100);
        add('line', {
            x1: x,
            x2: x,
            y1: Y((c.value - (c.errorMinus || 0)) * 100),
            y2: Y((c.value + (c.errorPlus || 0)) * 100),
            stroke: '#90dce2',
            'stroke-width': 1,
            opacity: 0.6,
        });
        add('circle', { cx: x, cy: y, r: 2.1, fill: '#8fe3e6' });
    }
    add('text', { x: 58, y: 22, fill: '#e4f4fc', 'font-size': 14 }, 'Published transit depth (%)');
    add(
        'text',
        { x: 338, y: 334, fill: '#e4f4fc', 'font-size': 14, 'text-anchor': 'middle' },
        'Wavelength (µm)'
    );
    return svg;
}
const selectedFromURL = () => {
    const p = new URLSearchParams(location.search);
    return {
        releaseId: p.get('evidence'),
        solution: p.get('solution'),
        scenario: p.get('scenario'),
        seed: p.get('seed'),
        weatherSeed: p.get('weather'),
        view: p.get('view') || 'human',
        quality: p.get('quality') || 'High',
        time: Number(p.get('time') || 0),
        exposure: Number(p.get('exposure') || 1),
        azimuth: Number(p.get('az') || 0.4),
        elevation: Number(p.get('el') || 0.2),
        range: Number(p.get('range') || 4),
        systemContext: p.get('frame') === 'system',
        ...(p.has('temperatureK') ? { assumedTemperature: Number(p.get('temperatureK')) } : {}),
        ...(p.has('pressurePa') ? { assumedPressure: Number(p.get('pressurePa')) } : {}),
        ...(p.has('gravityMps2') ? { assumedGravity: Number(p.get('gravityMps2')) } : {}),
    };
};
export class ReconstructionViewer {
    constructor() {
        this.loader = new EvidenceLoader();
        this.isOpen = false;
        this.renderer = null;
        this.loadSerial = 0;
        this.scenarioSerial = 0;
        this.viewSettings = {
            azimuth: 0.4,
            elevation: 0.2,
            range: 4,
            exposure: 1,
            time: 0,
            paused: true,
            quality: 'High',
            view: 'human',
        };
    }
    showPlanet(data) {
        this.planetData = data;
        const id = data.kepoi_name || data.record_id || data.id;
        this.returnFocusElement = document.activeElement;
        this.createModal();
        this.ready = this.loadObject(id);
        return this.ready;
    }
    createModal() {
        if (this.isOpen) return;
        const stylesheet = document.createElement('link');
        stylesheet.rel = 'stylesheet';
        stylesheet.href = new URL('./viewer.css', import.meta.url).href;
        if (!document.querySelector('link[data-exoplanet-engine]')) {
            stylesheet.dataset.exoplanetEngine = '1';
            document.head.append(stylesheet);
        }
        this.modal = el('div');
        this.modal.id = 'planet-3d-modal';
        this.modal.className = 'engine-modal';
        this.modal.setAttribute('role', 'dialog');
        this.modal.setAttribute('aria-modal', 'true');
        this.modal.setAttribute('aria-labelledby', 'planet-3d-title');
        this.modal.tabIndex = -1;
        this.modal.innerHTML = `<header class="engine-header"><div><p class="engine-eyebrow">I.T.A / Exoplanet reconstruction</p><div class="engine-heading-line"><h2 id="planet-3d-title">Loading object</h2><span class="engine-status" data-status="unverified">Checking evidence</span></div></div><div class="engine-header-actions"><button type="button" id="engine-capture" title="Save a labelled scene image and metadata">Capture<span class="engine-export-label"> scene</span></button><button type="button" id="engine-fullscreen">Fullscreen</button><button type="button" id="close-3d-btn" class="engine-close" aria-label="Close 3D planet viewer">×</button></div></header>
   <div class="engine-disclosure" role="status" aria-live="polite"><strong id="engine-mode">Checking the evidence</strong><span id="engine-disclosure-text">Identity and sources are loading. No reconstruction is being asserted.</span></div>
   <div class="engine-layout"><div class="engine-stage" aria-label="Planet inspection"><div class="engine-viewport" id="canvas-container" tabindex="0" role="img" aria-label="Schematic planet inspection. Use arrow keys to rotate, plus and minus to zoom."><canvas id="engine-schematic"></canvas><div class="engine-corner"><strong id="engine-scene-title">Evidence-first view</strong><span id="engine-light-label">Schematic inspection lighting</span></div><div class="engine-context" id="engine-context"></div><p class="engine-viewport-notice" id="engine-scene-notice"></p><div class="engine-scale" id="engine-scale">Not to scale</div><div class="engine-footer-label" id="engine-footer-label">Schematic</div></div>
   <div class="engine-controls"><button type="button" id="reset-view-btn">Reset view</button><button type="button" id="engine-pause" aria-pressed="true">Paused</button><label>Quality <select id="engine-quality"><option>Low</option><option>Medium</option><option selected>High</option><option>Ultra</option><option>Scientific Workstation</option></select></label><label>View <select id="engine-view"><option value="human">Human Vision</option><option value="observations">Astronomical Observations</option><option value="infrared">Infrared</option><option value="thermal">Thermal</option><option value="composition">Spectral Composition</option><option value="atmosphere">Atmosphere</option><option value="temperature">Temperature</option><option value="uncertainty">Confidence / Uncertainty</option></select></label></div>
   <nav class="engine-journey" aria-label="Camera journey">${[
       ['system', 'System context'],
       ['approach', 'Approach'],
       ['disc', 'Full disc'],
       ['orbit', 'Orbit'],
       ['low-orbit', 'Low orbit'],
       ['atmosphere', 'Atmosphere'],
       ['region', 'Region'],
       ['surface', 'Near surface'],
   ]
       .map(
           ([id, name]) =>
               `<button type="button" data-journey="${id}" ${id === 'disc' ? 'aria-pressed="true"' : 'aria-pressed="false"'}>${name}</button>`
       )
       .join('')}</nav></div>
   <aside class="engine-sidebar" aria-label="Scientific evidence and appearance"><div class="engine-tabs" role="tablist" aria-label="Science panels">${['Evidence', 'Appearance', 'Observations', 'Diagnostics'].map((name, i) => `<button type="button" role="tab" id="engine-tab-${name.toLowerCase()}" aria-controls="engine-panel-${name.toLowerCase()}" aria-selected="${i === 0}" tabindex="${i === 0 ? '0' : '-1'}" data-panel="${name.toLowerCase()}">${name}</button>`).join('')}</div>${['evidence', 'appearance', 'observations', 'diagnostics'].map((name, i) => `<div class="engine-panel" role="tabpanel" id="engine-panel-${name}" aria-labelledby="engine-tab-${name}" ${i ? 'hidden' : ''}></div>`).join('')}</aside></div>`;
        document.body.append(this.modal);
        this.previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        this.isOpen = true;
        this.$('#close-3d-btn').onclick = () => this.close();
        this.$('#reset-view-btn').onclick = () => this.reset();
        this.$('#engine-fullscreen').onclick = () => this.fullscreen();
        this.$('#engine-capture').onclick = () => this.capture();
        this.$('#engine-pause').onclick = () => {
            this.viewSettings.paused = !this.viewSettings.paused;
            this.syncControls();
            this.renderer?.setPaused(this.viewSettings.paused);
        };
        this.$('#engine-quality').onchange = (event) => {
            this.viewSettings.quality = event.target.value;
            this.renderer?.setQuality(event.target.value);
            this.renderDiagnostics();
        };
        this.$('#engine-view').onchange = (event) => {
            this.viewSettings.view = event.target.value;
            this.applyView();
        };
        for (const button of this.modal.querySelectorAll('[data-panel]'))
            button.onclick = () => this.showPanel(button.dataset.panel);
        for (const button of this.modal.querySelectorAll('[data-journey]'))
            button.onclick = () => this.journey(button.dataset.journey);
        this.keyHandler = (event) => this.onKey(event);
        this.modal.addEventListener('keydown', this.keyHandler);
        const viewport = this.$('.engine-viewport');
        let dragging = null;
        viewport.addEventListener('pointerdown', (event) => {
            if (event.target !== this.$('#engine-schematic')) return;
            dragging = [event.clientX, event.clientY];
            viewport.setPointerCapture(event.pointerId);
        });
        viewport.addEventListener('pointermove', (event) => {
            if (!dragging) return;
            this.viewSettings.azimuth += (event.clientX - dragging[0]) * 0.005;
            this.viewSettings.elevation = Math.max(
                -1.5,
                Math.min(1.5, this.viewSettings.elevation + (event.clientY - dragging[1]) * 0.005)
            );
            dragging = [event.clientX, event.clientY];
            this.drawSchematic();
        });
        viewport.addEventListener('pointerup', () => {
            dragging = null;
        });
        viewport.addEventListener('pointercancel', () => {
            dragging = null;
        });
        viewport.addEventListener(
            'wheel',
            (event) => {
                if (this.renderer) return;
                event.preventDefault();
                this.viewSettings.range = Math.max(
                    2.3,
                    Math.min(7, this.viewSettings.range * Math.exp(event.deltaY * 0.001))
                );
                this.drawSchematic();
            },
            { passive: false }
        );
        this.resizeObserver = new ResizeObserver(() => {
            this.drawSchematic();
            this.renderer?.resize();
        });
        this.resizeObserver.observe(viewport);
        this.visibilityHandler = () => this.renderer?.setSuspended(document.hidden);
        document.addEventListener('visibilitychange', this.visibilityHandler);
        this.drawSchematic();
        this.$('#close-3d-btn').focus({ preventScroll: true });
    }
    $(selector) {
        return this.modal?.querySelector(selector);
    }
    async loadObject(id, { releaseId = null, allowCompatibleFallback = false } = {}) {
        const serial = ++this.loadSerial;
        this.scenarioSerial++;
        this.renderer?.dispose();
        this.renderer = null;
        this.context = null;
        this.recipe = null;
        this.pendingId = id;
        this.$('#planet-3d-title').textContent = id || 'Unknown entry';
        this.$('.engine-status').textContent = 'Checking evidence';
        this.$('.engine-status').dataset.status = 'unverified';
        this.$('#engine-scale').textContent = 'No verified scale loaded';
        this.$('#engine-schematic').hidden = false;
        this.$('#engine-mode').textContent = 'Checking the evidence';
        this.$('#engine-scene-title').textContent = id || 'Unknown entry';
        this.$('#engine-panel-evidence').replaceChildren(
            el('p', 'Loading a compatible evidence release…', 'engine-busy')
        );
        try {
            const saved =
                new URLSearchParams(location.search).get('engine') === id ? selectedFromURL() : {};
            const context = await this.loader.load(id, {
                releaseId: releaseId || saved.releaseId,
                allowCompatibleFallback,
                onProgress: (message) => {
                    if (this.isOpen && serial === this.loadSerial)
                        this.$('#engine-disclosure-text').textContent = message;
                },
            });
            if (!this.isOpen || serial !== this.loadSerial) return;
            this.context = context;
            this.primaryContext = context;
            this.viewSettings = {
                ...this.viewSettings,
                ...Object.fromEntries(
                    Object.entries(saved).filter(
                        ([k, v]) =>
                            v !== null &&
                            [
                                'quality',
                                'view',
                                'time',
                                'exposure',
                                'azimuth',
                                'elevation',
                                'range',
                                'systemContext',
                            ].includes(k)
                    )
                ),
            };
            if (saved.solution && saved.solution !== context.evidence.adoptedParameterSetId)
                this.context = await this.loader.loadAlternative(saved.solution);
            this.$('#engine-view').value = this.viewSettings.view;
            this.$('#engine-quality').value = this.viewSettings.quality;
            this.renderEvidence();
            this.renderAppearance();
            this.renderObservations();
            this.updateDecision();
            this.renderDiagnostics();
            this.drawSchematic();
            this.syncControls();
            if (saved.scenario && saved.scenario !== 'schematic') {
                this.pendingSavedScenario = saved;
                await this.selectScenario(saved.scenario, saved);
            }
        } catch (error) {
            if (!this.isOpen || serial !== this.loadSerial) return;
            this.$('#engine-mode').textContent = 'Evidence unavailable';
            this.$('#engine-disclosure-text').textContent =
                'The current sources could not be loaded or verified. This is a loading/integrity state, not a statement that no measurements exist.';
            const panel = this.$('#engine-panel-evidence');
            panel.replaceChildren(
                el('h3', 'The evidence could not be verified'),
                el('p', error.message, 'engine-error')
            );
            const retry = el('button', 'Retry evidence');
            retry.onclick = () => {
                this.ready = this.loadObject(id, { releaseId });
            };
            panel.append(retry);
            this.$('#engine-scene-notice').textContent =
                'No source-backed reconstruction is available in this state.';
        }
    }
    updateDecision() {
        if (!this.context) return;
        const { evidence: e, packet: p } = this.context,
            d = p.decision;
        this.$('#planet-3d-title').textContent = e.object.canonicalName;
        this.$('#engine-scene-title').textContent = e.object.canonicalName;
        const status = this.$('.engine-status');
        status.textContent = e.object.existence.status.replace('_', ' ');
        status.dataset.status = e.object.existence.status;
        this.$('#engine-mode').textContent =
            d.mode === 'identity_placeholder'
                ? 'Appearance unknown — schematic placeholder'
                : d.mode === 'speculative_sandbox'
                  ? 'Speculative example'
                  : d.mode === 'observation_constrained'
                    ? 'Observation-constrained reconstruction'
                    : 'Partially constrained view';
        this.$('#engine-disclosure-text').textContent = d.requiredDisclosures.join(' ');
        this.$('#engine-light-label').textContent =
            this.recipe?.illumination.label || 'Schematic inspection lighting';
        this.$('#engine-scene-notice').textContent = this.recipe
            ? ''
            : d.mode === 'identity_placeholder'
              ? 'The current reviewed evidence does not constrain this object’s appearance.'
              : 'The supported size is retained. Choose a conditional scenario to inspect assumptions about its environment.';
        this.$('#engine-scale').textContent =
            p.physicalRadiusMetres === null
                ? 'Not to scale'
                : `${formatQuantity(adopted(e, 'radius'))} · ${adopted(e, 'radius').epistemicKind} radius`;
        this.$('#engine-footer-label').textContent = this.recipe
            ? d.mode === 'speculative_sandbox'
                ? 'Speculative example'
                : 'Procedural spatial detail'
            : 'Schematic shape / material';
        this.$('#engine-context').textContent = e.object.hostLabel || 'Host association unknown';
        this.$('.engine-viewport').setAttribute(
            'aria-label',
            `${e.object.canonicalName}; ${e.object.existence.status}; ${d.requiredDisclosures.join(' ')} Use arrow keys to inspect, plus and minus to zoom.`
        );
        for (const b of this.modal.querySelectorAll('[data-journey]')) {
            const physical = ['low-orbit', 'atmosphere', 'region', 'surface'].includes(
                b.dataset.journey
            );
            b.disabled =
                physical &&
                (!this.recipe ||
                    (b.dataset.journey === 'atmosphere'
                        ? this.recipe.atmosphere.pressurePa === 0
                        : ['region', 'surface'].includes(b.dataset.journey) &&
                          !this.recipe.solidSurface));
            b.title = b.disabled
                ? 'This navigation requires an applicable physical scenario. Gas-dominated scenarios have no solid landing surface.'
                : '';
        }
    }
    renderEvidence() {
        const { evidence: e, stale } = this.context,
            panel = this.$('#engine-panel-evidence');
        panel.replaceChildren();
        const summary = el('div', undefined, 'engine-summary');
        summary.append(
            el('p', 'Current evidence', 'engine-eyebrow'),
            el('h3', e.object.canonicalName),
            el('p', e.object.existence.rationale, 'engine-muted')
        );
        if (e.object.aliases.length)
            summary.append(
                el('p', `Also catalogued as ${e.object.aliases.join(', ')}`, 'engine-muted')
            );
        summary.append(
            el(
                'p',
                `Last reviewed ${new Date(e.coverage?.lastReviewedAt || e.object.existence.reviewedAt).toLocaleDateString('en-GB')}`,
                'engine-muted'
            )
        );
        panel.append(summary);
        if (stale)
            panel.append(
                el(
                    'p',
                    'A compatible cached release is shown. The network refresh failed.',
                    'engine-note warning'
                )
            );
        if (new URLSearchParams(location.search).has('evidence'))
            panel.append(
                el(
                    'p',
                    `This shared view pins evidence release ${e.releaseId}. It may differ from newer reviews.`,
                    'engine-note'
                )
            );
        if (
            e.previousWebsiteStatus &&
            e.previousWebsiteStatus.toLowerCase().replace(' planet', '').replace(' ', '_') !==
                e.object.existence.status
        )
            panel.append(
                el(
                    'p',
                    `Status changed since the earlier website snapshot (${e.previousWebsiteStatus}). The reviewed archive now reports ${e.object.existence.status.replace('_', ' ')}.`,
                    'engine-note warning'
                )
            );
        const grid = el('dl', undefined, 'engine-evidence-grid');
        for (const key of [
            'radius',
            'mass',
            'minimumMass',
            'equilibriumTemperature',
            'hostTemperature',
            'gravity',
            'density',
            'orbitalPeriod',
            'distance',
        ]) {
            const q = adopted(e, key);
            if (key === 'minimumMass' && q?.state !== 'known') continue;
            const tile = el('div', undefined, 'engine-quantity');
            tile.append(el('dt', label[key]));
            const dd = el('dd', formatQuantity(q));
            dd.append(
                el('span', q?.state === 'known' ? q.epistemicKind : 'unknown', 'engine-kind')
            );
            tile.append(dd);
            grid.append(tile);
        }
        panel.append(
            grid,
            el(
                'p',
                'Unknown values stay missing. Equilibrium temperature describes a radiative model; surface conditions require additional constraints.',
                'engine-muted'
            )
        );
        panel.append(el('h3', 'Parameter provenance'));
        for (const q of e.quantities) {
            const detail = el('details'),
                summaryQ = el('summary', `${label[q.key] || q.key}: ${formatQuantity(q)}`);
            detail.append(summaryQ, el('p', q.definition));
            if (q.state === 'unknown')
                detail.append(el('p', `Missing reason: ${q.reason.replaceAll('_', ' ')}.`));
            else {
                detail.append(
                    el(
                        'p',
                        `${q.epistemicKind}; ${q.unit}. ${q.method || 'Derived from the linked inputs.'}`
                    )
                );
                if (q.constraint.kind === 'estimate') {
                    const c = q.constraint,
                        [factor, unit] = displayUnits[q.key] || [1, q.unit];
                    detail.append(
                        el(
                            'p',
                            c.errorMinus === null || c.errorPlus === null
                                ? 'Uncertainty is not supplied; this does not imply zero uncertainty.'
                                : `Reported uncertainty −${(c.errorMinus / factor).toPrecision(3)} / +${(c.errorPlus / factor).toPrecision(3)} ${unit}; ${c.uncertainty?.interpretation || 'reported'}.`
                        )
                    );
                }
                if (q.publishedInference)
                    detail.append(el('p', q.publishedInference.assumptions.join(' ')));
                for (const id of q.evidenceClaimIds || []) {
                    const claim = e.claims.find((c) => c.id === id);
                    if (claim)
                        detail.append(
                            el('p', claim.sourceLocator || claim.statement, 'engine-muted')
                        );
                }
                if (q.inputQuantityIds?.length)
                    detail.append(
                        el(
                            'p',
                            `Inputs: ${q.inputQuantityIds.map((id) => label[e.quantities.find((v) => v.id === id)?.key] || id).join(', ')}. Model ${q.modelRunId}.`
                        )
                    );
            }
            panel.append(detail);
        }
        panel.append(el('h3', 'Sources supporting this record'));
        for (const c of e.citations) {
            const card = el('article', undefined, 'engine-source');
            card.append(
                link(c.title, c.url),
                el(
                    'p',
                    [
                        c.publisher,
                        c.authors?.length ? c.authors.join(', ') : null,
                        c.publicationDate,
                    ]
                        .filter(Boolean)
                        .join(' · ')
                )
            );
            const claims = e.claims.filter((cl) => cl.citationIds.includes(c.id));
            card.append(el('p', claims[0]?.statement || 'Reference-specific catalogue evidence.'));
            if (c.doi) card.append(link(`DOI ${c.doi}`, `https://doi.org/${c.doi}`));
            card.append(
                el(
                    'p',
                    `Retrieved ${c.retrievedAt.slice(0, 10)}; last verified ${c.lastVerifiedAt.slice(0, 10)}.`,
                    'engine-metadata'
                )
            );
            panel.append(card);
        }
        if (e.relatedReferences?.length) {
            const details = el('details');
            details.append(el('summary', 'Publications linked by the adopted catalogue solution'));
            for (const r of e.relatedReferences) {
                const p = el('p');
                p.append(link(r.label, r.url));
                details.append(p);
            }
            details.append(
                el(
                    'p',
                    'These reference links are retained from the catalogue; the archive record above supplies the imported parameter values.',
                    'engine-muted'
                )
            );
            panel.append(details);
        }
        panel.append(
            el('p', e.coverage?.scope || 'Evidence coverage is incomplete.', 'engine-muted')
        );
        const report = el('button', 'Download evidence report');
        report.onclick = () => {
            const url = URL.createObjectURL(
                new Blob(
                    [
                        JSON.stringify(
                            {
                                schemaVersion: '1.0.0',
                                evidence: e,
                                packet: this.context.packet,
                                recipe: this.recipe,
                                view: this.renderer?.viewState?.() || this.viewSettings,
                                requiredDisclosures:
                                    this.context.packet.decision.requiredDisclosures,
                            },
                            null,
                            2
                        ),
                    ],
                    { type: 'application/json' }
                )
            );
            this.download(url, `${e.object.id}-scientific-report.json`);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        };
        panel.append(report);
    }
    renderAppearance() {
        const { evidence: e } = this.context,
            panel = this.$('#engine-panel-appearance');
        panel.replaceChildren(
            el('p', 'Why this appearance?', 'engine-eyebrow'),
            el('h3', 'Evidence and assumptions')
        );
        const objects = el('label', undefined, 'engine-field');
        objects.append(el('span', 'Explore a reference world'));
        const select = el('select');
        select.setAttribute('aria-label', 'Reference world');
        const current = el('option', e.object.canonicalName);
        current.value = e.object.id;
        select.append(current);
        for (const o of this.context.manifest.featured || []) {
            if (o.id === e.object.id) continue;
            const option = el('option', `${o.name} · ${o.status}`);
            option.value = o.id;
            select.append(option);
        }
        select.onchange = () => {
            this.ready = this.loadObject(select.value);
        };
        objects.append(select);
        panel.append(objects);
        const field = el('label', undefined, 'engine-field');
        field.append(el('span', 'Physical scenario'));
        const scenarios = el('select');
        scenarios.id = 'engine-scenario';
        scenarios.setAttribute('aria-label', 'Physical scenario');
        scenarios.append(new Option('Evidence-led schematic', 'schematic'));
        scenarios.onchange = () => {
            this.scenarioReady = this.selectScenario(scenarios.value);
        };
        field.append(scenarios);
        panel.append(field, el('div', 'Loading available scenario models…', 'engine-muted'));
        this.populateScenarios(scenarios);
        const evidenceSets = el('label', undefined, 'engine-field');
        evidenceSets.append(el('span', 'Published parameter solution'));
        const sets = el('select');
        sets.setAttribute('aria-label', 'Published parameter solution');
        sets.append(new Option(e.parameterSets[0].label, e.adoptedParameterSetId));
        for (const alt of this.primaryContext.evidence.alternativeIndex || [])
            sets.append(new Option(alt.label, alt.id));
        sets.onchange = async () => {
            try {
                this.context =
                    sets.value === this.primaryContext.evidence.adoptedParameterSetId
                        ? this.primaryContext
                        : await this.loader.loadAlternative(sets.value);
                this.recipe = null;
                this.renderer?.dispose();
                this.renderer = null;
                this.$('#engine-schematic').hidden = false;
                this.renderEvidence();
                this.renderAppearance();
                this.renderObservations();
                this.updateDecision();
                this.drawSchematic();
            } catch (error) {
                panel.append(el('p', error.message, 'engine-error'));
            }
        };
        evidenceSets.append(sets);
        panel.append(evidenceSets);
        panel.append(
            el(
                'p',
                'Solutions remain separate. Choosing a different publication replaces its parameter set; missing values are never filled by mixing fits.',
                'engine-muted'
            )
        );
        const features = el('div');
        features.id = 'engine-features';
        panel.append(features);
        this.renderFeatures();
        const assumptions = el('div');
        assumptions.id = 'engine-assumptions';
        panel.append(assumptions);
        const share = el('div');
        share.append(el('h3', 'Reproduce this view'));
        const input = el('input');
        input.readOnly = true;
        input.className = 'engine-share';
        input.id = 'engine-share-url';
        input.setAttribute('aria-label', 'Shareable evidence and scene URL');
        share.append(input);
        const copy = el('button', 'Copy view link');
        copy.onclick = async () => {
            input.value = this.shareURL();
            try {
                await navigator.clipboard.writeText(input.value);
                copy.textContent = 'Link copied';
            } catch {
                input.select();
                copy.textContent = 'Select and copy the link';
            }
        };
        share.append(copy);
        panel.append(share);
        this.updateShare();
    }
    async populateScenarios(select) {
        try {
            const model = await import('./recipes.js');
            if (!select.isConnected) return;
            this.recipeModule = model;
            for (const s of model.availableScenarios(this.context.evidence))
                select.append(new Option(s.label, s.id));
            select.append(new Option('Enter speculative sandbox…', 'sandbox'));
            if (this.recipe) select.value = this.recipe.sandbox ? 'sandbox' : this.recipe.family;
            select.parentElement.nextElementSibling?.remove();
        } catch {
            if (select.isConnected)
                select.parentElement.nextElementSibling.textContent =
                    'Conditional model implementation is unavailable. Evidence remains accessible.';
        }
    }
    async selectScenario(id, settings = {}) {
        const scenarioSerial = ++this.scenarioSerial;
        let validated = false;
        if (id === 'schematic') {
            this.recipe = null;
            this.renderer?.dispose();
            this.renderer = null;
            this.$('#engine-schematic').hidden = false;
            const packet = await compilePacket(this.context.evidence);
            if (scenarioSerial !== this.scenarioSerial || !this.isOpen) return;
            this.context = { ...this.context, packet };
            this.updateDecision();
            this.renderFeatures();
            this.renderAssumptions();
            this.drawSchematic();
            return;
        }
        try {
            const serial = this.loadSerial,
                models = this.recipeModule || (await import('./recipes.js'));
            this.recipeModule = models;
            const sandbox = id === 'sandbox' || id.startsWith('sandbox:');
            const family = id === 'sandbox' ? 'airless-rocky' : id.replace('sandbox:', '');
            const recipe = await models.makeRecipe(this.context.evidence, {
                family,
                sandbox,
                seed: settings.seed,
                weatherSeed: settings.weatherSeed,
                ...settings,
            });
            if (
                serial !== this.loadSerial ||
                scenarioSerial !== this.scenarioSerial ||
                !this.isOpen
            )
                return;
            this.recipe = recipe;
            this.recipeOverrides = Object.fromEntries(
                ['assumedTemperature', 'assumedPressure', 'assumedGravity']
                    .filter((key) => settings[key] !== undefined)
                    .map((key) => [key, Number(settings[key])])
            );
            validated = true;
            const packet = await compilePacket(this.context.evidence, {
                sandbox,
                recipe: this.recipe,
            });
            if (
                serial !== this.loadSerial ||
                scenarioSerial !== this.scenarioSerial ||
                !this.isOpen
            )
                return;
            this.context = { ...this.context, packet };
            this.updateDecision();
            this.renderFeatures();
            this.renderAssumptions();
            this.$('#engine-scenario').value = sandbox ? 'sandbox' : family;
            this.$('#engine-scene-notice').textContent = 'Preparing this conditional scene…';
            const { PlanetRenderer } = await import('./renderer.js');
            if (
                serial !== this.loadSerial ||
                scenarioSerial !== this.scenarioSerial ||
                !this.isOpen
            )
                return;
            this.renderer?.dispose();
            const renderer = new PlanetRenderer(this.$('.engine-viewport'), {
                onDiagnostics: () => this.renderDiagnostics(),
                onFeature: (feature) => this.inspectFeature(feature),
                onFailure: (error) => {
                    if (scenarioSerial === this.scenarioSerial) this.rendererFailure(error);
                },
            });
            this.renderer = renderer;
            await renderer.start(this.context.packet, this.recipe, this.viewSettings);
            if (
                serial !== this.loadSerial ||
                scenarioSerial !== this.scenarioSerial ||
                !this.isOpen
            ) {
                renderer.dispose();
                return;
            }
            this.$('#engine-schematic').hidden = true;
            this.$('#engine-scene-notice').textContent = '';
            this.renderDiagnostics();
            this.applyView();
            this.updateShare();
        } catch (error) {
            if (scenarioSerial === this.scenarioSerial) {
                if (validated) this.rendererFailure(error);
                else {
                    this.$('#engine-scene-notice').textContent =
                        `Scenario unavailable: ${error.message}. The verified evidence is retained.`;
                    this.$('#engine-scenario').value = this.recipe
                        ? this.recipe.sandbox
                            ? 'sandbox'
                            : this.recipe.family
                        : 'schematic';
                    this.$('#engine-assumptions')?.append(
                        el('p', `Scenario validation: ${error.message}`, 'engine-error')
                    );
                }
            }
        }
    }
    rendererFailure(error) {
        if (!this.isOpen) return;
        this.renderer?.dispose();
        this.renderer = null;
        this.$('#engine-schematic').hidden = false;
        this.$('#engine-scene-notice').textContent =
            `The selected model remains recorded. Graphics unavailable: ${error.message}. A schematic inspection view is shown.`;
        this.drawSchematic();
        this.renderDiagnostics();
        if (this.recipe) {
            const button = el('button', 'Retry with compatibility graphics');
            button.onclick = () => {
                this.viewSettings.backend = 'WebGL2';
                this.scenarioReady = this.selectScenario(
                    (this.recipe.sandbox ? 'sandbox:' : '') + this.recipe.family,
                    { seed: this.recipe.geologicalSeed, weatherSeed: this.recipe.weatherSeed }
                );
            };
            this.$('#engine-panel-diagnostics').append(button);
        }
    }
    renderFeatures() {
        const panel = this.$('#engine-features');
        if (!panel || !this.context) return;
        panel.replaceChildren();
        for (const f of this.context.packet.decision.featureDecisions) {
            const b = el('button', undefined, 'engine-feature');
            b.append(
                el('span', f.feature[0].toUpperCase() + f.feature.slice(1)),
                el('small', f.treatment)
            );
            b.onclick = () => this.inspectFeature(f.feature);
            panel.append(b);
        }
    }
    inspectFeature(feature) {
        this.showPanel('appearance');
        const f = this.context.packet.decision.featureDecisions.find((v) => v.feature === feature);
        if (!f) return;
        this.$('#engine-feature-explanation')?.remove();
        const text = el('p', f.userExplanation, 'engine-tooltip');
        text.id = 'engine-feature-explanation';
        this.$('#engine-features').append(text);
        text.scrollIntoView({ block: 'nearest' });
    }
    renderAssumptions() {
        const panel = this.$('#engine-assumptions');
        if (!panel) return;
        panel.replaceChildren();
        if (!this.recipe) return;
        const recipe = this.recipe;
        panel.append(el('h3', 'Scenario assumptions'));
        for (const a of recipe.assumptions) {
            const row = el('p', undefined, 'engine-assumption');
            row.append(
                el('strong', `${a.label}: `),
                document.createTextNode(`${a.value} ${a.unit || ''}. ${a.reason}`)
            );
            panel.append(row);
        }
        const form = el('form');
        form.append(el('h3', 'Edit this hypothesis'));
        const inputs = {};
        for (const [name, title, value, type] of [
            ['seed', 'Geological seed', recipe.geologicalSeed, 'text'],
            ['weatherSeed', 'Weather seed', recipe.weatherSeed, 'text'],
            [
                'assumedTemperature',
                'Assumed reference temperature (K)',
                recipe.referenceTemperature,
                'number',
            ],
            [
                'assumedPressure',
                'Assumed reference pressure (Pa)',
                recipe.atmosphere.pressurePa,
                'number',
            ],
            ['assumedGravity', 'Assumed gravity (m/s²)', recipe.referenceGravity, 'number'],
        ]) {
            const field = el('label', undefined, 'engine-field');
            field.append(el('span', title));
            const input = el('input');
            input.type = type;
            input.value = value;
            input.setAttribute('aria-label', title);
            input.maxLength = 64;
            if (type === 'number') input.step = 'any';
            if (
                name === 'assumedGravity' &&
                central(adopted(this.context.evidence, 'gravity')) !== null
            ) {
                input.readOnly = true;
                input.title =
                    'This gravity is derived from the selected mass and radius; change the published parameter set to replace it.';
            }
            if (name === 'assumedPressure' && recipe.atmosphere.pressurePa === 0) {
                input.readOnly = true;
                input.title = 'Choose an atmospheric family to add pressure.';
            }
            inputs[name] = input;
            field.append(input);
            form.append(field);
        }
        if (recipe.sandbox) {
            const field = el('label', undefined, 'engine-field');
            field.append(el('span', 'Sandbox material family'));
            const choice = el('select');
            choice.setAttribute('aria-label', 'Sandbox material family');
            for (const f of this.recipeModule.FAMILIES) choice.append(new Option(f.label, f.id));
            choice.value = recipe.family;
            choice.onchange = () => {
                this.scenarioReady = this.selectScenario(`sandbox:${choice.value}`);
            };
            field.append(choice);
            form.append(field);
        }
        const submit = el('button', 'Apply hypothesis');
        submit.type = 'submit';
        form.append(submit);
        form.onsubmit = (event) => {
            event.preventDefault();
            const settings = Object.fromEntries(
                Object.entries(inputs).map(([k, input]) => [
                    k,
                    input.type === 'number' ? Number(input.value) : input.value,
                ])
            );
            this.scenarioReady = this.selectScenario(
                (recipe.sandbox ? 'sandbox:' : '') + recipe.family,
                settings
            );
        };
        panel.append(form);
        const exposure = el('label', undefined, 'engine-field');
        exposure.append(el('span', 'Display exposure (scene-wide)'));
        const slider = el('input');
        slider.type = 'range';
        slider.min = '.1';
        slider.max = '5';
        slider.step = '.05';
        slider.value = this.viewSettings.exposure;
        slider.setAttribute('aria-label', 'Display exposure');
        slider.className = 'engine-range';
        slider.oninput = () => {
            this.viewSettings.exposure = Number(slider.value);
            this.renderer?.setExposure(this.viewSettings.exposure);
            this.updateShare();
        };
        exposure.append(slider);
        panel.append(exposure);
        const compare = el('label', undefined, 'engine-field');
        compare.append(el('span', 'Compare another conditional scenario'));
        const select = el('select');
        select.setAttribute('aria-label', 'Compare scenario');
        for (const f of this.recipeModule.availableScenarios(this.context.evidence))
            select.append(new Option(f.label, f.id));
        compare.append(select);
        const button = el('button', 'Compare assumptions');
        button.onclick = () => this.compareScenarios(select.value);
        panel.append(compare, button, el('p', `Recipe ${recipe.id}`, 'engine-metadata'));
    }
    async compareScenarios(family) {
        try {
            const other = await this.recipeModule.makeRecipe(this.context.evidence, {
                    family,
                    seed: this.recipe.geologicalSeed,
                    weatherSeed: this.recipe.weatherSeed,
                }),
                current = this.recipe,
                panel = this.$('#engine-assumptions');
            this.$('#engine-comparison')?.remove();
            const comparison = el('div');
            comparison.id = 'engine-comparison';
            comparison.append(
                el('h3', 'Conditional scenario comparison'),
                el(
                    'p',
                    'Both scenarios retain the same adopted evidence and parameter solution. No probability ranking is implied.',
                    'engine-muted'
                )
            );
            const table = el('table', undefined, 'engine-observation-table');
            const head = el('tr');
            for (const v of ['Assumption', current.family, other.family]) head.append(el('th', v));
            table.append(head);
            for (const [title, a, b] of [
                [
                    'Reference temperature (K)',
                    current.referenceTemperature,
                    other.referenceTemperature,
                ],
                [
                    'Reference pressure (Pa)',
                    current.atmosphere.pressurePa,
                    other.atmosphere.pressurePa,
                ],
                ['Solid-surface hypothesis', current.solidSurface, other.solidSurface],
                ['Material', current.material, other.material],
                ['Radius (m)', current.referenceRadiusMetres, other.referenceRadiusMetres],
            ]) {
                const row = el('tr');
                for (const v of [title, a, b]) row.append(el('td', String(v)));
                table.append(row);
            }
            comparison.append(table);
            const open = el('button', 'Inspect comparison scenario');
            open.onclick = () => {
                this.scenarioReady = this.selectScenario(other.family, {
                    seed: other.geologicalSeed,
                    weatherSeed: other.weatherSeed,
                });
            };
            comparison.append(open);
            panel.append(comparison);
            comparison.scrollIntoView({ block: 'nearest' });
        } catch (error) {
            this.$('#engine-assumptions').append(el('p', error.message, 'engine-error'));
        }
    }
    renderObservations() {
        const e = this.context.evidence,
            panel = this.$('#engine-panel-observations');
        panel.replaceChildren(
            el('p', 'Observations and scientific views', 'engine-eyebrow'),
            el('h3', 'What has been observed')
        );
        if (!e.observations?.length && !e.spectralProducts?.length)
            panel.append(
                el(
                    'p',
                    'No spectral sample array or visible image is included for this object in this release. Catalogue constraints remain available in Evidence.',
                    'engine-note'
                )
            );
        for (const o of e.observations || []) {
            panel.append(
                el('h3', `${o.instrument}: ${o.observable.replaceAll('_', ' ')}`),
                el('p', o.geometry, 'engine-muted')
            );
            if (o.kind === 'transmission') {
                panel.append(
                    spectrumChart(o),
                    el(
                        'p',
                        `${o.bands.length} published bins. Vertical bars preserve reported errors; covariance is not supplied. These data are separate from the hypothetical planet image.`,
                        'engine-muted'
                    )
                );
            }
            const table = el('table', undefined, 'engine-observation-table');
            table.innerHTML = '<thead><tr><th>Band</th><th>Published constraint</th></tr></thead>';
            const body = el('tbody');
            for (const b of o.bands.slice(0, 12)) {
                const tr = el('tr');
                tr.append(
                    el(
                        'td',
                        `${Number(b.lower).toPrecision(4)}–${Number(b.upper).toPrecision(4)} ${o.wavelengthUnit}`
                    ),
                    el(
                        'td',
                        b.constraint.kind === 'upper_limit'
                            ? `< ${b.constraint.value} (reported 1σ)`
                            : `${b.constraint.value.toPrecision(5)} ± ${b.constraint.errorPlus?.toPrecision(3) || 'not stated'}`
                    )
                );
                body.append(tr);
            }
            table.append(body);
            panel.append(table, el('p', o.limitations, 'engine-note'));
            if (o.bands.length > 12)
                panel.append(
                    el(
                        'p',
                        'The full sample array is included in Download evidence report.',
                        'engine-muted'
                    )
                );
            if (o.sourceURL) panel.append(link('Pinned publication data and methods', o.sourceURL));
            if (o.publishedComparison) {
                const c = o.publishedComparison.comparison;
                panel.append(
                    el(
                        'p',
                        `Published-model comparison: normalized residual RMS ${c.normalizedResidualRMS.toFixed(3)} across ${c.samples} bins. ${c.method}`,
                        'engine-note'
                    )
                );
            }
        }
        if (e.chemicalClaims?.length) {
            panel.append(el('h3', 'Reported composition'));
            for (const c of e.chemicalClaims) {
                const claim = e.claims.find((cl) => cl.id === c.claimId);
                panel.append(
                    el(
                        'p',
                        `${c.species}: ${c.status.replaceAll('_', ' ')}; abundance ${c.abundance === null ? 'not imported' : c.abundance}.`,
                        'engine-assumption'
                    )
                );
                if (claim) panel.append(el('p', claim.statement, 'engine-muted'));
            }
        }
        if (e.spectralProducts?.length) {
            panel.append(el('h3', 'Archive spectroscopy metadata'));
            for (const s of e.spectralProducts.slice(0, 20)) {
                const detail = el('details');
                detail.append(
                    el('summary', `${s.facility} / ${s.instrument} · ${s.observable}`),
                    el(
                        'p',
                        `Wavelengths ${s.wavelengthRange.join('–')} ${s.wavelengthUnit}; ${s.numberOfSamples} samples in the source product.`
                    ),
                    el('p', s.status)
                );
                detail.append(link('Specific archive spectroscopy record', s.sourceURL));
                panel.append(detail);
            }
            if (e.spectralProducts.length > 20)
                panel.append(
                    el(
                        'p',
                        `${e.spectralProducts.length} metadata records are retained in the downloadable evidence release.`,
                        'engine-muted'
                    )
                );
        }
        panel.append(
            el('h3', 'Viewing definitions'),
            el(
                'p',
                'Human Vision uses declared illumination, reflectance assumptions and display settings. Infrared and thermal outputs are labelled simulated and require a stated band or temperature model. Chemical detections do not provide a geographic detection map.',
                'engine-muted'
            )
        );
    }
    applyView() {
        const view = this.viewSettings.view;
        this.renderer?.setView(view);
        if (['observations', 'composition'].includes(view)) {
            this.showPanel('observations');
            this.$('#engine-scene-notice').textContent =
                'Published observations and qualified chemical claims are shown in the evidence panel.';
        } else if (view === 'uncertainty') {
            this.$('#engine-scene-notice').textContent =
                'Spatial structure is unconstrained throughout this view. Inspect individual features and parameters for their evidence.';
            this.showPanel('appearance');
        } else if (
            ['infrared', 'thermal', 'temperature', 'atmosphere'].includes(view) &&
            !this.recipe
        ) {
            this.$('#engine-scene-notice').textContent =
                `${view[0].toUpperCase() + view.slice(1)} view unavailable: no applicable environmental model is selected.`;
            this.showPanel('observations');
        } else if (view === 'atmosphere') this.showAtmosphere();
        else if (['infrared', 'thermal', 'temperature'].includes(view)) {
            const t = this.recipe.referenceTemperature;
            const description =
                view === 'infrared'
                    ? `Simulated 8–14 µm blackbody radiance: ${this.renderer?.thermalRadiance?.toFixed(2) || '…'} W m⁻² sr⁻¹.`
                    : view === 'thermal'
                      ? `Simulated blackbody surface flux: ${(C.sigma * t ** 4).toFixed(1)} W m⁻²; assumed emissivity 1.`
                      : `Model reference temperature: ${t.toFixed(1)} K.`;
            this.$('#engine-scene-notice').textContent =
                `${description} Uniform scenario field; false-colour analytical view. No spatial temperature map has been measured.`;
            this.$('#engine-footer-label').textContent = 'Simulated / false colour';
        } else {
            this.$('#engine-scene-notice').textContent = '';
            this.$('#engine-footer-label').textContent = this.recipe
                ? 'Procedural spatial detail'
                : 'Schematic shape / material';
        }
        this.updateShare();
    }
    showAtmosphere() {
        this.showPanel('observations');
        const panel = this.$('#engine-panel-observations');
        this.$('#engine-atmosphere-profile')?.remove();
        const section = el('section');
        section.id = 'engine-atmosphere-profile';
        section.append(el('h3', 'Conditional atmosphere profile'));
        if (!this.recipe.atmosphere.pressurePa) {
            section.append(
                el(
                    'p',
                    'This selected scenario is airless. No atmospheric glow, cloud deck or pressure profile is generated.',
                    'engine-note'
                )
            );
        } else {
            const a = this.recipe.atmosphere,
                h = a.profile.height;
            section.append(
                el(
                    'p',
                    `Assumed reference pressure ${a.pressurePa.toLocaleString()} Pa; isothermal ${this.recipe.referenceTemperature.toFixed(1)} K; scale height ${(h / 1000).toFixed(2)} km. Reference radius and optical parameters are scenario-dependent.`,
                    'engine-note'
                )
            );
            const table = el('table', undefined, 'engine-observation-table');
            table.innerHTML =
                '<thead><tr><th>Height above reference</th><th>Model pressure</th></tr></thead>';
            for (const n of [0, 1, 2, 4, 8, 12]) {
                const row = el('tr');
                row.append(
                    el('td', `${((n * h) / 1000).toFixed(2)} km`),
                    el(
                        'td',
                        `${(a.pressurePa * Math.exp(-(this.recipe.referenceRadiusMetres / h) * (1 - this.recipe.referenceRadiusMetres / (this.recipe.referenceRadiusMetres + n * h)))).toPrecision(4)} Pa`
                    )
                );
                table.append(row);
            }
            section.append(
                table,
                el('p', `${a.multipleScattering}. ${a.absorption}`, 'engine-muted')
            );
        }
        panel.prepend(section);
        this.$('#engine-scene-notice').textContent =
            'Atmosphere inspection: the profile is a conditional model with the assumptions shown alongside the scene.';
    }
    renderDiagnostics() {
        const panel = this.$('#engine-panel-diagnostics');
        if (!panel) return;
        const d = this.renderer?.diagnostics?.() || {
            backend: 'accessible schematic',
            gpuAllocations: 0,
            terrainRequests: 0,
        };
        panel.replaceChildren(
            el('p', 'Reproducibility and performance', 'engine-eyebrow'),
            el('h3', 'Scene diagnostics'),
            el(
                'pre',
                JSON.stringify(
                    {
                        ...d,
                        evidenceRelease: this.context?.releaseId,
                        recipe: this.recipe?.id || null,
                        view: this.viewSettings,
                        scientificMode: this.context?.packet?.decision.mode,
                    },
                    null,
                    2
                ),
                'engine-diagnostics'
            )
        );
    }
    showPanel(name) {
        for (const tab of this.modal.querySelectorAll('[data-panel]')) {
            const active = tab.dataset.panel === name;
            tab.setAttribute('aria-selected', String(active));
            tab.tabIndex = active ? 0 : -1;
            this.$(`#engine-panel-${tab.dataset.panel}`).hidden = !active;
        }
    }
    syncControls() {
        const b = this.$('#engine-pause');
        b.textContent = this.viewSettings.paused ? 'Paused' : 'Pause';
        b.setAttribute('aria-pressed', String(this.viewSettings.paused));
    }
    reset() {
        Object.assign(this.viewSettings, { azimuth: 0.4, elevation: 0.2, range: 4 });
        this.renderer?.reset();
        this.drawSchematic();
        this.updateShare();
    }
    journey(stage) {
        if (this.renderer) this.renderer.journey(stage);
        else {
            this.viewSettings.range = { system: 7, approach: 5, disc: 4, orbit: 3 }[stage] || 4;
            this.drawSchematic();
        }
        if (stage === 'system') {
            const e = this.context?.evidence;
            this.$('#engine-scene-notice').textContent = this.renderer?.systemMode
                ? `System context at the adopted semi-major-axis reference separation (${formatQuantity(adopted(e, 'semiMajorAxis'))}). Relative sizes and distance share a physical scale; orientation and phase are schematic.`
                : `System context: ${e?.object.hostLabel || 'association unknown'}. A scaled system model is unavailable in the current evidence; no orbital track is invented.`;
        } else this.$('#engine-scene-notice').textContent = '';
        for (const b of this.modal.querySelectorAll('[data-journey]'))
            b.setAttribute('aria-pressed', String(b.dataset.journey === stage));
        this.updateShare();
    }
    onKey(event) {
        if (event.key === 'Escape') {
            if (document.fullscreenElement) return;
            event.preventDefault();
            this.close();
            return;
        }
        if (event.key === 'Tab') {
            const items = [
                ...this.modal.querySelectorAll(
                    'button:not(:disabled),a[href],select,input,[tabindex="0"]'
                ),
            ].filter((e) => !e.closest('[hidden]') && e.getClientRects().length);
            const index = items.indexOf(document.activeElement);
            if (event.shiftKey && index <= 0) {
                event.preventDefault();
                items.at(-1)?.focus();
            } else if (!event.shiftKey && index === items.length - 1) {
                event.preventDefault();
                items[0]?.focus();
            }
        }
        if (
            event.target.getAttribute('role') === 'tab' &&
            ['ArrowLeft', 'ArrowRight'].includes(event.key)
        ) {
            event.preventDefault();
            const tabs = [...this.modal.querySelectorAll('[role=tab]')],
                i = tabs.indexOf(event.target),
                next =
                    tabs[(i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
            this.showPanel(next.dataset.panel);
            next.focus();
        }
        if (event.target !== this.$('.engine-viewport')) return;
        if (
            ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-', '='].includes(event.key)
        ) {
            event.preventDefault();
            this.renderer?.keyboard(event.key);
            if (!this.renderer) {
                if (event.key === 'ArrowLeft') this.viewSettings.azimuth -= 0.1;
                if (event.key === 'ArrowRight') this.viewSettings.azimuth += 0.1;
                if (event.key === 'ArrowUp') this.viewSettings.elevation -= 0.1;
                if (event.key === 'ArrowDown') this.viewSettings.elevation += 0.1;
                if (['+', '='].includes(event.key))
                    this.viewSettings.range = Math.max(2.3, this.viewSettings.range - 0.2);
                if (event.key === '-')
                    this.viewSettings.range = Math.min(7, this.viewSettings.range + 0.2);
                this.drawSchematic();
            }
        }
    }
    drawSchematic() {
        if (!this.isOpen) return;
        const canvas = this.$('#engine-schematic');
        if (!canvas || canvas.hidden) return;
        const box = this.$('.engine-viewport').getBoundingClientRect(),
            dpr = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.max(1, Math.floor(box.width * dpr));
        canvas.height = Math.max(1, Math.floor(box.height * dpr));
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const w = canvas.width,
            h = canvas.height,
            cx = w * 0.5,
            cy = h * 0.49,
            r = (Math.min(w, h) * 0.29 * 4) / this.viewSettings.range;
        ctx.clearRect(0, 0, w, h);
        const halo = ctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 1.6);
        halo.addColorStop(0, 'rgba(80,144,174,.08)');
        halo.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#7995a8';
        ctx.lineWidth = 1.2 * dpr;
        ctx.setLineDash([3 * dpr, 5 * dpr]);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.setLineDash([]);
        const az = this.viewSettings.azimuth,
            elv = this.viewSettings.elevation,
            project = (x, y, z) => {
                const xx = x * Math.cos(az) + z * Math.sin(az),
                    zz = z * Math.cos(az) - x * Math.sin(az);
                return [
                    cx + r * xx,
                    cy + r * (y * Math.cos(elv) - zz * Math.sin(elv)),
                    zz * Math.cos(elv) + y * Math.sin(elv),
                ];
            };
        const curve = (points) => {
            for (let i = 1; i < points.length; i++) {
                const a = points[i - 1],
                    b = points[i];
                ctx.strokeStyle = b[2] > 0 ? 'rgba(137,215,224,.48)' : 'rgba(103,149,171,.16)';
                ctx.lineWidth = 0.7 * dpr;
                ctx.beginPath();
                ctx.moveTo(a[0], a[1]);
                ctx.lineTo(b[0], b[1]);
                ctx.stroke();
            }
        };
        for (let lat = -Math.PI / 3; lat < Math.PI / 2; lat += Math.PI / 6)
            curve(
                Array.from({ length: 97 }, (_, i) => {
                    const t = (i / 96) * Math.PI * 2;
                    return project(
                        Math.cos(lat) * Math.cos(t),
                        Math.sin(lat),
                        Math.cos(lat) * Math.sin(t)
                    );
                })
            );
        for (let lon = 0; lon < Math.PI * 2; lon += Math.PI / 6)
            curve(
                Array.from({ length: 65 }, (_, i) => {
                    const t = -Math.PI / 2 + (i / 64) * Math.PI;
                    return project(
                        Math.cos(t) * Math.cos(lon),
                        Math.sin(t),
                        Math.cos(t) * Math.sin(lon)
                    );
                })
            );
        ctx.fillStyle = '#91b9c9';
        ctx.font = `${10 * dpr}px ui-monospace,monospace`;
        ctx.textAlign = 'center';
        ctx.fillText('SCHEMATIC INSPECTION', cx, cy + r + 30 * dpr);
    }
    async fullscreen() {
        try {
            if (document.fullscreenElement === this.modal) await document.exitFullscreen();
            else await this.modal.requestFullscreen();
        } catch {
            this.$('#engine-disclosure-text').textContent +=
                ' Fullscreen is unavailable or was declined; scene and evidence remain usable.';
        }
    }
    shareURL() {
        const u = new URL(location.href);
        u.searchParams.set('engine', this.context?.evidence.object.id || this.pendingId);
        if (this.context) {
            u.searchParams.set('evidence', this.context.releaseId);
            u.searchParams.set('solution', this.context.evidence.adoptedParameterSetId);
        }
        u.searchParams.set(
            'scenario',
            this.recipe ? (this.recipe.sandbox ? 'sandbox:' : '') + this.recipe.family : 'schematic'
        );
        if (this.recipe) {
            u.searchParams.set('seed', this.recipe.geologicalSeed);
            u.searchParams.set('weather', this.recipe.weatherSeed);
        }
        for (const [parameter, key] of [
            ['temperatureK', 'assumedTemperature'],
            ['pressurePa', 'assumedPressure'],
            ['gravityMps2', 'assumedGravity'],
        ]) {
            const value = this.recipe ? this.recipeOverrides?.[key] : undefined;
            if (value !== undefined) u.searchParams.set(parameter, String(value));
            else u.searchParams.delete(parameter);
        }
        const v = this.renderer?.viewState?.() || this.viewSettings;
        u.searchParams.set('frame', v.systemContext ? 'system' : 'planet');
        for (const [k, key] of [
            ['view', 'view'],
            ['quality', 'quality'],
            ['time', 'time'],
            ['exposure', 'exposure'],
            ['az', 'azimuth'],
            ['el', 'elevation'],
            ['range', 'range'],
        ])
            if (v[key] !== undefined) u.searchParams.set(k, String(v[key]));
        return u.href;
    }
    updateShare() {
        if (this.$('#engine-share-url')) this.$('#engine-share-url').value = this.shareURL();
    }
    async capture() {
        if (!this.context) {
            this.$('#engine-disclosure-text').textContent =
                'Wait for verified evidence before exporting a source-backed scene.';
            return;
        }
        const canvas = this.renderer
            ? await this.renderer.captureCanvas()
            : this.$('#engine-schematic');
        const out = document.createElement('canvas');
        out.width = Math.max(960, canvas.width);
        out.height = Math.max(640, canvas.height) + 130;
        const ctx = out.getContext('2d');
        ctx.fillStyle = '#06121e';
        ctx.fillRect(0, 0, out.width, out.height);
        ctx.drawImage(canvas, 0, 0, out.width, out.height - 130);
        ctx.fillStyle = '#e7f6ff';
        ctx.font = 'bold 22px system-ui';
        ctx.fillText(
            `${this.context.evidence.object.canonicalName} · ${this.context.evidence.object.existence.status.replace('_', ' ')}`,
            24,
            out.height - 100
        );
        ctx.font = '16px system-ui';
        const disclosure = this.context.packet.decision.requiredDisclosures.join(' ');
        let line = '',
            y = out.height - 70;
        for (const word of disclosure.split(' ')) {
            if (ctx.measureText(line + word).width > out.width - 48) {
                ctx.fillText(line, 24, y);
                y += 21;
                line = '';
            }
            line += word + ' ';
        }
        ctx.fillText(line, 24, y);
        ctx.fillStyle = '#a7c9da';
        ctx.font = '12px monospace';
        ctx.fillText(
            `Evidence ${this.context.releaseId} | ${this.recipe ? 'procedural spatial detail' : 'schematic view'} | ${this.viewSettings.view}`,
            24,
            out.height - 15
        );
        const sidecar = {
            schemaVersion: '1.0.0',
            object: this.context.evidence.object,
            evidenceRelease: this.context.releaseId,
            recipe: this.recipe,
            view: this.renderer?.viewState?.() || this.viewSettings,
            decision: this.context.packet.decision,
            citations: this.context.evidence.citations,
            url: this.shareURL(),
        };
        this.download(
            out.toDataURL('image/png'),
            `${this.context.evidence.object.id}-labelled.png`
        );
        const url = URL.createObjectURL(
            new Blob([JSON.stringify(sidecar, null, 2)], { type: 'application/json' })
        );
        this.download(url, `${this.context.evidence.object.id}-evidence.json`);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    download(href, name) {
        const a = el('a');
        a.href = href;
        a.download = name;
        document.body.append(a);
        a.click();
        a.remove();
    }
    close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.loadSerial++;
        this.loader.cancel();
        this.renderer?.dispose();
        this.renderer = null;
        this.resizeObserver?.disconnect();
        document.removeEventListener('visibilitychange', this.visibilityHandler);
        if (document.fullscreenElement === this.modal) document.exitFullscreen().catch(() => {});
        this.modal.remove();
        document.body.style.overflow = this.previousOverflow;
        this.returnFocusElement?.focus?.({ preventScroll: true });
    }
}
