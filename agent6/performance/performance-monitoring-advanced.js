class PerformanceMonitoringAdvanced {
  constructor() {
    this.fps = 0;
    this._last = 0;
    this._frames = 0;
    this._running = false;
  }
  async init() {}
  start() {
    if (this._running) return;
    this._running = true;
    this._last = performance.now();
    const loop = (t) => {
      if (!this._running) return;
      this._frames++;
      const dt = t - this._last;
      if (dt >= 1000) {
        this.fps = Math.round((this._frames * 1000) / dt);
        this._frames = 0;
        this._last = t;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
  stop() {
    this._running = false;
  }
}
window.PerformanceMonitoringAdvanced = PerformanceMonitoringAdvanced;
