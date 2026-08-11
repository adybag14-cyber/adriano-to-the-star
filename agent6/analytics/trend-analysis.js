class TrendAnalysis {
  constructor() {}
  async init() {}
  slope(series) {
    const y = Array.isArray(series) ? series.map(Number) : [];
    const x = y.map((_, i) => i + 1);
    const n = y.length;
    if (n === 0) return 0;
    let sx=0, sy=0, sxy=0, sx2=0;
    for (let i=0;i<n;i++){ sx+=x[i]; sy+=y[i]; sxy+=x[i]*y[i]; sx2+=x[i]*x[i]; }
    const num = n*sxy - sx*sy;
    const den = n*sx2 - sx*sx;
    return den===0?0:num/den;
  }
}
window.TrendAnalysis = TrendAnalysis;
