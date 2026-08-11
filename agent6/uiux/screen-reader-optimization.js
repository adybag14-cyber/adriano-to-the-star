class ScreenReaderOptimization {
  constructor() {}
  async init() {}
  setRole(id, role) { const el=document.getElementById(String(id)); if (el) el.setAttribute('role', String(role)); }
  setLive(id, mode) { const el=document.getElementById(String(id)); if (el) el.setAttribute('aria-live', String(mode||'polite')); }
  setLabel(id, text) { const el=document.getElementById(String(id)); if (el) el.setAttribute('aria-label', String(text)); }
}
window.ScreenReaderOptimization = ScreenReaderOptimization;
