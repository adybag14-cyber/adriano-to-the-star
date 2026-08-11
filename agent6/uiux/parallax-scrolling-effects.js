class ParallaxScrollingEffects {
  constructor() {}
  async init() {}
  attach(id, factor) {
    const el = document.getElementById(String(id));
    if (!el) return false;
    const f = Number(factor||0.5);
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      el.style.backgroundPosition = 'center ' + (-y*f) + 'px';
    });
    return true;
  }
}
window.ParallaxScrollingEffects = ParallaxScrollingEffects;
