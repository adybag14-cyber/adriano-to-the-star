class RegressionAnalysis {
  constructor() {}
  async init() {}
  linear(x, y) {
    const a = Array.isArray(x) ? x.map(Number) : [];
    const b = Array.isArray(y) ? y.map(Number) : [];
    const n = Math.min(a.length, b.length);
    if (n === 0) return { slope:0, intercept:0 };
    let sx=0, sy=0;
    for (let i=0;i<n;i++){ sx+=a[i]; sy+=b[i]; }
    const mx=sx/n, my=sy/n;
    let num=0, den=0;
    for (let i=0;i<n;i++){ const dx=a[i]-mx; num+=dx*(b[i]-my); den+=dx*dx; }
    const slope = den===0?0:num/den;
    const intercept = my - slope*mx;
    return { slope, intercept };
  }
}
window.RegressionAnalysis = RegressionAnalysis;
