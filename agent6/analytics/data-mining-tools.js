class DataMiningTools {
  constructor() {}
  async init() {}
  normalize(arr) {
    const a = Array.isArray(arr) ? arr.map(Number) : [];
    const min = Math.min(...a);
    const max = Math.max(...a);
    const range = max - min || 1;
    return a.map(v => (v - min) / range);
  }
  standardize(arr) {
    const a = Array.isArray(arr) ? arr.map(Number) : [];
    const n = a.length; if (n === 0) return [];
    const mean = a.reduce((x,y)=>x+y,0)/n;
    const sd = Math.sqrt(a.reduce((x,y)=>x+(y-mean)*(y-mean),0)/n) || 1;
    return a.map(v => (v - mean) / sd);
  }
}
window.DataMiningTools = DataMiningTools;
