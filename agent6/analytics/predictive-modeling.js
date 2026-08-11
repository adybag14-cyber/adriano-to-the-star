class PredictiveModeling {
  constructor() {}
  async init() {}
  accuracy(pred, truth) {
    const p = Array.isArray(pred) ? pred.map(v=>v?1:0) : [];
    const t = Array.isArray(truth) ? truth.map(v=>v?1:0) : [];
    const n = Math.min(p.length, t.length);
    if (n === 0) return 0;
    let ok = 0;
    for (let i=0;i<n;i++) if (p[i] === t[i]) ok++;
    return ok / n;
  }
}
window.PredictiveModeling = PredictiveModeling;
