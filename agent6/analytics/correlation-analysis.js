class CorrelationAnalysis {
  constructor() {}
  async init() {}
  pearson(x, y) {
    const a = Array.isArray(x) ? x.map(Number) : [];
    const b = Array.isArray(y) ? y.map(Number) : [];
    const n = Math.min(a.length, b.length);
    if (n === 0) return 0;
    let sx = 0, sy = 0;
    for (let i = 0; i < n; i++) { sx += a[i]; sy += b[i]; }
    const mx = sx / n, my = sy / n;
    let num = 0, vx = 0, vy = 0;
    for (let i = 0; i < n; i++) {
      const dx = a[i] - mx;
      const dy = b[i] - my;
      num += dx * dy;
      vx += dx * dx;
      vy += dy * dy;
    }
    const den = Math.sqrt(vx * vy);
    return den === 0 ? 0 : num / den;
  }
}
window.CorrelationAnalysis = CorrelationAnalysis;
