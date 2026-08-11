class TimeSeriesAnalysis {
  constructor() {}
  async init() {}
  difference(series, lag) {
    const s = Array.isArray(series) ? series.map(Number) : [];
    const L = Math.max(1, Number(lag || 1));
    const out = [];
    for (let i = L; i < s.length; i++) out.push(s[i] - s[i - L]);
    return out;
  }
  autocorrelation(series, lag) {
    const s = Array.isArray(series) ? series.map(Number) : [];
    const L = Math.max(1, Number(lag || 1));
    const n = s.length - L;
    if (n <= 0) return 0;
    let mean = 0;
    for (let i = 0; i < s.length; i++) mean += s[i];
    mean /= s.length || 1;
    let num = 0;
    let den = 0;
    for (let i = 0; i < n; i++) {
      num += (s[i] - mean) * (s[i + L] - mean);
    }
    for (let i = 0; i < s.length; i++) den += (s[i] - mean) * (s[i] - mean);
    return den === 0 ? 0 : num / den;
  }
}
window.TimeSeriesAnalysis = TimeSeriesAnalysis;
