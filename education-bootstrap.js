(function () {
  'use strict';
  const sourceUrl = new URL(document.currentScript?.src || 'education-bootstrap.js', location.href);
  const base = new URL('.', sourceUrl);
  const releaseQuery = sourceUrl.search;
  const versionedUrl = name => {
    const url = new URL(name, base);
    if (releaseQuery) url.search = releaseQuery;
    return url;
  };
  const load = name => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = versionedUrl(name).href;
    script.async = false;
    script.dataset.cfasync = 'false';
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', () => reject(new Error(`Unable to load ${name}`)), { once: true });
    document.head.append(script);
  });

  const emptyCatalog = error => ({
    schemaVersion: null,
    generatedAt: null,
    scope: 'unavailable',
    updatePolicy: 'The last release snapshot could not be loaded.',
    sources: [],
    queryProvenance: [],
    statistics: {},
    systems: [],
    loadError: error instanceof Error ? error.message : String(error || 'Unknown catalogue error')
  });

  const normaliseTarget = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '');
  const localPlanets = new Set(['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']);
  const catalogContains = (catalog, target) => {
    const requested = normaliseTarget(target);
    if (!requested || localPlanets.has(requested)) return true;
    const alias = requested === 'proximacentauri' ? 'proximacen'
      : requested === 'epsiloneridani' ? 'epseri'
        : requested;
    return catalog.systems.some(system => (
      [system.id, system.hostname].some(value => normaliseTarget(value) === alias)
      || (system.planets || []).some(planet => [planet.id, planet.name].some(value => normaliseTarget(value) === alias))
    ));
  };

  const fetchCatalog = async name => {
    const response = await fetch(versionedUrl(name), {
      credentials: 'same-origin',
      cache: releaseQuery ? 'force-cache' : 'no-cache'
    });
    if (!response.ok) throw new Error(`Catalogue request returned HTTP ${response.status}`);
    const catalog = await response.json();
    if (!catalog || typeof catalog !== 'object' || !Array.isArray(catalog.systems)) {
      throw new Error('Catalogue response does not match the expected systems schema');
    }
    return catalog;
  };

  const loadCatalog = async () => {
    if (window.__exoplanetAtmosphereCatalog?.systems instanceof Array) {
      return window.__exoplanetAtmosphereCatalog;
    }
    try {
      const requestedTarget = window.__pendingEducationPlanet || new URLSearchParams(location.search).get('target');
      let catalog = await fetchCatalog('data/exoplanet-appearance-core.json');
      if (!catalogContains(catalog, requestedTarget)) catalog = await fetchCatalog('data/exoplanet-appearance-index.json');
      window.__exoplanetAtmosphereCatalog = catalog;
      document.dispatchEvent(new CustomEvent('exoplanet-atmosphere-catalog-ready', { detail: catalog }));
      return catalog;
    } catch (error) {
      const fallback = emptyCatalog(error);
      window.__exoplanetAtmosphereCatalog = fallback;
      document.dispatchEvent(new CustomEvent('exoplanet-atmosphere-catalog-error', { detail: fallback }));
      console.warn('Education atmosphere catalogue unavailable:', error);
      return fallback;
    }
  };

  window.__exoplanetAtmosphereCatalogPromise =
    window.__exoplanetAtmosphereCatalogPromise || loadCatalog();

  const preparePresentation = async () => {
    const catalog = await window.__exoplanetAtmosphereCatalogPromise;
    try {
      await load('planetary-appearance-model.js');
      if (typeof window.PlanetaryAppearanceModel === 'function') {
        window.__planetaryAppearanceModel = new window.PlanetaryAppearanceModel(catalog);
        window.__planetaryAppearanceModel.setCatalog?.(catalog);
      }
    } catch (error) {
      window.__planetaryAppearanceModelError = error.message;
      console.warn('Planetary appearance model unavailable; continuing with the basic viewer:', error);
    }
    try {
      await load('atmosphere-catalog.js');
    } catch (error) {
      console.warn('Atmosphere presentation controls unavailable:', error);
    }
    return catalog;
  };

  window.__planetaryPresentationPromise =
    window.__planetaryPresentationPromise || preparePresentation();

  const boot = async () => {
    try {
      await window.__planetaryPresentationPromise;
      await load('three.min.js');
      await load('OrbitControls-r128.js');
      await load('education-software-renderer.js');
      await load('education-viewer.js');
      window.ExoplanetAtmosphereCatalog?.refreshEducation?.();
    } catch (error) {
      const viewer = document.getElementById('viewer-container');
      if (viewer) viewer.setAttribute('aria-label', `Planet viewer unavailable: ${error.message}`);
      console.error('Education viewer startup failed:', error);
    }
  };
  requestAnimationFrame(() => requestAnimationFrame(() => {
    // Let the labelled controls, Earth data card, and native Blue Marble
    // preview paint before parsing and compiling the WebGL runtime.
    if ('requestIdleCallback' in window) requestIdleCallback(boot, { timeout: 1200 });
    else setTimeout(boot, 240);
  }));
})();
