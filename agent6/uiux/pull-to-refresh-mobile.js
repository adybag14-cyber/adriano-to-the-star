class PullToRefreshMobile {
  constructor() { this.y=0; }
  async init() {}
  attach(id, onRefresh) {
    const el = document.getElementById(String(id));
    if (!el) return false;
    el.addEventListener('touchstart',(e)=>{ this.y=e.touches[0].clientY; });
    el.addEventListener('touchend',(e)=>{ const dy=e.changedTouches[0].clientY - this.y; if (dy>60 && typeof onRefresh==='function') onRefresh(); this.y=0; });
    return true;
  }
}
window.PullToRefreshMobile = PullToRefreshMobile;
