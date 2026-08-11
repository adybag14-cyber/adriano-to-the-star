class CustomizableDashboardWidgets {
  constructor() { this.widgets=[]; }
  async init() {}
  register(name, renderFn) { this.widgets.push({ name:String(name), render:renderFn }); }
  mount(containerId) {
    const c=document.getElementById(String(containerId)); if(!c) return false; c.innerHTML='';
    for (const w of this.widgets) { const el=document.createElement('div'); el.style.border='1px solid #ddd'; el.style.margin='6px 0'; el.style.padding='6px'; el.textContent=w.name; if (typeof w.render==='function') w.render(el); c.appendChild(el); }
    return true;
  }
}
window.CustomizableDashboardWidgets = CustomizableDashboardWidgets;
