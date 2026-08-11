class StickyHeadersNavigation {
  constructor() {}
  async init() {}
  enable(id) {
    const el = document.getElementById(String(id));
    if (!el) return false;
    el.style.position = 'sticky';
    el.style.top = '0';
    el.style.zIndex = '1000';
    return true;
  }
}
window.StickyHeadersNavigation = StickyHeadersNavigation;
