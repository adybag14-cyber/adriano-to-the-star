class FocusManagementSystem {
  constructor() {}
  async init() {}
  trap(containerId) {
    const c = document.getElementById(String(containerId));
    if (!c) return false;
    const focusable = c.querySelectorAll('a, button, input, textarea, select, [tabindex]');
    if (!focusable.length) return false;
    const first = focusable[0];
    const last = focusable[focusable.length-1];
    c.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    first.focus();
    return true;
  }
}
window.FocusManagementSystem = FocusManagementSystem;
