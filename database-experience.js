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

})();
