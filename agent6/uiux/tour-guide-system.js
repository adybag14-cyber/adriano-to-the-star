class TourGuideSystem {
  constructor() { this.overlay = null; }
  async init() {}
  highlight(targetId) {
    const t = document.getElementById(String(targetId));
    if (!t) return false;
    const rect = t.getBoundingClientRect();
    const o = this.overlay || document.createElement('div');
    o.style.position = 'fixed';
    o.style.left = (rect.left-8) + 'px';
    o.style.top = (rect.top-8) + 'px';
    o.style.width = (rect.width+16) + 'px';
    o.style.height = (rect.height+16) + 'px';
    o.style.border = '2px solid #ff9800';
    o.style.borderRadius = '6px';
    o.style.pointerEvents = 'none';
    document.body.appendChild(o);
    this.overlay = o;
    return true;
  }
  clear() { if (this.overlay) this.overlay.remove(); this.overlay = null; }
}
window.TourGuideSystem = TourGuideSystem;
