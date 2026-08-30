(function initialiseTrackerScene(global) {
  'use strict';

  const SPECTRAL_COLOURS = Object.freeze({ O: 0x9bb0ff, B: 0xaabfff, A: 0xcad7ff, F: 0xf8f7ff, G: 0xfff4d6, K: 0xffd2a1, M: 0xffa06a, D: 0xdce7ff, U: 0xc4b5fd });

  function spectralColour(type) {
    const key = String(type || 'U').trim().charAt(0).toUpperCase();
    return SPECTRAL_COLOURS[key] || SPECTRAL_COLOURS.U;
  }

  function seededRandom(seed) {
    let state = seed >>> 0;
    return () => {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 4294967296;
    };
  }

  class TrackerScene {
    constructor(container, stars, options = {}) {
      if (!global.THREE) throw new Error('Three.js did not load');
      if (!(container instanceof HTMLElement)) throw new TypeError('A scene container is required');
      this.container = container;
      this.options = options;
      this.stars = [];
      this.starById = new Map();
      this.pointIndexToStar = [];
      this.selectedId = null;
      this.drag = null;
      this.yaw = 0.68;
      this.pitch = 0.34;
      this.radius = 36;
      this.target = new THREE.Vector3(0, 0, 0);
      this.running = true;
      this.visible = true;
      this.intersecting = true;
      this.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.lastFrame = performance.now();
      this.frameHandle = 0;
      this.disposables = [];

      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0x030611, 0.0135);
      this.camera = new THREE.PerspectiveCamera(48, 1, 0.05, 180);
      this.renderer = new THREE.WebGLRenderer({ antialias: innerWidth >= 720, alpha: true, powerPreference: 'high-performance' });
      this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth < 720 ? 1.35 : 1.8));
      this.renderer.setClearColor(0x030611, 0);
      this.renderer.outputEncoding = THREE.sRGBEncoding;
      this.renderer.domElement.className = 'tracker-canvas';
      this.renderer.domElement.tabIndex = 0;
      this.renderer.domElement.setAttribute('role', 'application');
      this.renderer.domElement.setAttribute('aria-label', 'Interactive three-dimensional map of the local stellar neighbourhood. Drag to orbit, use the mouse wheel or plus and minus keys to zoom, arrow keys to rotate, and Home to reset.');
      this.renderer.domElement.setAttribute('aria-describedby', 'tracker-scene-help');
      container.replaceChildren(this.renderer.domElement);

      this.world = new THREE.Group();
      this.scene.add(this.world);
      this.createReferenceGeometry();
      this.createBackgroundStars();
      this.createSelectionMarker();
      this.setStars(stars);
      this.bindEvents();
      this.updateCamera();
      this.resize();
      this.animate = this.animate.bind(this);
      this.frameHandle = requestAnimationFrame(this.animate);
    }

    track(resource) { this.disposables.push(resource); return resource; }

    createReferenceGeometry() {
      const ringMaterial = this.track(new THREE.LineBasicMaterial({ color: 0x214e68, transparent: true, opacity: 0.42 }));
      for (const radius of [5, 10, 15, 20, 25]) {
        const positions = [];
        for (let index = 0; index <= 128; index += 1) {
          const angle = index / 128 * Math.PI * 2;
          positions.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
        }
        const geometry = this.track(new THREE.BufferGeometry());
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.world.add(new THREE.Line(geometry, ringMaterial));
      }

      const axes = this.track(new THREE.BufferGeometry());
      axes.setAttribute('position', new THREE.Float32BufferAttribute([
        -28, 0, 0, 28, 0, 0,
        0, -28, 0, 0, 28, 0,
        0, 0, -28, 0, 0, 28
      ], 3));
      const axesMaterial = this.track(new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.16 }));
      this.world.add(new THREE.LineSegments(axes, axesMaterial));

      const ecliptic = this.track(new THREE.CircleGeometry(25, 96));
      ecliptic.deleteAttribute('normal');
      ecliptic.deleteAttribute('uv');
      const eclipticMaterial = this.track(new THREE.MeshBasicMaterial({ color: 0x4c1d95, transparent: true, opacity: 0.035, side: THREE.DoubleSide, depthWrite: false }));
      const disc = new THREE.Mesh(ecliptic, eclipticMaterial);
      disc.rotation.x = -Math.PI / 2;
      this.world.add(disc);
    }

    createBackgroundStars() {
      const random = seededRandom(20260830);
      const positions = [];
      const colours = [];
      for (let index = 0; index < 900; index += 1) {
        const radius = 35 + random() * 65;
        const theta = random() * Math.PI * 2;
        const cosPhi = random() * 2 - 1;
        const sinPhi = Math.sqrt(1 - cosPhi * cosPhi);
        positions.push(radius * sinPhi * Math.cos(theta), radius * cosPhi, radius * sinPhi * Math.sin(theta));
        const intensity = 0.36 + random() * 0.44;
        colours.push(intensity * 0.62, intensity * 0.82, intensity);
      }
      const geometry = this.track(new THREE.BufferGeometry());
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
      const material = this.track(new THREE.PointsMaterial({ size: 0.16, sizeAttenuation: true, transparent: true, opacity: 0.72, vertexColors: true, depthWrite: false }));
      this.background = new THREE.Points(geometry, material);
      this.scene.add(this.background);
    }

    createSelectionMarker() {
      const geometry = this.track(new THREE.RingGeometry(0.28, 0.38, 40));
      const material = this.track(new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthTest: false }));
      this.marker = new THREE.Mesh(geometry, material);
      this.marker.visible = false;
      this.marker.renderOrder = 20;
      this.world.add(this.marker);

      const lineGeometry = this.track(new THREE.BufferGeometry());
      lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 3));
      const lineMaterial = this.track(new THREE.LineDashedMaterial({ color: 0x67e8f9, dashSize: 0.18, gapSize: 0.12, transparent: true, opacity: 0.65 }));
      this.selectionLine = new THREE.Line(lineGeometry, lineMaterial);
      this.selectionLine.computeLineDistances();
      this.selectionLine.visible = false;
      this.world.add(this.selectionLine);
    }

    setStars(stars) {
      this.stars = Array.isArray(stars) ? stars : [];
      this.starById = new Map(this.stars.map(star => [star.id, star]));
      this.pointIndexToStar = [...this.stars];
      if (this.points) {
        this.world.remove(this.points);
        this.points.geometry.dispose();
        this.points.material.dispose();
      }
      const positions = [];
      const colours = [];
      const sizes = [];
      for (const star of this.stars) {
        const coordinate = star.coordinatesPc || { xPc: 0, yPc: 0, zPc: 0 };
        // Map equatorial z to Three.js y so north is visually vertical.
        positions.push(coordinate.xPc, coordinate.zPc, coordinate.yPc);
        const colour = new THREE.Color(star.id === 'sol' ? 0xffffff : spectralColour(star.spectralType));
        colours.push(colour.r, colour.g, colour.b);
        sizes.push(star.id === 'sol' ? 9 : star.planetCount ? 6.8 : 4.8);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colours, 3));
      geometry.setAttribute('pointSize', new THREE.Float32BufferAttribute(sizes, 1));
      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        vertexColors: true,
        uniforms: { pixelRatio: { value: this.renderer.getPixelRatio() }, time: { value: 0 } },
        vertexShader: `
          attribute float pointSize;
          varying vec3 vColour;
          uniform float pixelRatio;
          void main() {
            vColour = color;
            vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * viewPosition;
            gl_PointSize = pointSize * pixelRatio * (40.0 / max(8.0, -viewPosition.z));
            gl_PointSize = clamp(gl_PointSize, 3.0, 18.0);
          }
        `,
        fragmentShader: `
          varying vec3 vColour;
          void main() {
            vec2 p = gl_PointCoord - vec2(0.5);
            float d = length(p);
            if (d > 0.5) discard;
            float core = smoothstep(0.5, 0.02, d);
            float halo = smoothstep(0.5, 0.16, d) * 0.58;
            gl_FragColor = vec4(vColour * (1.25 + core), max(core, halo));
          }
        `
      });
      this.points = new THREE.Points(geometry, material);
      this.world.add(this.points);
      if (this.selectedId && this.starById.has(this.selectedId)) this.select(this.selectedId, false);
      else this.clearSelection();
      this.options.onDiagnostics?.(this.getDiagnostics());
    }

    select(id, notify = true) {
      const star = this.starById.get(id);
      if (!star) return false;
      this.selectedId = id;
      const coordinate = star.coordinatesPc;
      const position = new THREE.Vector3(coordinate.xPc, coordinate.zPc, coordinate.yPc);
      this.marker.position.copy(position);
      this.marker.visible = true;
      this.selectionLine.geometry.attributes.position.setXYZ(1, position.x, position.y, position.z);
      this.selectionLine.geometry.attributes.position.needsUpdate = true;
      this.selectionLine.computeLineDistances();
      this.selectionLine.visible = star.id !== 'sol';
      if (notify) this.options.onSelect?.(star);
      return true;
    }

    clearSelection() {
      this.selectedId = null;
      if (this.marker) this.marker.visible = false;
      if (this.selectionLine) this.selectionLine.visible = false;
    }

    setAutoRotate(value) { this.autoRotate = Boolean(value); return this.autoRotate; }
    reset() { this.yaw = 0.68; this.pitch = 0.34; this.radius = 36; this.target.set(0, 0, 0); this.updateCamera(); }

    updateCamera() {
      const cosPitch = Math.cos(this.pitch);
      this.camera.position.set(
        this.target.x + this.radius * cosPitch * Math.cos(this.yaw),
        this.target.y + this.radius * Math.sin(this.pitch),
        this.target.z + this.radius * cosPitch * Math.sin(this.yaw)
      );
      this.camera.lookAt(this.target);
      if (this.marker?.visible) this.marker.quaternion.copy(this.camera.quaternion);
    }

    bindEvents() {
      const canvas = this.renderer.domElement;
      this.onResize = () => this.resize();
      this.onVisibility = () => { this.visible = !document.hidden && this.intersecting; };
      this.onPointerDown = event => {
        canvas.setPointerCapture(event.pointerId);
        this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
      };
      this.onPointerMove = event => {
        if (!this.drag || this.drag.id !== event.pointerId) return;
        const dx = event.clientX - this.drag.x;
        const dy = event.clientY - this.drag.y;
        if (Math.abs(dx) + Math.abs(dy) > 2) this.drag.moved = true;
        this.yaw -= dx * 0.006;
        this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch + dy * 0.005));
        this.drag.x = event.clientX;
        this.drag.y = event.clientY;
        this.updateCamera();
      };
      this.onPointerUp = event => {
        if (!this.drag || this.drag.id !== event.pointerId) return;
        if (!this.drag.moved) this.pick(event);
        this.drag = null;
      };
      this.onWheel = event => {
        event.preventDefault();
        this.radius = Math.max(4, Math.min(82, this.radius * Math.exp(event.deltaY * 0.0012)));
        this.updateCamera();
      };
      this.onKeyDown = event => {
        const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', '_', 'Home', 'Enter', ' '];
        if (!keys.includes(event.key)) return;
        event.preventDefault();
        if (event.key === 'ArrowLeft') this.yaw += 0.1;
        if (event.key === 'ArrowRight') this.yaw -= 0.1;
        if (event.key === 'ArrowUp') this.pitch = Math.min(1.35, this.pitch + 0.08);
        if (event.key === 'ArrowDown') this.pitch = Math.max(-1.35, this.pitch - 0.08);
        if (event.key === '+' || event.key === '=') this.radius = Math.max(4, this.radius * 0.88);
        if (event.key === '-' || event.key === '_') this.radius = Math.min(82, this.radius * 1.14);
        if (event.key === 'Home') this.reset();
        this.updateCamera();
      };
      window.addEventListener('resize', this.onResize, { passive: true });
      document.addEventListener('visibilitychange', this.onVisibility);
      canvas.addEventListener('pointerdown', this.onPointerDown);
      canvas.addEventListener('pointermove', this.onPointerMove);
      canvas.addEventListener('pointerup', this.onPointerUp);
      canvas.addEventListener('pointercancel', this.onPointerUp);
      canvas.addEventListener('wheel', this.onWheel, { passive: false });
      canvas.addEventListener('keydown', this.onKeyDown);

      this.resizeObserver = new ResizeObserver(() => this.resize());
      this.resizeObserver.observe(this.container);
      this.intersectionObserver = new IntersectionObserver(entries => {
        this.intersecting = Boolean(entries[0]?.isIntersecting);
        this.visible = !document.hidden && this.intersecting;
        if (this.visible) this.lastFrame = performance.now();
      }, { rootMargin: '120px', threshold: 0.01 });
      this.intersectionObserver.observe(this.container);
    }

    pick(event) {
      if (!this.points || !this.stars.length) return;
      const bounds = this.renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -((event.clientY - bounds.top) / bounds.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.params.Points.threshold = Math.max(0.12, this.radius * 0.013);
      raycaster.setFromCamera(pointer, this.camera);
      const hit = raycaster.intersectObject(this.points, false)[0];
      if (hit && Number.isInteger(hit.index)) this.select(this.pointIndexToStar[hit.index]?.id);
    }

    resize() {
      const width = Math.max(1, this.container.clientWidth);
      const height = Math.max(1, this.container.clientHeight);
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
      if (this.points?.material?.uniforms?.pixelRatio) this.points.material.uniforms.pixelRatio.value = this.renderer.getPixelRatio();
      this.options.onDiagnostics?.(this.getDiagnostics());
    }

    getDiagnostics() {
      const context = this.renderer.getContext();
      return {
        api: global.WebGL2RenderingContext && context instanceof global.WebGL2RenderingContext ? 'WebGL 2' : 'WebGL 1',
        stars: this.stars.length,
        pixelRatio: this.renderer.getPixelRatio(),
        width: this.renderer.domElement.width,
        height: this.renderer.domElement.height
      };
    }

    animate(now) {
      if (!this.running) return;
      this.frameHandle = requestAnimationFrame(this.animate);
      if (!this.visible) return;
      const delta = Math.min(0.05, (now - this.lastFrame) / 1000);
      this.lastFrame = now;
      if (this.autoRotate && !this.drag) {
        this.yaw += delta * 0.035;
        this.updateCamera();
      }
      if (this.background) this.background.rotation.y += delta * 0.0015;
      if (this.marker?.visible) {
        const pulse = 1 + Math.sin(now * 0.003) * 0.12;
        this.marker.scale.setScalar(pulse);
        this.marker.quaternion.copy(this.camera.quaternion);
      }
      this.renderer.render(this.scene, this.camera);
    }

    destroy() {
      this.running = false;
      cancelAnimationFrame(this.frameHandle);
      this.resizeObserver?.disconnect();
      this.intersectionObserver?.disconnect();
      window.removeEventListener('resize', this.onResize);
      document.removeEventListener('visibilitychange', this.onVisibility);
      const canvas = this.renderer.domElement;
      canvas.removeEventListener('pointerdown', this.onPointerDown);
      canvas.removeEventListener('pointermove', this.onPointerMove);
      canvas.removeEventListener('pointerup', this.onPointerUp);
      canvas.removeEventListener('pointercancel', this.onPointerUp);
      canvas.removeEventListener('wheel', this.onWheel);
      canvas.removeEventListener('keydown', this.onKeyDown);
      this.points?.geometry.dispose();
      this.points?.material.dispose();
      this.disposables.forEach(resource => resource?.dispose?.());
      this.renderer.dispose();
      this.renderer.forceContextLoss?.();
      this.container.replaceChildren();
    }
  }

  global.ITAStarTrackerScene = TrackerScene;
})(window);
