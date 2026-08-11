class PerformanceTesting {
  constructor() {}
  async init() {}
  async bench(fn, iterations) {
    const it = Math.max(1, Number(iterations || 100));
    const start = performance.now();
    for (let i = 0; i < it; i++) {
      const r = fn();
      if (r && typeof r.then === 'function') await r;
    }
    const end = performance.now();
    const total = end - start;
    const avg = total / it;
    return { iterations: it, totalMs: total, avgMs: avg };
  }
}
window.PerformanceTesting = PerformanceTesting;
