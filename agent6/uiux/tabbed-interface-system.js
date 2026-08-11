class TabbedInterfaceSystem {
  constructor() { this.active = null; }
  async init() {}
  register(ids) {
    (ids||[]).forEach(id => {
      const el = document.getElementById(String(id));
      if (el) el.style.display = 'none';
    });
  }
  switchTo(id) {
    const el = document.getElementById(String(id));
    if (!el) return false;
    if (this.active) {
      const cur = document.getElementById(String(this.active));
      if (cur) cur.style.display = 'none';
    }
    el.style.display = 'block';
    this.active = String(id);
    return true;
  }
}
window.TabbedInterfaceSystem = TabbedInterfaceSystem;
