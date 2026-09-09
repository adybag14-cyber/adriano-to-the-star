/* Texture-native CPU path for browsers which cannot create a WebGL context.
   Projection and shading run off the UI thread; source maps are never resized. */
(() => {
  const source = new URL(document.currentScript.src);
  class EducationSoftwareRenderer {
    constructor(viewer) {
      this.viewer = viewer;
      this.canvas = document.createElement('canvas');
      this.canvas.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);touch-action:none';
      viewer.container.append(this.canvas);
      this.zoom = 1;
      this.yaw = -.72;
      this.pitch = .05;
      this.generation = 0;
      const workerUrl = new URL('education-software-worker.js', source);
      workerUrl.search = source.search;
      this.worker = new Worker(workerUrl);
      const offscreen = this.canvas.transferControlToOffscreen();
      this.worker.postMessage({ type: 'init', canvas: offscreen }, [offscreen]);
      this.worker.onmessage = ({ data }) => {
        if (data.generation !== this.generation) return;
        if (data.type === 'painted') {
          viewer.container.classList.add('education-renderer-ready');
          viewer.container.dataset.surfaceReady = 'true';
          viewer.container.dataset.surfaceWidth = String(data.surfaceWidth);
          viewer.container.dataset.cloudsReady = String(data.clouds);
        }
      };
      this.worker.onerror = () => {
        viewer.container.dataset.surfaceReady = 'false';
        viewer.container.setAttribute('aria-label', 'Planet renderer could not start. Please reload the page.');
      };
      let last = null;
      this.canvas.addEventListener('pointerdown', e => {
        last = [e.clientX, e.clientY];
        this.canvas.setPointerCapture(e.pointerId);
      });
      this.canvas.addEventListener('pointermove', e => {
        if (!last) return;
        this.yaw += (e.clientX - last[0]) * .006;
        this.pitch = Math.max(-1.4, Math.min(1.4, this.pitch + (e.clientY - last[1]) * .006));
        last = [e.clientX, e.clientY];
        this.worker.postMessage({ type: 'view', yaw: this.yaw, pitch: this.pitch });
      });
      for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
        this.canvas.addEventListener(name, () => { last = null; });
      }
      this.canvas.addEventListener('wheel', e => {
        e.preventDefault();
        this.zoom = Math.max(.25, Math.min(1.8, this.zoom * Math.exp(-e.deltaY * .001)));
        this.resize();
      }, { passive: false });
      document.addEventListener('visibilitychange', () => this.worker.postMessage({ type: 'visibility', hidden: document.hidden }));
      addEventListener('pagehide', () => this.worker.postMessage({ type: 'visibility', hidden: true }));
      addEventListener('pageshow', () => this.worker.postMessage({ type: 'visibility', hidden: document.hidden }));
      this.resize();
    }
    resize() {
      const compact = innerWidth <= 760;
      const overlayTop = document.getElementById('data-overlay')?.getBoundingClientRect().top || innerHeight;
      const available = compact ? Math.max(80, overlayTop - 104) : Infinity;
      const size = Math.max(80, Math.min(Math.min(innerWidth, innerHeight) * .51, available) * this.zoom);
      const dpr = Math.min(devicePixelRatio || 1, innerWidth <= 760 ? 1.5 : 2);
      this.canvas.style.top = compact ? `${(88 + overlayTop) / 2}px` : '50%';
      this.canvas.style.width = `${size}px`;
      this.canvas.style.height = `${size}px`;
      this.worker.postMessage({ type: 'resize', size: Math.round(size * dpr) });
    }
    async load(config, name) {
      const generation = ++this.generation;
      this.resize();
      this.viewer.container.dataset.surfaceReady = 'false';
      try {
        const model = config.planetaryModel;
        const appearance = this.viewer.appearanceModel;
        const textureWidth = innerWidth <= 760 ? 512 : innerWidth >= 1800 ? 1024 : 768;
        const surfaceUrl = this.viewer.hdTexturesEnabled && config.textureHd ? config.textureHd : config.texture;
        const bitmap = async url => {
          const response = await fetch(new URL(url, source));
          if (!response.ok) throw new Error(`Planet texture HTTP ${response.status}`);
          return window.createImageBitmap(await response.blob());
        };
        let surface, clouds;
        if (model && appearance) {
          const options = { width: textureWidth, height: textureWidth / 2 };
          const texture = appearance.createSurfaceTexture(THREE, model, options);
          surface = await window.createImageBitmap(texture.image);
          texture.dispose();
          const cloud = appearance.createCloudTexture(THREE, model, options);
          if (cloud) { clouds = await window.createImageBitmap(cloud.image); cloud.dispose(); }
        } else {
          [surface, clouds] = await Promise.all([bitmap(surfaceUrl), config.clouds ? bitmap(config.clouds) : null]);
        }
        if (generation !== this.generation) { surface.close(); clouds?.close(); return; }
        if (surface.width !== surface.height * 2) {
          surface.close(); clouds?.close();
          throw new Error('Planet textures must be complete 2:1 equirectangular maps, not disk photographs.');
        }
        this.worker.postMessage({ type: 'planet', generation, surface, clouds,
          speed: this.viewer.prefersReducedMotion ? 0 : config.speed * 60,
          atmosphere: name === 'Earth' || (model?.appearance?.atmosphereOpacity || 0) > .01,
          cloudOpacity: model?.appearance?.cloudOpacity ?? .78,
          cloudAlpha: Boolean(model), atmosphereOpacity: model?.appearance?.atmosphereOpacity ?? .28,
          atmosphereColour: model?.appearance?.atmosphereColour ?? [41, 122, 235], day: Boolean(config.day),
          yaw: this.yaw, pitch: this.pitch }, [surface, ...(clouds ? [clouds] : [])]);
      } catch (error) {
        if (generation !== this.generation) return;
        this.viewer.container.setAttribute('aria-label', `Unable to load ${name}'s surface: ${error.message}`);
        console.warn('Education texture loading failed:', error.message);
      }
    }
  }
  window.EducationSoftwareRenderer = EducationSoftwareRenderer;
})();
