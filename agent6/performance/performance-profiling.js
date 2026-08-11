class PerformanceProfiling {
  constructor() {
    this.metrics = new Map();
  }
  async init() {}
  start(label) {
    this.metrics.set(label, performance.now());
  }
  end(label) {
    const start = this.metrics.get(label);
    if (start == null) return null;
    const duration = performance.now() - start;
    this.metrics.delete(label);
    return duration;
  }
}
window.PerformanceProfiling = PerformanceProfiling;
