class PerformanceSlaManagement {
  constructor() {
    this.slo = new Map();
    this.metrics = new Map();
  }
  async init() {}
  define(name, targetMs) {
    this.slo.set(String(name), Number(targetMs));
  }
  record(name, durationMs) {
    const n = String(name);
    if (!this.metrics.has(n)) this.metrics.set(n, []);
    this.metrics.get(n).push(Number(durationMs));
  }
  status(name) {
    const n = String(name);
    const target = this.slo.get(n);
    const m = this.metrics.get(n) || [];
    if (target == null || m.length === 0) return { compliant: false, p95: 0, target: target || 0 };
    const arr = m.slice().sort((a,b)=>a-b);
    const idx = Math.floor(0.95 * (arr.length - 1));
    const p95 = arr[idx];
    return { compliant: p95 <= target, p95, target };
  }
}
window.PerformanceSlaManagement = PerformanceSlaManagement;
