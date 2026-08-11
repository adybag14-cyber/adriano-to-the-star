class StatisticalAnalysisTools {
  constructor() {}
  async init() {}
  variance(arr) {
    const a = Array.isArray(arr) ? arr.map(Number) : [];
    const n = a.length; if (n === 0) return 0;
    const mean = a.reduce((x,y)=>x+y,0)/n;
    let v=0; for (let i=0;i<n;i++) v+=(a[i]-mean)*(a[i]-mean);
    return v / n;
  }
  covariance(x, y) {
    const a = Array.isArray(x) ? x.map(Number) : [];
    const b = Array.isArray(y) ? y.map(Number) : [];
    const n = Math.min(a.length, b.length); if (n === 0) return 0;
    const mx = a.slice(0,n).reduce((x,y)=>x+y,0)/n;
    const my = b.slice(0,n).reduce((x,y)=>x+y,0)/n;
    let c=0; for (let i=0;i<n;i++) c+=(a[i]-mx)*(b[i]-my);
    return c / n;
  }
}
window.StatisticalAnalysisTools = StatisticalAnalysisTools;
