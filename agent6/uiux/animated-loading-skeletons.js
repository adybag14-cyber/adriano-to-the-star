class AnimatedLoadingSkeletons {
  constructor() { this.el = null; }
  async init() {}
  show(targetId) {
    const t = document.getElementById(String(targetId));
    if (!t) return false;
    const rect = t.getBoundingClientRect();
    const el = this.el || document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = rect.left + 'px';
    el.style.top = rect.top + 'px';
    el.style.width = rect.width + 'px';
    el.style.height = rect.height + 'px';
    el.style.background = 'linear-gradient(90deg,#eee,#ddd,#eee)';
    el.style.animation = 'skeleton 1s infinite';
    el.style.pointerEvents = 'none';
    document.body.appendChild(el);
    this.el = el;
    return true;
  }
  hide() { if (this.el) this.el.remove(); this.el = null; }
}
window.AnimatedLoadingSkeletons = AnimatedLoadingSkeletons;
