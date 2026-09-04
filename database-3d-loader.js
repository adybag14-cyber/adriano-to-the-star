(function () {
  'use strict';
  const source = document.currentScript?.src || new URL('database-3d-loader.js', location.href).href;
  const base = new URL('.', source);
  const revision = new URL(source).searchParams.get('v');
  // Assemble lazy asset names so the production build's static-string versioner
  // does not add a query twice; this loader propagates its own revision below.
  const assets = {
    three: ['three', 'min', 'js'].join('.'),
    controls: ['OrbitControls-r128', 'js'].join('.'),
    viewer: ['planet-3d-viewer', 'js'].join('.'),
  };
  const scriptTimeoutMs = 15000;
  const attempts = new Map();
  let loading = null;

  const progress = (asset, state, message) => document.dispatchEvent(new CustomEvent('ita:database-3d-progress', {
    detail: { asset, state, message }
  }));

  const findScript = name => [...document.scripts].find(script => {
    const src = script.getAttribute('src');
    return src && new URL(src, document.baseURI).pathname.endsWith(`/${name}`);
  });

  const load = (name, isReady) => new Promise((resolve, reject) => {
    if (isReady()) { resolve(); return; }

    const existing = findScript(name);
    const script = existing || document.createElement('script');
    let settled = false;
    let timer = null;
    const cleanup = () => {
      clearTimeout(timer);
      script.removeEventListener('load', finish);
      script.removeEventListener('error', onError);
    };
    const fail = message => {
      if (settled) return;
      settled = true;
      cleanup();
      // An errored script will never emit another load event. Remove it so a
      // later request can retry instead of waiting on the spent element.
      script.remove();
      progress(name, 'error', message);
      reject(new Error(message));
    };
    const onError = () => fail(`Unable to load ${name}. Please try again.`);
    const finish = () => {
      if (settled) return;
      if (!isReady()) {
        fail(`${name} loaded without initializing its expected browser API. Please try again.`);
        return;
      }
      settled = true;
      cleanup();
      script.dataset.loaded = 'true';
      progress(name, 'loaded', `${name} is ready.`);
      resolve();
    };

    // Register listeners before appending a new dynamic script. A cached resource
    // can complete synchronously enough to otherwise leave this promise pending.
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', onError, { once: true });
    timer = setTimeout(() => fail(`Loading ${name} timed out after 15 seconds. Please try again.`), scriptTimeoutMs);
    progress(name, 'loading', `Loading ${name}…`);

    if (!existing) {
      const url = new URL(name, base);
      if (revision) url.searchParams.set('v', revision);
      const attempt = attempts.get(name) || 0;
      // Browsers may coalesce identical URLs with a still-stalled request.
      // Give retries a fresh request while preserving the release revision.
      if (attempt) url.searchParams.set('retry', String(attempt));
      attempts.set(name, attempt + 1);
      script.src = url.href;
      // The awaits below enforce dependency order. An ordered dynamic script
      // can keep blocking retries even after its timed-out element is removed.
      script.async = true;
      script.dataset.cfasync = 'false';
      document.head.append(script);
    } else if (isReady()) {
      // Close the small race between the first readiness check and listener setup.
      finish();
    }
  });

  window.ensureDatabase3D = function () {
    if (window.THREE?.OrbitControls && window.Planet3DViewer) return Promise.resolve(window.Planet3DViewer);
    if (!loading) {
      loading = (async () => {
        await load(assets.three, () => Boolean(window.THREE));
        await load(assets.controls, () => Boolean(window.THREE?.OrbitControls));
        await load(assets.viewer, () => Boolean(window.Planet3DViewer));
        if (!window.Planet3DViewer) throw new Error('3D viewer loaded without registering its public class.');
        return window.Planet3DViewer;
      })().catch(error => { loading = null; throw error; });
    }
    return loading;
  };
})();
