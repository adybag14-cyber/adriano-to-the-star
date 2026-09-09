(function () {
    'use strict';

    const scriptUrl = new URL(document.currentScript?.src || 'atmosphere-catalog.js', location.href);
    const baseUrl = new URL('.', scriptUrl);
    const releaseQuery = scriptUrl.search;
    const NASA_ARCHIVE = 'https://exoplanetarchive.ipac.caltech.edu/';
    const SPECTRA_DOCS = 'https://exoplanetarchive.ipac.caltech.edu/docs/atmospheres/atmospheres_columns.html';
    const COMPOSITE_DOCS = 'https://exoplanetarchive.ipac.caltech.edu/docs/pscp_calc.html';
    const MAX_DATABASE_CARDS = 12;

    let catalog = null;
    let appearanceModel = null;
    let currentEducationPlanet = null;
    let databasePage = 1;

    const versionedUrl = relativePath => {
        const url = new URL(relativePath, baseUrl);
        if (releaseQuery) url.search = releaseQuery;
        return url;
    };

    const isCatalog = value => Boolean(value && typeof value === 'object' && Array.isArray(value.systems));

    const normalize = value => String(value || '')
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '');

    const decodeLabel = value => {
        const parsed = new DOMParser().parseFromString(String(value || ''), 'text/html');
        return parsed.body.textContent || String(value || '');
    };

    const setText = (id, value) => {
        const node = document.getElementById(id);
        if (node) node.textContent = value == null || value === '' ? 'Not available' : String(value);
    };

    const countSpectra = planet => {
        const counts = planet?.spectroscopy?.counts || {};
        return ['transmission', 'eclipse', 'directImaging']
            .reduce((sum, key) => sum + (Number(counts[key]) || 0), 0);
    };

    const measurement = (planet, key) => {
        const primary = planet?.psDefault?.measurements?.[key];
        if (primary?.value != null) return primary;
        const composite = planet?.psComposite?.measurements?.[key];
        return composite || primary || null;
    };

    const formatNumber = (value, maximumFractionDigits = 3) => Number(value).toLocaleString(undefined, {
        maximumFractionDigits
    });

    const formatMeasurement = (entry, suffix, maximumFractionDigits = 3) => {
        if (!entry || entry.value == null) return 'Not reported';
        const display = entry.display || formatNumber(entry.value, maximumFractionDigits);
        const provenance = entry.provenance?.kind === 'archive-calculated' ? ' · archive-calculated' : '';
        return `${display}${suffix ? ` ${suffix}` : ''}${provenance}`;
    };

    const ensureAppearanceModel = activeCatalog => {
        if (window.__planetaryAppearanceModel) {
            appearanceModel = window.__planetaryAppearanceModel;
            appearanceModel.setCatalog?.(activeCatalog);
            return appearanceModel;
        }
        if (typeof window.PlanetaryAppearanceModel === 'function') {
            appearanceModel = new window.PlanetaryAppearanceModel(activeCatalog);
            appearanceModel.setCatalog?.(activeCatalog);
            window.__planetaryAppearanceModel = appearanceModel;
        }
        return appearanceModel;
    };

    const flattenPlanets = activeCatalog => activeCatalog.systems.flatMap(system =>
        (system.planets || []).map(planet => ({ system, planet }))
    );

    const fallbackResolveTarget = (query, activeCatalog = catalog) => {
        if (!activeCatalog) return null;
        const key = normalize(query);
        if (!key) return null;
        for (const system of activeCatalog.systems) {
            for (const planet of system.planets || []) {
                if (key === normalize(planet.id) || key === normalize(planet.name)) {
                    return { kind: 'planet', planet, system, id: planet.id, name: planet.name };
                }
            }
        }
        const system = activeCatalog.systems.find(candidate =>
            key === normalize(candidate.id) || key === normalize(candidate.hostname)
        );
        return system
            ? { kind: 'system', system, planets: system.planets || [], id: system.id, name: system.hostname }
            : null;
    };

    const resolveTarget = query => {
        const model = ensureAppearanceModel(catalog);
        try {
            return model?.resolveTarget?.(query) || fallbackResolveTarget(query);
        } catch (error) {
            console.warn('Unable to resolve atmosphere catalogue target with the appearance model:', error);
            return fallbackResolveTarget(query);
        }
    };

    const fallbackProfile = (planet, system) => {
        const spectra = countSpectra(planet);
        const calculated = planet?.psComposite?.calculatedFields?.length || 0;
        return {
            evidence: {
                tier: spectra > 0 ? 2 : 1,
                label: spectra > 0 ? 'Published spectrum metadata' : 'Physical parameters only'
            },
            confidence: {
                overall: spectra > 0 ? 0.34 : 0.14,
                atmosphere: spectra > 0 ? 0.24 : 0.02,
                surface: 0,
                summary: spectra > 0
                    ? 'A published spectrum exists, but the archive metadata does not provide a vetted species retrieval.'
                    : 'No planetary atmospheric spectrum is available in the archive snapshot.'
            },
            assumptions: [
                'Surface geography is not observed.',
                'Cloud distribution is a procedural scenario.',
                ...(calculated ? [`${calculated} displayed physical field(s) are archive-calculated.`] : [])
            ],
            sourceSummary: `${system?.hostname || 'Host system'} · NASA Exoplanet Archive build snapshot`
        };
    };

    const deriveProfile = (planet, system) => {
        const model = ensureAppearanceModel(catalog);
        try {
            return model?.derive?.({ kind: 'planet', planet, system, id: planet.id, name: planet.name })
                || model?.deriveAppearance?.({ kind: 'planet', planet, system, id: planet.id, name: planet.name })
                || fallbackProfile(planet, system);
        } catch (error) {
            console.warn(`Appearance profile derivation failed for ${planet.name}:`, error);
            return fallbackProfile(planet, system);
        }
    };

    const confidenceLabel = value => {
        if (typeof value === 'number' && Number.isFinite(value)) return `${Math.round(value * 100)}% model confidence`;
        if (typeof value === 'string' && value.trim()) return value;
        return 'Low · scenario dependent';
    };

    const makeLink = (label, href) => {
        const link = document.createElement('a');
        link.textContent = label;
        link.href = href;
        if (/^https?:/i.test(href)) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
        return link;
    };

    const sourceReferences = planet => {
        const candidates = [
            planet?.discovery?.reference,
            ...Object.values(planet?.psDefault?.references || {}),
            measurement(planet, 'radiusEarth')?.provenance?.reference,
            measurement(planet, 'massEarth')?.provenance?.reference,
            measurement(planet, 'equilibriumTemperatureK')?.provenance?.reference
        ].filter(reference => reference?.url);
        const seen = new Set();
        return candidates.filter(reference => {
            if (seen.has(reference.url)) return false;
            seen.add(reference.url);
            return true;
        });
    };

    const renderSourceLinks = (planet, system) => {
        const container = document.getElementById('planet-source-links');
        if (!container) return;
        const links = [
            makeLink('NASA planet record', `${NASA_ARCHIVE}overview/${encodeURIComponent(planet.name)}`),
            makeLink('Planet data DOI', 'https://doi.org/10.26133/NEA12'),
            makeLink('Spectra schema', SPECTRA_DOCS),
            makeLink('Composite calculations', COMPOSITE_DOCS)
        ];
        sourceReferences(planet).slice(0, 3).forEach(reference => {
            links.push(makeLink(decodeLabel(reference.label || reference.id || 'Literature reference'), reference.url));
        });
        container.replaceChildren(...links);
        container.setAttribute('aria-label', `Scientific sources for ${planet.name} in the ${system.hostname} system`);
    };

    const populateSystemSelector = (system, selectedPlanet) => {
        const section = document.getElementById('education-system-worlds');
        const select = document.getElementById('education-world-select');
        if (!section || !select) return;
        const planets = system?.planets || [];
        section.hidden = planets.length < 2;
        setText('education-system-name', system?.hostname || 'selected system');
        if (section.hidden) {
            select.replaceChildren();
            return;
        }
        const options = planets.map(planet => {
            const option = document.createElement('option');
            option.value = planet.name;
            option.textContent = planet.name;
            option.selected = planet.id === selectedPlanet?.id;
            return option;
        });
        select.replaceChildren(...options);
        setText('education-selection-status', `${planets.length} catalogued worlds. ${selectedPlanet.name} selected.`);
        if (!select.dataset.atmosphereBound) {
            select.dataset.atmosphereBound = 'true';
            select.addEventListener('change', () => window.selectEducationPlanet?.(select.value));
        }
    };

    const renderSolarEducation = query => {
        currentEducationPlanet = null;
        const section = document.getElementById('education-system-worlds');
        if (section) section.hidden = true;
        setText('planet-context-label', 'Observed Solar System world');
        setText('planet-evidence-tier', 'Solar System reference');
        setText('planet-spectrum-status', 'Mission and literature observations');
        setText('planet-model-confidence', normalize(query) === 'earth' ? 'High for source texture' : 'Illustrative texture');
        setText('planet-model-version', 'Native texture renderer');
        setText('planet-model-summary', normalize(query) === 'earth'
            ? 'Earth uses NASA Blue Marble surface data. Interactive lighting and atmospheric scattering remain renderer effects.'
            : 'This Solar System view uses a curated educational texture; consult mission sources for scientific image products.');
        const assumptions = document.getElementById('planet-model-assumptions');
        if (assumptions) {
            const item = document.createElement('li');
            item.textContent = 'Directional lighting, scale and atmosphere are visualization choices.';
            assumptions.replaceChildren(item);
        }
        const links = document.getElementById('planet-source-links');
        if (links) {
            links.replaceChildren(
                makeLink(normalize(query) === 'earth' ? 'NASA Blue Marble' : 'NASA Solar System', normalize(query) === 'earth'
                    ? 'https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/'
                    : 'https://science.nasa.gov/solar-system/planets/'),
                makeLink('NASA Exoplanet Archive', NASA_ARCHIVE)
            );
        }
    };

    const renderEducationPlanet = (planet, system) => {
        currentEducationPlanet = planet.name;
        const profile = deriveProfile(planet, system);
        const spectra = countSpectra(planet);
        const radius = measurement(planet, 'radiusEarth');
        const distancePc = Number(system.distancePc);
        const distance = Number.isFinite(distancePc)
            ? `${formatNumber(distancePc, 3)} pc · ${formatNumber(distancePc * 3.26156, 2)} ly`
            : 'Distance not reported';
        const speciesStatus = planet?.spectroscopy?.species?.status;
        const noSpeciesClaims = !planet?.spectroscopy?.species?.values?.length;

        populateSystemSelector(system, planet);
        setText('planet-name', planet.name.toUpperCase());
        setText('planet-context-label', 'Model-generated · not an observation');
        setText('planet-diameter', radius?.value != null
            ? `R = ${formatMeasurement(radius, 'R⊕')}`
            : 'Radius not measured');
        setText('planet-distance', distance);
        setText('planet-surface', 'Unresolved · scenario render');
        setText('planet-desc', spectra > 0
            ? `${planet.name} has ${spectra} published spectrum record${spectra === 1 ? '' : 's'} in this snapshot. Surface geography and cloud patterns remain unobserved.`
            : `${planet.name} has no planetary atmospheric spectrum in this snapshot. Its color, atmosphere, clouds and surface are hypothetical.`);
        setText('planet-evidence-tier', profile.evidence?.label || `Tier ${profile.evidence?.tier ?? 1}`);
        setText('planet-spectrum-status', spectra > 0
            ? `${spectra} metadata record${spectra === 1 ? '' : 's'} · no species claims`
            : 'No planetary atmosphere spectrum');
        setText('planet-model-confidence', confidenceLabel(profile.evidence?.confidence ?? profile.confidence?.overall));
        setText('planet-model-version', window.PlanetaryAppearanceModel?.MODEL_VERSION || window.PlanetaryAppearanceModel?.VERSION || profile.modelVersion || 'Fallback scenario profile');
        setText('planet-model-summary', profile.data?.desc || profile.evidence?.spectrumStatus || profile.confidence?.summary || profile.sourceSummary || 'Physics-constrained scenario with explicit assumptions.');

        const assumptions = document.getElementById('planet-model-assumptions');
        if (assumptions) {
            const profileAssumptions = profile.evidence?.assumptions || profile.assumptions;
            const values = Array.isArray(profileAssumptions) ? profileAssumptions.slice(0, 6) : [];
            if (noSpeciesClaims) values.unshift(`Atmospheric species status: ${speciesStatus || 'not supplied by the NASA TAP metadata'}.`);
            const items = (values.length ? values : ['Appearance is a procedural scenario, not a photograph.']).map(value => {
                const item = document.createElement('li');
                item.textContent = value;
                return item;
            });
            assumptions.replaceChildren(...items);
        }
        renderSourceLinks(planet, system);
    };

    const refreshEducation = query => {
        if (!document.getElementById('data-overlay') || !catalog) return;
        if (query && typeof query === 'object' && query.planet && query.system) {
            renderEducationPlanet(query.planet, query.system);
            return;
        }
        const requested = (typeof query === 'string' ? query : query?.name)
            || currentEducationPlanet
            || new URLSearchParams(location.search).get('target')
            || 'Earth';
        const resolved = resolveTarget(requested);
        if (!resolved) {
            renderSolarEducation(requested);
            return;
        }
        const system = resolved.system;
        const planet = resolved.planet || resolved.planets?.[0];
        if (planet && system) renderEducationPlanet(planet, system);
        else renderSolarEducation(requested);
    };

    const wrapEducationSelection = () => {
        if (typeof window.selectEducationPlanet !== 'function' || window.selectEducationPlanet.__atmosphereWrapped) return;
        const selectPlanet = window.selectEducationPlanet;
        const wrapped = function (name) {
            selectPlanet(name);
            queueMicrotask(() => refreshEducation(name));
        };
        wrapped.__atmosphereWrapped = true;
        window.selectEducationPlanet = wrapped;
    };

    const makeMeta = (term, detail) => {
        const row = document.createElement('div');
        const label = document.createElement('dt');
        const value = document.createElement('dd');
        label.textContent = term;
        value.textContent = detail;
        row.append(label, value);
        return row;
    };

    const createDatabaseCard = ({ planet, system }) => {
        const profile = deriveProfile(planet, system);
        const spectra = countSpectra(planet);
        const radius = measurement(planet, 'radiusEarth');
        const mass = measurement(planet, 'massEarth');
        const temperature = measurement(planet, 'equilibriumTemperatureK');
        const article = document.createElement('article');
        article.className = 'atmosphere-model-card';
        article.dataset.evidence = spectra > 0 ? 'spectra' : 'parameters';
        const preview = document.createElement('div');
        preview.className = 'atmosphere-model-preview ita-planet-visual';
        preview.dataset.previewTarget = planet.name;
        preview.setAttribute('role', 'img');
        preview.setAttribute('aria-label', `${planet.name}: generic placeholder while the appearance model loads`);
        const generic = document.createElement('span');
        generic.className = 'ita-planet-sphere';
        generic.setAttribute('aria-hidden', 'true');
        preview.append(generic);

        const header = document.createElement('header');
        const title = document.createElement('h3');
        const host = document.createElement('p');
        title.textContent = planet.name;
        host.textContent = `${system.hostname} · ${system.distancePc == null ? 'distance unreported' : `${formatNumber(system.distancePc, 2)} pc`}`;
        header.append(title, host);

        const badge = document.createElement('p');
        badge.className = 'atmosphere-evidence-badge';
        badge.textContent = profile.evidence?.class === 'spectrum-constrained'
            ? 'Spectrum-constrained scenario'
            : profile.evidence?.class === 'bulk-constrained'
                ? 'Bulk properties only'
                : (spectra > 0 ? 'Published spectrum metadata' : 'Physical parameters only');

        const metadata = document.createElement('dl');
        metadata.append(
            makeMeta('Atmospheric spectra', spectra ? String(spectra) : 'None in snapshot'),
            makeMeta('Radius', formatMeasurement(radius, 'R⊕')),
            makeMeta('Mass', formatMeasurement(mass, 'M⊕')),
            makeMeta('Equilibrium temp.', formatMeasurement(temperature, 'K', 0)),
            makeMeta('Appearance confidence', confidenceLabel(profile.evidence?.confidence ?? profile.confidence?.overall))
        );

        const disclosure = document.createElement('p');
        disclosure.className = 'atmosphere-model-disclosure';
        disclosure.textContent = spectra > 0
            ? 'Spectrum metadata is archived; species abundances are not provided by the TAP metadata and are not invented here.'
            : 'No atmospheric spectrum is available. Texture, color, clouds and surface are a model scenario.';

        const actions = document.createElement('nav');
        actions.className = 'atmosphere-model-actions';
        actions.setAttribute('aria-label', `Actions for ${planet.name}`);
        actions.append(
            makeLink('Open in Planetary OS', `education.html?target=${encodeURIComponent(planet.name)}`),
            makeLink('NASA record', `${NASA_ARCHIVE}overview/${encodeURIComponent(planet.name)}`)
        );

        article.append(preview, header, badge, metadata, disclosure, actions);
        return article;
    };

    const databaseFilterMatch = (entry, filter) => {
        const spectra = countSpectra(entry.planet);
        if (filter === 'spectra') return spectra > 0;
        if (filter === 'no-spectra') return spectra === 0;
        if (filter === 'calculated') return Boolean(entry.planet?.psComposite?.calculatedFields?.length);
        return true;
    };

    const refreshDatabase = () => {
        const panel = document.getElementById('atmosphere-catalog-panel');
        const list = document.getElementById('atmosphere-catalog-list');
        const filter = document.getElementById('atmosphere-catalog-filter');
        if (!panel || !list || !catalog) return;
        const search = normalize(document.getElementById('atmosphere-catalog-search')?.value);
        const matches = flattenPlanets(catalog)
            .filter(entry => databaseFilterMatch(entry, filter?.value || 'all'))
            .filter(({ system, planet }) => !search || [planet.name, planet.id, system.hostname].some(value => normalize(value).includes(search)))
            .sort((left, right) => (left.system.distancePc ?? Infinity) - (right.system.distancePc ?? Infinity));
        const pages = Math.max(1, Math.ceil(matches.length / MAX_DATABASE_CARDS));
        databasePage = Math.min(databasePage, pages);
        const start = (databasePage - 1) * MAX_DATABASE_CARDS;
        const entries = matches.slice(start, start + MAX_DATABASE_CARDS);
        list.replaceChildren(...entries.map(createDatabaseCard));
        if (!entries.length) {
            const empty = document.createElement('p');
            empty.textContent = 'No worlds match this name and evidence filter. Clear the search or choose All planets.';
            list.append(empty);
        }
        setText('atmosphere-catalog-page', `Page ${databasePage} of ${pages}`);
        const previous = document.getElementById('atmosphere-catalog-previous');
        const next = document.getElementById('atmosphere-catalog-next');
        if (previous) previous.disabled = databasePage === 1;
        if (next) next.disabled = databasePage === pages;

        const total = catalog.statistics?.planets ?? flattenPlanets(catalog).length;
        const spectraTotal = catalog.statistics?.planetsWithSpectraMetadata ?? flattenPlanets(catalog).filter(entry => countSpectra(entry.planet) > 0).length;
        setText('atmosphere-catalog-summary', `${catalog.systems.length} systems · ${total} planets · ${spectraTotal} with published spectrum metadata`);
        setText('atmosphere-registry-count', `${total} worlds · ${spectraTotal} spectrum-linked models`);
        const generated = catalog.generatedAt ? new Date(catalog.generatedAt).toLocaleString() : 'unknown build time';
        setText('atmosphere-catalog-status', catalog.loadError
            ? `Catalogue unavailable: ${catalog.loadError}`
            : `NASA Exoplanet Archive snapshot generated ${generated}. Showing ${matches.length ? start + 1 : 0}–${start + entries.length} of ${matches.length} matching worlds.`);
        if (filter && !filter.dataset.atmosphereBound) {
            filter.dataset.atmosphereBound = 'true';
            filter.addEventListener('change', () => { databasePage = 1; refreshDatabase(); });
            document.getElementById('atmosphere-catalog-search')?.addEventListener('input', () => { databasePage = 1; refreshDatabase(); });
            for (const [button, direction] of [[previous, -1], [next, 1]]) {
                button?.addEventListener('click', () => {
                    databasePage += direction;
                    refreshDatabase();
                    list.scrollTop = 0;
                });
            }
        }
    };

    const ensureCatalog = async () => {
        if (isCatalog(window.__exoplanetAtmosphereCatalog) && !window.__exoplanetAtmosphereCatalog.loadError) {
            catalog = window.__exoplanetAtmosphereCatalog;
            return catalog;
        }
        if (window.__exoplanetAtmosphereCatalogPromise) {
            const shared = await window.__exoplanetAtmosphereCatalogPromise;
            if (isCatalog(shared)) {
                catalog = shared;
                return catalog;
            }
        }
        const promise = (async () => {
            const response = await fetch(versionedUrl('data/exoplanet-appearance-index.json'), {
                credentials: 'same-origin',
                cache: releaseQuery ? 'force-cache' : 'no-cache'
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            if (!isCatalog(payload)) throw new Error('Unexpected catalogue schema');
            window.__exoplanetAtmosphereCatalog = payload;
            return payload;
        })();
        window.__exoplanetAtmosphereCatalogPromise = promise;
        catalog = await promise;
        return catalog;
    };

    const showLoadFailure = error => {
        setText('atmosphere-catalog-status', `Atmosphere catalogue unavailable: ${error.message}`);
        setText('planet-model-summary', `Atmosphere catalogue unavailable: ${error.message}`);
        console.warn('Atmosphere catalogue presentation could not start:', error);
    };

    const initialize = async () => {
        try {
            await ensureCatalog();
            ensureAppearanceModel(catalog);
            wrapEducationSelection();
            refreshEducation();
            refreshDatabase();
            if (location.hash === '#atmosphere-catalog-panel') document.getElementById('atmosphere-catalog-panel')?.setAttribute('open', '');
        } catch (error) {
            showLoadFailure(error);
        }
    };

    window.ExoplanetAtmosphereCatalog = {
        ensureCatalog,
        resolveTarget,
        refreshEducation,
        refreshDatabase
    };

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
    else initialize();
})();
