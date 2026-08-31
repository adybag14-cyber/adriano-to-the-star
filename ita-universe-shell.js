(() => {
  'use strict';
  if (window.__itaUniverseShellLoaded) return;
  window.__itaUniverseShellLoaded = true;

  const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const forcedColoursQuery = window.matchMedia?.('(forced-colors: active)');
  const printQuery = window.matchMedia?.('print');
  let reducedMotion = Boolean(reducedMotionQuery?.matches);
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches;

  function addAtmosphere() {
    document.body?.classList.add('ita-universe-enabled');
    if (!document.querySelector('.ita-universe-fx')) {
      const fx = document.createElement('div');
      fx.className = 'ita-universe-fx';
      fx.setAttribute('aria-hidden', 'true');
      document.body.appendChild(fx);
    }
    if (!document.getElementById('ita-cosmic-field')) {
      const canvas = document.createElement('canvas');
      canvas.id = 'ita-cosmic-field';
      canvas.dataset.itaFlightField = '';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.appendChild(canvas);
      runStarField(canvas);
    }
  }

  function runStarField(canvas) {
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) return;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars = [];
    let raf = 0;
    let last = 0;
    let hidden = document.hidden;
    let suspended = false;
    let presentationSuppressed = Boolean(forcedColoursQuery?.matches || printQuery?.matches);
    let pointerX = .5;
    let pointerY = .5;
    let random = () => .5;
    const frameInterval = coarsePointer ? 40 : 1000 / 30;

    const seededRandom = seed => {
      let state = seed >>> 0;
      return () => {
        state += 0x6D2B79F5;
        let value = state;
        value = Math.imul(value ^ value >>> 15, value | 1);
        value ^= value + Math.imul(value ^ value >>> 7, value | 61);
        return ((value ^ value >>> 14) >>> 0) / 4294967296;
      };
    };
    const countForViewport = () => Math.max(72, Math.min(196, Math.floor((innerWidth * innerHeight) / 7600)));
    const resetStar = (star = {}, initial = false) => {
      const angle = random() * Math.PI * 2;
      const radius = .025 + Math.pow(random(), 1.55) * .78;
      star.x = Math.cos(angle) * radius;
      star.y = Math.sin(angle) * radius;
      star.z = initial ? .075 + random() * 1.18 : 1.08 + random() * .22;
      star.previousZ = star.z + .016;
      star.speed = .88 + random() * .72;
      star.size = .38 + random() * .78;
      star.alpha = .52 + random() * .46;
      const tone = random();
      star.colour = tone > .92 ? '244,221,178' : tone > .76 ? '175,221,255' : tone > .62 ? '220,205,255' : '232,240,255';
      return star;
    };
    const resize = () => {
      width = innerWidth;
      height = innerHeight;
      dpr = Math.min(devicePixelRatio || 1, width <= 760 ? 1.25 : 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      random = seededRandom((0x1A2B3C4D ^ Math.round(width / 64) << 13 ^ Math.round(height / 48)) >>> 0);
      const target = countForViewport();
      stars = Array.from({ length: target }, () => resetStar({}, true));
      canvas.dataset.starCount = String(target);
      drawFrame(0, 0, false);
    };
    const drawFrame = (time, dt, advance) => {
      context.clearRect(0, 0, width, height);
      context.save();
      context.globalCompositeOperation = 'lighter';
      context.lineCap = 'round';
      const centreX = width * .5 + (pointerX - .5) * 8;
      const centreY = height * .47 + (pointerY - .5) * 6;
      const projection = Math.min(width, height) * .9;
      for (const star of stars) {
        star.previousZ = star.z;
        if (advance) star.z -= dt * .00008 * star.speed;
        if (star.z <= .045) {
          resetStar(star, false);
          continue;
        }
        const x = centreX + (star.x / star.z) * projection;
        const y = centreY + (star.y / star.z) * projection;
        const trailZ = star.z + (star.previousZ - star.z) * 3.2;
        const previousX = centreX + (star.x / trailZ) * projection;
        const previousY = centreY + (star.y / trailZ) * projection;
        if (x < -90 || x > width + 90 || y < -90 || y > height + 90) {
          resetStar(star, false);
          continue;
        }
        const depth = Math.max(0, Math.min(1, 1 - star.z / 1.28));
        const alpha = star.alpha * (.24 + depth * .76);
        if (advance && depth > .08) {
          context.beginPath();
          context.moveTo(previousX, previousY);
          context.lineTo(x, y);
          context.strokeStyle = `rgba(${star.colour},${alpha})`;
          context.lineWidth = .45 + depth * 2.1;
          context.stroke();
        }
        context.beginPath();
        context.arc(x, y, star.size * (.45 + depth * 1.15), 0, Math.PI * 2);
        context.fillStyle = `rgba(${star.colour},${Math.min(1, alpha + .12)})`;
        context.fill();
      }
      context.restore();
    };
    const draw = time => {
      raf = 0;
      if (hidden || suspended) return;
      const dt = Math.min(64, Math.max(1, time - last || frameInterval));
      if (time - last >= frameInterval) {
        last = time;
        drawFrame(time, dt, true);
      }
      raf = requestAnimationFrame(draw);
    };
    const start = () => {
      if (reducedMotion || presentationSuppressed || hidden || suspended || raf) return;
      last = performance.now();
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    canvas.dataset.renderMode = reducedMotion ? 'static-starfield' : 'forward-flight';
    canvas.dataset.motion = 'forward-z';
    resize();
    addEventListener('resize', resize, { passive: true });
    if (!coarsePointer) addEventListener('pointermove', e => {
      pointerX = e.clientX / Math.max(1, width);
      pointerY = e.clientY / Math.max(1, height);
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      hidden = document.hidden;
      if (hidden) stop();
      else start();
    });
    window.addEventListener('pagehide', () => { suspended = true; stop(); });
    window.addEventListener('pageshow', () => { suspended = false; hidden = document.hidden; start(); });
    const listen = (query, handler) => {
      if (query?.addEventListener) query.addEventListener('change', handler);
      else query?.addListener?.(handler);
    };
    listen(reducedMotionQuery, event => {
      reducedMotion = event.matches;
      canvas.dataset.renderMode = reducedMotion ? 'static-starfield' : 'forward-flight';
      if (reducedMotion) {
        stop();
        drawFrame(performance.now(), 0, false);
      } else {
        start();
      }
    });
    const syncPresentationMode = () => {
      presentationSuppressed = Boolean(forcedColoursQuery?.matches || printQuery?.matches);
      canvas.dataset.presentation = presentationSuppressed ? 'suppressed' : 'screen';
      if (presentationSuppressed) stop();
      else if (reducedMotion) drawFrame(performance.now(), 0, false);
      else start();
    };
    listen(forcedColoursQuery, syncPresentationMode);
    listen(printQuery, syncPresentationMode);
    syncPresentationMode();
    start();
  }

  function addRevealMotion() {
    if (reducedMotion || !('IntersectionObserver' in window)) return;
    const selector = [
      '.content-section', '.feature-card', '.stat-card', '.object-card', '.dashboard-card',
      '.marketplace-card', '.badge-card', '.event-card', '.blog-card', '.service-card',
      '.project-card', '.glass-card', 'main > section:not(.page-hero):not(.hero-section):not(.hero)'
    ].join(',');
    const nodes = [...document.querySelectorAll(selector)].filter(node => !node.closest('.ita-atlas-overlay'));
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('ita-revealed');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    nodes.forEach((node, index) => {
      node.classList.add('ita-reveal-ready');
      node.style.setProperty('--ita-reveal-delay', `${Math.min(index % 4, 3) * 55}ms`);
      observer.observe(node);
    });
  }

  function addHeroDepth() {
    if (reducedMotion || coarsePointer) return;
    const hero = document.querySelector('.page-hero, .hero-section, .trading-hero');
    if (!hero) return;
    hero.addEventListener('pointermove', event => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(1, rect.width) - .5;
      const y = (event.clientY - rect.top) / Math.max(1, rect.height) - .5;
      hero.style.setProperty('--ita-hero-x', `${x * 9}px`);
      hero.style.setProperty('--ita-hero-y', `${y * 7}px`);
    }, { passive: true });
  }

  function boot() {
    if (!document.body) return;
    addAtmosphere();
    addRevealMotion();
    addHeroDepth();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
