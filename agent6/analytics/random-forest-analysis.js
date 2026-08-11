class RandomForestAnalysis {
  constructor() {}
  async init() {}
  baggedStumps(X, y, trees) {
    const T = Math.max(1, Number(trees||5));
    const models = [];
    for (let t=0;t<T;t++) {
      const sampleIdx = [];
      for (let i=0;i<X.length;i++) sampleIdx.push(Math.floor(Math.random()*X.length));
      const sx = sampleIdx.map(i=>X[i]);
      const sy = sampleIdx.map(i=>y[i]);
      const DT = new (window.DecisionTrees || function(){})();
      const m = DT.trainStump ? DT.trainStump(sx, sy) : { threshold:0, polarity:1 };
      models.push(m);
    }
    return models;
  }
  predict(models, x) {
    const DT = new (window.DecisionTrees || function(){})();
    let votes = 0;
    for (const m of models) {
      const p = DT.predictStump ? DT.predictStump(m, x) : 0;
      votes += p ? 1 : -1;
    }
    return votes > 0 ? 1 : 0;
  }
}
window.RandomForestAnalysis = RandomForestAnalysis;
