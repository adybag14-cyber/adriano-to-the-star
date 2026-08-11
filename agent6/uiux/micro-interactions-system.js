class MicroInteractionsSystem {
  constructor() {}
  async init() {}
  pulse(elId) {
    const el = document.getElementById(String(elId));
    if (!el) return false;
    el.style.transition = 'transform 0.2s';
    el.style.transform = 'scale(1.05)';
    setTimeout(() => { el.style.transform = 'scale(1)'; }, 200);
    return true;
  }
}
window.MicroInteractionsSystem = MicroInteractionsSystem;
