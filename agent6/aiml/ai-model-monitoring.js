class AiModelMonitoring {
  constructor() {
    this.metrics = new Map();
    this.thresholds = new Map();
  }
  async init() {}
  log(modelId, key, value) {
    const id = String(modelId);
    if (!this.metrics.has(id)) this.metrics.set(id, new Map());
    const m = this.metrics.get(id);
    m.set(String(key), Number(value));
    return true;
  }
  get(modelId) {
    const id = String(modelId);
    const m = this.metrics.get(id);
    if (!m) return {};
    const out = {};
    m.forEach((v, k) => (out[k] = v));
    return out;
  }
  setThreshold(modelId, key, limit) {
    const id = String(modelId);
    if (!this.thresholds.has(id)) this.thresholds.set(id, new Map());
    const t = this.thresholds.get(id);
    t.set(String(key), Number(limit));
  }
  checkAlerts(modelId) {
    const id = String(modelId);
    const m = this.metrics.get(id);
    const t = this.thresholds.get(id);
    const alerts = [];
    if (!m || !t) return alerts;
    t.forEach((limit, key) => {
      const val = m.get(key);
      if (val != null && val > limit) alerts.push({ key, value: val, limit });
    });
    return alerts;
  }
}
window.AiModelMonitoring = AiModelMonitoring;
