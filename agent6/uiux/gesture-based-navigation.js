class GestureBasedNavigation {
  constructor() {
    this.startX = null;
    this.onLeft = null;
    this.onRight = null;
  }
  async init() {}
  attach(el) {
    const target = typeof el === 'string' ? document.getElementById(el) : el;
    if (!target) return false;
    target.addEventListener('touchstart', (e) => { this.startX = e.touches[0].clientX; });
    target.addEventListener('touchend', (e) => {
      const endX = e.changedTouches[0].clientX;
      if (this.startX == null) return;
      const dx = endX - this.startX;
      if (dx > 50 && this.onRight) this.onRight();
      if (dx < -50 && this.onLeft) this.onLeft();
      this.startX = null;
    });
    return true;
  }
}
window.GestureBasedNavigation = GestureBasedNavigation;
