(() => {
  'use strict';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  try { history.scrollRestoration = 'manual'; } catch {}
  if (!location.hash) requestAnimationFrame(() => scrollTo({ top: 0, left: 0, behavior: 'instant' }));

  const header = document.querySelector('.ita-db-header');

  function integrateCommunityAuth() {
    const actions = document.querySelector('.ita-db-actions');
    const authControls = document.getElementById('auth-controls');
    if (!actions || !authControls) return false;
    if (authControls.parentElement !== actions) actions.prepend(authControls);
    authControls.style.removeProperty('position');
    authControls.style.removeProperty('top');
    authControls.style.removeProperty('right');
    authControls.style.removeProperty('z-index');
    return true;
  }

  if (!integrateCommunityAuth()) {
    let authAttempts = 0;
    const authTimer = setInterval(() => {
      if (integrateCommunityAuth() || ++authAttempts > 35) clearInterval(authTimer);
    }, 120);
  }
  function arrangePrimaryFlow() {
    const main = document.querySelector('main');
    const contentSection = main?.querySelector('section.content-section');
    const trends = document.getElementById('popular-planet-trends');
    const claims = document.getElementById('claim-statistics-dashboard');
    const databaseConsole = contentSection?.querySelector('.content-container.database-console');
    const catalogue = document.getElementById('nasa-data-container');

    if (main && contentSection && trends && (trends.compareDocumentPosition(contentSection) & Node.DOCUMENT_POSITION_FOLLOWING)) {
      main.insertBefore(contentSection, trends);
    }
    if (databaseConsole && catalogue && databaseConsole.firstElementChild !== catalogue) {
      databaseConsole.insertBefore(catalogue, databaseConsole.firstElementChild);
    }
    return Boolean(contentSection && trends && claims && databaseConsole && catalogue);
  }

  let flowAttempts = 0;
  const flowTimer = setInterval(() => {
    if (arrangePrimaryFlow() || ++flowAttempts > 50) clearInterval(flowTimer);
  }, 180);
  arrangePrimaryFlow();

  const legacyMenuToggle = document.getElementById('menu-toggle');
  if (legacyMenuToggle) {
    legacyMenuToggle.hidden = true;
    legacyMenuToggle.style.setProperty('display', 'none', 'important');
    legacyMenuToggle.setAttribute('aria-hidden', 'true');
  }
  let ticking = false;
  const updateProgress = () => {
    const range = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    header?.style.setProperty('--db-progress', Math.min(1, scrollY / range));
    header?.classList.toggle('is-scrolled', scrollY > 18);
    ticking = false;
  };
  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  updateProgress();

  const hero = document.querySelector('.page-hero');
  if (hero && !hero.querySelector('.db-hero-status')) {
    const status = document.createElement('div');
    status.className = 'db-hero-status';
    status.innerHTML = '<span class="db-status-chip"><i></i> Live catalogue</span><span class="db-status-chip">9,564+ indexed objects</span><span class="db-status-chip">D1 edge services</span>';
    hero.appendChild(status);
  }

  // The legacy player forces itself expanded on every page. On the information-dense
  // database screen, start it compact while preserving playback and the user's controls.
  let musicAttempts = 0;
  const compactPlayer = setInterval(() => {
    const player = window.cosmicMusicPlayer?.() || window.globalMusicPlayer;
    const element = document.getElementById('cosmic-music-player');
    if (player && element) {
      if (!player.isMinimized && typeof player.toggleMinimize === 'function') player.toggleMinimize();
      clearInterval(compactPlayer);
      return;
    }
    if (++musicAttempts > 35) clearInterval(compactPlayer);
  }, 180);

  if (!reduceMotion.matches && matchMedia('(pointer:fine)').matches && hero) {
    hero.addEventListener('pointermove', event => {
      const r = hero.getBoundingClientRect();
      const x = ((event.clientX - r.left) / Math.max(1, r.width) - .5) * 2;
      const y = ((event.clientY - r.top) / Math.max(1, r.height) - .5) * 2;
      hero.style.setProperty('--hero-x', `${50 + x * 4}%`);
      hero.style.setProperty('--hero-y', `${50 + y * 4}%`);
    }, { passive: true });
  }

  function initDatabaseStellarField() {
    const canvas = document.getElementById('db-stellar-field');
    if (!canvas || reduceMotion.matches) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    let width = 0;
    let height = 0;
    let stars = [];
    let routes = [];
    let running = true;
    const pointer = { x: .5, y: .5 };

    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 1.6);
      width = innerWidth;
      height = innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(180, Math.max(65, Math.floor(width * height / 12000)));
      stars = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: .25 + Math.random() * .9,
        r: index % 17 === 0 ? 1.25 : .35 + Math.random() * .7,
        phase: Math.random() * Math.PI * 2
      }));
      routes = Array.from({ length: Math.min(7, Math.floor(count / 20)) }, () => ({
        a: stars[Math.floor(Math.random() * stars.length)],
        b: stars[Math.floor(Math.random() * stars.length)],
        phase: Math.random() * 8
      }));
    };

    const draw = (time = 0) => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      const ox = (pointer.x - .5) * 10;
      const oy = (pointer.y - .5) * 7;
      routes.forEach(route => {
        const alpha = .035 + Math.sin(time * .0003 + route.phase) * .018;
        ctx.beginPath();
        ctx.moveTo(route.a.x + ox * route.a.z, route.a.y + oy * route.a.z);
        ctx.lineTo(route.b.x + ox * route.b.z, route.b.y + oy * route.b.z);
        ctx.strokeStyle = `rgba(140,247,255,${Math.max(.012, alpha)})`;
        ctx.lineWidth = .5;
        ctx.stroke();
      });
      stars.forEach(star => {
        const alpha = .18 + ((Math.sin(time * .0012 * star.z + star.phase) + 1) / 2) * .5;
        ctx.beginPath();
        ctx.arc(star.x + ox * star.z, star.y + oy * star.z, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226,236,255,${alpha})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };

    resize();
    addEventListener('resize', resize, { passive: true });
    addEventListener('pointermove', event => {
      pointer.x = event.clientX / Math.max(1, innerWidth);
      pointer.y = event.clientY / Math.max(1, innerHeight);
    }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      running = !document.hidden;
      if (running) draw();
    });
    draw();
  }

  initDatabaseStellarField();
})();
