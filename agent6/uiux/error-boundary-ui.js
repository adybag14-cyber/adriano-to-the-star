class ErrorBoundaryUi {
  constructor() {
    this.containerId = 'error-boundary-container';
  }
  async init() {}
  wrap(fn) {
    try {
      const r = fn();
      if (r && typeof r.then === 'function') {
        return r.catch(e => this.render(String(e && e.message || e)));
      }
      return r;
    } catch (e) {
      this.render(String(e && e.message || e));
      return null;
    }
  }
  render(message) {
    const c = document.getElementById(this.containerId) || this.ensure();
    c.textContent = String(message || '');
    c.style.position = 'fixed';
    c.style.bottom = '16px';
    c.style.left = '16px';
    c.style.background = '#b00020';
    c.style.color = '#fff';
    c.style.padding = '8px 12px';
    c.style.borderRadius = '4px';
  }
  ensure() {
    const d = document.createElement('div');
    d.id = this.containerId;
    document.body.appendChild(d);
    return d;
  }
}
window.ErrorBoundaryUi = ErrorBoundaryUi;
