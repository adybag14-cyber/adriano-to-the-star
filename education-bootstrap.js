(function () {
  'use strict';
  const source = document.currentScript?.src || new URL('education-bootstrap.js', location.href).href;
  const base = new URL('.', source);
  const load = name => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL(name, base).href;
    script.async = false;
    script.dataset.cfasync = 'false';
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', () => reject(new Error(`Unable to load ${name}`)), { once: true });
    document.head.append(script);
  });
  const boot = async () => {
    try {
      await load('three.min.js');
      await load('OrbitControls-r128.js');
      await load('education-viewer.js');
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
