class AiModelExplainability {
  constructor() {}
  async init() {}
  featureImportance(features, target) {
    const X = Array.isArray(features) ? features : [];
    const y = Array.isArray(target) ? target.map(Number) : [];
    const n = y.length;
    const scores = [];
    const meanY = n ? y.reduce((a,b)=>a+b,0)/n : 0;
    for (let j=0;j<X.length;j++) {
      const f = (Array.isArray(X[j]) ? X[j] : []).map(Number);
      const meanF = f.length ? f.reduce((a,b)=>a+b,0)/f.length : 0;
      let num=0, denF=0, denY=0;
      for (let i=0;i<Math.min(f.length, y.length);i++) {
        num += (f[i]-meanF)*(y[i]-meanY);
        denF += (f[i]-meanF)*(f[i]-meanF);
        denY += (y[i]-meanY)*(y[i]-meanY);
      }
      const corr = denF && denY ? Math.abs(num / Math.sqrt(denF*denY)) : 0;
      scores.push({ index:j, score:corr });
    }
    return scores.sort((a,b)=>b.score-a.score);
  }
}
window.AiModelExplainability = AiModelExplainability;
