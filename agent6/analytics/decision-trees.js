class DecisionTrees {
  constructor() {}
  async init() {}
  trainStump(X, y) {
    const xx = (Array.isArray(X) ? X : []).map(Number);
    const yy = (Array.isArray(y) ? y : []).map(v=>v?1:0);
    if (xx.length === 0) return { threshold: 0, polarity: 1 };
    const sorted = xx.map((v,i)=>({v, i})).sort((a,b)=>a.v-b.v);
    let best = { err: Infinity, thr: xx[0], pol: 1 };
    const check = (thr, pol) => {
      let err = 0;
      for (let i=0;i<xx.length;i++) {
        const pred = pol * (xx[i] >= thr ? 1 : -1) > 0 ? 1 : 0;
        if (pred !== yy[i]) err++;
      }
      if (err < best.err) best = { err, thr, pol };
    };
    for (let s=0;s<sorted.length-1;s++) {
      const thr = (sorted[s].v + sorted[s+1].v) / 2;
      check(thr, 1);
      check(thr, -1);
    }
    return { threshold: best.thr, polarity: best.pol };
  }
  predictStump(model, x) {
    const pol = Number(model.polarity||1);
    const thr = Number(model.threshold||0);
    return pol * (Number(x)||0 >= thr ? 1 : -1) > 0 ? 1 : 0;
  }
}
window.DecisionTrees = DecisionTrees;
