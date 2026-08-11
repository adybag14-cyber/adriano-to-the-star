class BreadcrumbNavigationHistory {
  constructor() { this.path=[]; }
  async init() {}
  push(label) { this.path.push(String(label)); }
  render(id) { const el=document.getElementById(String(id)); if(!el) return false; el.textContent=this.path.join(' / '); return true; }
}
window.BreadcrumbNavigationHistory = BreadcrumbNavigationHistory;
