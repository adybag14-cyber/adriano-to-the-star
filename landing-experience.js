(() => {
  'use strict';
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const body = document.body;
  const safe = fn => { try { fn(); } catch (error) { console.warn('[ITA experience]', error); } };
  function initHeaderAndProgress() {
    const header = document.querySelector('.site-header'); const progress = document.querySelector('.site-progress span'); let ticking = false;
    const update = () => { const y = scrollY; header?.classList.toggle('is-scrolled', y > 24); if (progress) { const range = Math.max(1, document.documentElement.scrollHeight - innerHeight); progress.style.transform = `scaleX(${Math.min(1, y / range)})`; } ticking = false; };
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
  class StellarField {
    constructor(canvas) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d', { alpha: true });
      this.stars = [];
      this.bandStars = [];
      this.pointer = { x: .5, y: .5 };
      this.running = !document.hidden;
      this.frame = 0;
      this.lastFrame = 0;
      this.resize = this.resize.bind(this);
      this.draw = this.draw.bind(this);
    }

    random(seed) {
      let state = seed >>> 0;
      return () => {
        state += 0x6D2B79F5;
        let value = state;
        value = Math.imul(value ^ value >>> 15, value | 1);
        value ^= value + Math.imul(value ^ value >>> 7, value | 61);
        return ((value ^ value >>> 14) >>> 0) / 4294967296;
      };
    }

    start() {
      if (!this.ctx) return;
      this.canvas.dataset.renderMode = reduceMotion.matches ? 'static-deep-space' : 'slow-deep-space';
      this.resize();
      addEventListener('resize', this.resize, { passive: true });
      if (reduceMotion.matches) return;
      if (matchMedia('(pointer:fine)').matches) {
        addEventListener('pointermove', event => {
          this.pointer.x = event.clientX / Math.max(1, innerWidth);
          this.pointer.y = event.clientY / Math.max(1, innerHeight);
        }, { passive: true });
      }
      document.addEventListener('visibilitychange', () => {
        this.running = !document.hidden;
        if (this.running && !this.frame) this.frame = requestAnimationFrame(this.draw);
      });
      this.frame = requestAnimationFrame(this.draw);
    }

    resize() {
      const dpr = Math.min(devicePixelRatio || 1, innerWidth <= 760 ? 1.25 : 1.5);
      this.width = innerWidth;
      this.height = innerHeight;
      this.canvas.width = Math.floor(this.width * dpr);
      this.canvas.height = Math.floor(this.height * dpr);
      this.canvas.style.width = `${this.width}px`;
      this.canvas.style.height = `${this.height}px`;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const seed = (0x51A7F13D ^ Math.round(this.width / 96) << 12 ^ Math.round(this.height / 72)) >>> 0;
      const random = this.random(seed);
      const count = Math.min(108, Math.max(52, Math.floor(this.width * this.height / 16500)));
      this.stars = Array.from({ length: count }, (_, index) => ({
        x: random() * this.width,
        y: random() * this.height,
        z: .22 + random() * .78,
        r: index % 29 === 0 ? 1.35 : .3 + random() * .62,
        phase: random() * Math.PI * 2,
        warm: index % 29 === 0
      }));

      const bandCount = Math.min(88, Math.max(38, Math.floor(count * .74)));
      this.bandStars = Array.from({ length: bandCount }, () => {
        const x = random();
        const scatter = ((random() + random() + random()) / 3 - .5) * .28;
        return {
          x: x * this.width,
          y: (.13 + x * .58 + Math.sin(x * Math.PI) * .045 + scatter) * this.height,
          r: .22 + random() * .46,
          alpha: .08 + random() * .2
        };
      });

      this.drawFrame(0);
    }

    drawGlow(x, y, radius, inner, outer) {
      const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, inner);
      gradient.addColorStop(1, outer);
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    drawFrame(time) {
      const ctx = this.ctx;
      const motion = reduceMotion.matches ? 0 : Math.sin(time / 32000) * 2.4;
      const ox = (this.pointer.x - .5) * 4 + motion;
      const oy = (this.pointer.y - .5) * 3 - motion * .35;
      ctx.clearRect(0, 0, this.width, this.height);
      ctx.save();
      ctx.globalCompositeOperation = 'screen';

      this.drawGlow(this.width * .76 + motion, this.height * .2, Math.max(240, this.width * .28), 'rgba(111,80,210,.075)', 'rgba(3,5,14,0)');
      this.drawGlow(this.width * .18 - motion, this.height * .68, Math.max(210, this.width * .24), 'rgba(46,174,191,.045)', 'rgba(3,5,14,0)');

      ctx.beginPath();
      ctx.moveTo(this.width * .07 + ox, this.height * .73 + oy);
      ctx.lineTo(this.width * .16 + ox, this.height * .64 + oy);
      ctx.lineTo(this.width * .26 + ox, this.height * .67 + oy);
      ctx.lineTo(this.width * .35 + ox, this.height * .54 + oy);
      ctx.moveTo(this.width * .63 + ox, this.height * .18 + oy);
      ctx.lineTo(this.width * .7 + ox, this.height * .25 + oy);
      ctx.lineTo(this.width * .78 + ox, this.height * .21 + oy);
      ctx.lineTo(this.width * .86 + ox, this.height * .31 + oy);
      ctx.strokeStyle = 'rgba(140,247,255,.052)';
      ctx.lineWidth = .55;
      ctx.stroke();

      for (const star of this.bandStars) {
        ctx.beginPath();
        ctx.arc(star.x + ox * .35, star.y + oy * .35, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(192,205,255,${star.alpha})`;
        ctx.fill();
      }

      for (const star of this.stars) {
        const twinkle = reduceMotion.matches ? .68 : .62 + Math.sin(time * .00042 + star.phase) * .12;
        ctx.beginPath();
        ctx.arc(star.x + ox * star.z, star.y + oy * star.z, star.r, 0, Math.PI * 2);
        ctx.fillStyle = star.warm
          ? `rgba(235,213,166,${Math.max(.32, twinkle)})`
          : `rgba(224,235,255,${Math.max(.16, twinkle * (.42 + star.z * .34))})`;
        ctx.fill();
      }
      ctx.restore();
    }

    draw(time = 0) {
      this.frame = 0;
      if (!this.running) return;
      if (!this.lastFrame || time - this.lastFrame >= 50) {
        this.lastFrame = time;
        this.drawFrame(time);
      }
      this.frame = requestAnimationFrame(this.draw);
    }
  }
  [initHeaderAndProgress,initReveal,initParallax,initMagneticButtons,initCardLight,initPageTransitions,initMusicLaunchers,initYear].forEach(fn=>safe(fn)); safe(()=>{const canvas=document.getElementById('stellar-field');if(canvas)new StellarField(canvas).start();});
  reduceMotion.addEventListener?.('change',()=>location.reload());
})();
