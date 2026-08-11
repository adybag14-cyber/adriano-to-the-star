(() => {
  'use strict';
  if (window.__itaUniverseShellLoaded) return;
  window.__itaUniverseShellLoaded = true;

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches;

  function addAtmosphere() {
    document.body?.classList.add('ita-universe-enabled');
    if (!document.querySelector('.ita-universe-fx')) {
      const fx = document.createElement('div');
      fx.className = 'ita-universe-fx';
      fx.setAttribute('aria-hidden', 'true');
      document.body.appendChild(fx);
    }
    if (!reducedMotion && !document.getElementById('ita-cosmic-field')) {
      const canvas = document.createElement('canvas');
      canvas.id = 'ita-cosmic-field';
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
    let pointerX = .5;
    let pointerY = .35;

    const countForViewport = () => Math.max(34, Math.min(110, Math.floor((innerWidth * innerHeight) / 15000)));
    const makeStar = () => ({
      x: Math.random(), y: Math.random(), z: .2 + Math.random() * .8,
      r: .35 + Math.random() * 1.25,
      a: .18 + Math.random() * .62,
      drift: .000004 + Math.random() * .000018,
      phase: Math.random() * Math.PI * 2
    });
    const resize = () => {
      width = innerWidth;
      height = innerHeight;
      dpr = Math.min(devicePixelRatio || 1, 1.75);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = countForViewport();
      while (stars.length < target) stars.push(makeStar());
      if (stars.length > target) stars.length = target;
    };
    const draw = time => {
      raf = requestAnimationFrame(draw);
      if (hidden || time - last < 28) return;
      const dt = Math.min(42, Math.max(1, time - last || 16));
      last = time;
      context.clearRect(0, 0, width, height);
      const px = (pointerX - .5) * 18;
      const py = (pointerY - .5) * 12;
      for (const star of stars) {
        star.y += star.drift * dt * (1.15 - star.z * .35);
        if (star.y > 1.03) { star.y = -.02; star.x = Math.random(); }
        const twinkle = .72 + Math.sin(time * .0012 + star.phase) * .28;
        const x = star.x * width + px * star.z;
        const y = star.y * height + py * star.z;
        context.beginPath();
        context.arc(x, y, star.r * (.65 + star.z * .55), 0, Math.PI * 2);
        context.fillStyle = `rgba(${star.z > .72 ? '169,244,255' : '218,232,255'},${star.a * twinkle})`;
        context.fill();
      }
      // Sparse route beacons: a quiet moving line, not a distracting meteor shower.
      const cycle = (time % 11500) / 11500;
      if (cycle < .22) {
        const p = cycle / .22;
        const x = width * (.08 + p * .46);
        const y = height * (.18 + p * .16);
        const gradient = context.createLinearGradient(x - 90, y - 34, x, y);
        gradient.addColorStop(0, 'rgba(111,234,255,0)');
        gradient.addColorStop(1, `rgba(111,234,255,${Math.sin(p * Math.PI) * .34})`);
        context.strokeStyle = gradient;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(x - 90, y - 34);
        context.lineTo(x, y);
        context.stroke();
      }
    };
    resize();
    addEventListener('resize', resize, { passive: true });
    if (!coarsePointer) addEventListener('pointermove', e => {
      pointerX = e.clientX / Math.max(1, width);
      pointerY = e.clientY / Math.max(1, height);
      document.documentElement.style.setProperty('--ita-mx', `${Math.round(pointerX * 100)}%`);
      document.documentElement.style.setProperty('--ita-my', `${Math.round(pointerY * 100)}%`);
    }, { passive: true });
    document.addEventListener('visibilitychange', () => { hidden = document.hidden; if (!hidden) last = performance.now(); });
    raf = requestAnimationFrame(draw);
    window.addEventListener('pagehide', () => cancelAnimationFrame(raf), { once: true });
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
