(() => {
  'use strict';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const body = document.body;
  const safe = fn => { try { fn(); } catch (error) { console.warn('[ITA experience]', error); } };
  function initHeaderAndProgress() {
    const header = document.querySelector('.site-header'); const progress = document.querySelector('.site-progress span'); let ticking = false;
    const update = () => { const y = scrollY; const range = Math.max(1, document.documentElement.scrollHeight - innerHeight); header?.classList.toggle('is-scrolled', y > 24); if (progress) progress.style.transform = `scaleX(${Math.min(1, y / range)})`; ticking = false; };
    addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true }); update();
  }
  function initReveal() {
    const nodes = [...document.querySelectorAll('[data-reveal]')]; if (!nodes.length) return;
    if (reduceMotion.matches || !('IntersectionObserver' in window)) { nodes.forEach(node => node.classList.add('is-visible')); return; }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }), { rootMargin: '0px 0px -9% 0px', threshold: .08 });
    nodes.forEach(node => observer.observe(node));
  }
  function initParallax() {
    if (reduceMotion.matches || !matchMedia('(pointer:fine)').matches) return;
    document.querySelectorAll('[data-parallax-root]').forEach(root => { let frame = 0; root.addEventListener('pointermove', event => { if (frame) cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { const rect = root.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width - .5; const y = (event.clientY - rect.top) / rect.height - .5; root.querySelectorAll('[data-parallax]').forEach(node => { const strength = Number(node.dataset.parallax || 10); node.style.transform = `translate3d(${x * strength}px,${y * strength}px,0)`; }); }); }); root.addEventListener('pointerleave', () => root.querySelectorAll('[data-parallax]').forEach(node => { node.style.transform = ''; })); });
  }
  function initMagneticButtons() {
    if (reduceMotion.matches || !matchMedia('(pointer:fine)').matches) return;
    document.querySelectorAll('.magnetic').forEach(button => { button.addEventListener('pointermove', event => { const rect = button.getBoundingClientRect(); button.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .08}px,${(event.clientY - rect.top - rect.height / 2) * .12}px)`; }); button.addEventListener('pointerleave', () => { button.style.transform = ''; }); });
  }
  function initCardLight() { document.querySelectorAll('.route-card').forEach(card => card.addEventListener('pointermove', event => { const rect = card.getBoundingClientRect(); card.style.setProperty('--mx', `${(event.clientX - rect.left) / rect.width * 100}%`); card.style.setProperty('--my', `${(event.clientY - rect.top) / rect.height * 100}%`); })); }
  function initPageTransitions() {
    document.addEventListener('click', event => { const link = event.target.closest('a[href]'); if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return; const url = new URL(link.href, location.href); if (url.origin !== location.origin || link.target === '_blank' || link.hasAttribute('download') || (url.hash && url.pathname === location.pathname)) return; event.preventDefault(); body.classList.add('is-transitioning'); setTimeout(() => { location.href = url.href; }, reduceMotion.matches ? 0 : 310); });
  }
  function initMusicLaunchers() {
    const buttons = [...document.querySelectorAll('[data-music-action]')];
    const sync = player => {
      const playing = Boolean(player && player.audio && !player.audio.paused);
      body.classList.toggle('music-playing', playing);
      buttons.forEach(button => button.setAttribute('aria-pressed', String(playing)));
    };
    const getPlayer = () => window.cosmicMusicPlayer?.() || window.globalMusicPlayer || null;
    const bindPlayer = player => {
      if (!player?.audio || player.audio.dataset.itaLandingBound) return;
      if (matchMedia('(max-width:760px)').matches && !player.isPlaying && !player.isMinimized && typeof player.toggleMinimize === 'function') {
        player.toggleMinimize();
      }
      player.audio.dataset.itaLandingBound = 'true';
      player.audio.addEventListener('play', () => sync(player));
      player.audio.addEventListener('pause', () => sync(player));
      player.audio.addEventListener('ended', () => sync(player));
      sync(player);
    };
    buttons.forEach(button => button.addEventListener('click', async () => {
      let player = getPlayer();
      if (!player) {
        await new Promise(resolve => setTimeout(resolve, 250));
        player = getPlayer();
      }
      if (player) {
        bindPlayer(player);
        try {
          if (button.dataset.musicAction === 'pause' || (button.dataset.musicAction === 'toggle' && player.isPlaying)) player.pause();
          else await Promise.resolve(player.play());
        } catch (error) { console.warn('[ITA music]', error); }
        sync(player);
      } else {
        document.getElementById('play-pause')?.click();
      }
    }));
    let attempts = 0;
    const timer = setInterval(() => {
      const player = getPlayer();
      if (player) { bindPlayer(player); clearInterval(timer); }
      if (++attempts > 30) clearInterval(timer);
    }, 200);
    addEventListener('ita:musicstate', event => body.classList.toggle('music-playing', Boolean(event.detail?.playing)));
  }
  function initYear() { document.querySelectorAll('[data-current-year]').forEach(node => { node.textContent = String(new Date().getFullYear()); }); }
  function initVisibleMotion() {
    if (!('IntersectionObserver' in window)) return;
    // Invisible CSS animations (including the flight-console's layout animation)
    // used to invalidate the document even while the hero was the only visible area.
    // Resume before a section enters view; no visible effect or detail is removed.
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) entry.target.toggleAttribute('data-motion-offscreen', !entry.isIntersecting);
    }, { rootMargin: '100px' });
    document.querySelectorAll('.hero-stage,.signal-strip,.passage-section,.mission-console,.route-card').forEach(node => observer.observe(node));
  }
  [initHeaderAndProgress,initReveal,initParallax,initMagneticButtons,initCardLight,initPageTransitions,initMusicLaunchers,initYear,initVisibleMotion].forEach(fn=>safe(fn));
  reduceMotion.addEventListener?.('change',()=>location.reload());
})();
