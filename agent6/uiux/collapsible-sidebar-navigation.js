class CollapsibleSidebarNavigation {
  constructor() { this.open = false; }
  async init() {}
  toggle(id) {
    const el = document.getElementById(String(id));
    if (!el) return false;
    this.open = !this.open;
    el.style.display = this.open ? 'block' : 'none';
    return true;
  }
}
window.CollapsibleSidebarNavigation = CollapsibleSidebarNavigation;
