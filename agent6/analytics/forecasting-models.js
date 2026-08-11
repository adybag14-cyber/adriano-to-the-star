class ForecastingModels {
  constructor() {}
  async init() {}
  movingAverage(series, windowSize) {
    const s = Array.isArray(series) ? series.map(Number) : [];
    const w = Math.max(1, Number(windowSize || 1));
    const out = [];
    let sum = 0;
    for (let i = 0; i < s.length; i++) {
      sum += s[i];
      if (i >= w) sum -= s[i - w];
      if (i >= w - 1) out.push(sum / w);
    }
    return out;
  }
  forecastNext(series, windowSize) {
    const ma = this.movingAverage(series, windowSize);
    if (ma.length === 0) return 0;
    return ma[ma.length - 1];
  }
}
window.ForecastingModels = ForecastingModels;
