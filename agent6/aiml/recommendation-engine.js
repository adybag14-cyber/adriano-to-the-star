class RecommendationEngine {
  constructor() {}
  async init() {}
  topN(items, scores, n) {
    const N = Math.max(1, Number(n||5));
    const arr = (Array.isArray(items) ? items : []).map((it,i)=>({ item:it, score:Number(scores?.[i]||0) }));
    return arr.sort((a,b)=>b.score-a.score).slice(0,N);
  }
}
window.RecommendationEngine = RecommendationEngine;
