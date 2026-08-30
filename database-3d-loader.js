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
  let loading = null;

  const findScript = name => [...document.scripts].find(script => {
    const src = script.getAttribute('src');
    return src && new URL(src, document.baseURI).pathname.endsWith(`/${name}`);
  });

  const load = (name, isReady) => new Promise((resolve, reject) => {
    if (isReady()) { resolve(); return; }

    const existing = findScript(name);
    if (existing?.dataset.loaded === 'true' && isReady()) { resolve(); return; }

    const script = existing || document.createElement('script');
    const finish = () => {
      if (!isReady()) {
        reject(new Error(`${name} loaded without initializing its expected browser API`));
        return;
      }
      script.dataset.loaded = 'true';
      resolve();
    };
    const fail = () => reject(new Error(`Unable to load ${name}`));

    // Register listeners before appending a new dynamic script. A cached resource
    // can complete synchronously enough to otherwise leave this promise pending.
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', fail, { once: true });

    if (!existing) {
      const url = new URL(name, base);
      if (revision) url.searchParams.set('v', revision);
      script.src = url.href;
      script.async = false;
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
