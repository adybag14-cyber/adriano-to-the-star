class HyperparameterTuning {
  constructor() {}
  async init() {}
  async gridSearch(params, scoreFn) {
    const keys = Object.keys(params||{});
    const combos = [];
    const backtrack = (i, cur) => {
      if (i === keys.length) { combos.push(Object.assign({}, cur)); return; }
      const k = keys[i];
      const vals = params[k] || [];
      for (const v of vals) { cur[k] = v; backtrack(i+1, cur); }
    };
    backtrack(0, {});
    let best = null;
    for (const c of combos) {
      const s = await scoreFn(c);
      if (!best || s > best.score) best = { params: c, score: s };
    }
    return best;
  }
}
window.HyperparameterTuning = HyperparameterTuning;
