class DataProfiling {
  constructor() {}
  async init() {}
  numericSummary(arr) {
    const x = Array.isArray(arr) ? arr.map(Number).filter(v => Number.isFinite(v)) : [];
    const n = x.length;
    if (n === 0) return { count: 0, mean: 0, min: 0, max: 0, stddev: 0 };
    let sum = 0;
    let min = x[0];
    let max = x[0];
    for (let i = 0; i < n; i++) {
      const v = x[i];
      sum += v;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    const mean = sum / n;
    let varSum = 0;
    for (let i = 0; i < n; i++) varSum += (x[i] - mean) * (x[i] - mean);
    const stddev = Math.sqrt(varSum / n);
    return { count: n, mean, min, max, stddev };
  }
  valueCounts(arr) {
    const out = {};
    const a = Array.isArray(arr) ? arr : [];
    for (let i = 0; i < a.length; i++) {
      const k = String(a[i]);
      out[k] = (out[k] || 0) + 1;
    }
    return out;
  }
}
window.DataProfiling = DataProfiling;
