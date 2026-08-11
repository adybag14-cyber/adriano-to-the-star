class AnomalyDetectionAnalytics {
  constructor() {}
  async init() {}
  zScores(series) {
    const s = Array.isArray(series) ? series.map(Number) : [];
    const n = s.length;
    if (n === 0) return [];
    let sum = 0;
    for (let i = 0; i < n; i++) sum += s[i];
    const mean = sum / n;
    let varSum = 0;
    for (let i = 0; i < n; i++) varSum += (s[i] - mean) * (s[i] - mean);
    const std = Math.sqrt(varSum / n) || 1;
    return s.map(v => (v - mean) / std);
  }
  anomalies(series, threshold) {
    const z = this.zScores(series);
    const t = Number(threshold || 3);
    const out = [];
    for (let i = 0; i < z.length; i++) if (Math.abs(z[i]) >= t) out.push(i);
    return out;
  }
}
window.AnomalyDetectionAnalytics = AnomalyDetectionAnalytics;
