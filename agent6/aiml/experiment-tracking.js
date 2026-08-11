class ExperimentTracking {
  constructor() {
    this.store = new Map();
  }
  async init() {}
  logMetric(experimentId, key, value) {
    if (!this.store.has(experimentId)) this.store.set(experimentId, new Map());
    const metrics = this.store.get(experimentId);
    metrics.set(key, value);
  }
  getMetrics(experimentId) {
    const metrics = this.store.get(experimentId);
    if (!metrics) return {};
    const out = {};
    metrics.forEach((v, k) => (out[k] = v));
    return out;
  }
}
window.ExperimentTracking = ExperimentTracking;
