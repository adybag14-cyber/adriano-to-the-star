class FullscreenModeToggle {
  constructor() {}
  async init() {}
  async enter(elId) {
    const el = document.getElementById(String(elId)) || document.documentElement;
    if (el.requestFullscreen) await el.requestFullscreen();
  }
  async exit() {
    if (document.fullscreenElement && document.exitFullscreen) await document.exitFullscreen();
  }
}
window.FullscreenModeToggle = FullscreenModeToggle;
