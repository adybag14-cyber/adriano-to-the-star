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
    constructor(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: true }); this.stars = []; this.routes = []; this.pointer = { x: .5, y: .5 }; this.running = true; this.resize = this.resize.bind(this); this.draw = this.draw.bind(this); }
    start() { if (!this.ctx || reduceMotion.matches) return; this.resize(); addEventListener('resize', this.resize, { passive: true }); addEventListener('pointermove', event => { this.pointer.x = event.clientX / Math.max(1, innerWidth); this.pointer.y = event.clientY / Math.max(1, innerHeight); }, { passive: true }); document.addEventListener('visibilitychange', () => { this.running = !document.hidden; if (this.running) this.draw(); }); this.draw(); }
    resize() { const dpr = Math.min(devicePixelRatio || 1, 1.6); this.width = innerWidth; this.height = innerHeight; this.canvas.width = Math.floor(this.width * dpr); this.canvas.height = Math.floor(this.height * dpr); this.canvas.style.width = `${this.width}px`; this.canvas.style.height = `${this.height}px`; this.ctx.setTransform(dpr,0,0,dpr,0,0); const count = Math.min(180, Math.max(65, Math.floor(this.width * this.height / 12000))); this.stars = Array.from({length:count},(_,index)=>({x:Math.random()*this.width,y:Math.random()*this.height,z:.25+Math.random()*.9,r:index%17===0?1.25:.35+Math.random()*.7,phase:Math.random()*Math.PI*2})); this.routes = Array.from({length:Math.min(7,Math.floor(count/20))},()=>({a:this.stars[Math.floor(Math.random()*this.stars.length)],b:this.stars[Math.floor(Math.random()*this.stars.length)],phase:Math.random()*8})); }
    draw(time=0) { if (!this.running) return; const ctx=this.ctx; ctx.clearRect(0,0,this.width,this.height); const ox=(this.pointer.x-.5)*10, oy=(this.pointer.y-.5)*7; this.routes.forEach(route=>{const alpha=.035+Math.sin(time*.0003+route.phase)*.018;ctx.beginPath();ctx.moveTo(route.a.x+ox*route.a.z,route.a.y+oy*route.a.z);ctx.lineTo(route.b.x+ox*route.b.z,route.b.y+oy*route.b.z);ctx.strokeStyle=`rgba(140,247,255,${Math.max(.012,alpha)})`;ctx.lineWidth=.5;ctx.stroke();}); this.stars.forEach(star=>{const alpha=.18+((Math.sin(time*.0012*star.z+star.phase)+1)/2)*.5;ctx.beginPath();ctx.arc(star.x+ox*star.z,star.y+oy*star.z,star.r,0,Math.PI*2);ctx.fillStyle=`rgba(226,236,255,${alpha})`;ctx.fill();}); requestAnimationFrame(this.draw); }
  }
  [initHeaderAndProgress,initReveal,initParallax,initMagneticButtons,initCardLight,initPageTransitions,initMusicLaunchers,initYear].forEach(fn=>safe(fn)); safe(()=>{const canvas=document.getElementById('stellar-field');if(canvas)new StellarField(canvas).start();});
  reduceMotion.addEventListener?.('change',()=>location.reload());
})();