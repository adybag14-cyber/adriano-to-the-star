class SeasonalAnalysis {
  constructor() {}
  async init() {}
  periodAverages(series, period) {
    const s = Array.isArray(series) ? series.map(Number) : [];
    const p = Math.max(1, Number(period||1));
    const sums = Array.from({length:p}, ()=>0);
    const counts = Array.from({length:p}, ()=>0);
    for (let i=0;i<s.length;i++){ const idx = i % p; sums[idx]+=s[i]; counts[idx]++; }
    return sums.map((sum, i) => counts[i] ? sum / counts[i] : 0);
  }
}
window.SeasonalAnalysis = SeasonalAnalysis;
