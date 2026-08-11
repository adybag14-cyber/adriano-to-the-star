class AiModelAbTesting {
  constructor() {}
  async init() {}
  assign(users, pctA) {
    const p = Math.max(0, Math.min(1, Number(pctA||0.5)));
    return (Array.isArray(users) ? users : []).map(u => ({ user:u, bucket: Math.random() < p ? 'A':'B' }));
  }
  evaluate(results) {
    const a = results.filter(r=>r.bucket==='A');
    const b = results.filter(r=>r.bucket==='B');
    const rate = arr => arr.length ? arr.reduce((x,y)=>x+(y.convert?1:0),0)/arr.length : 0;
    const aRate = rate(a), bRate = rate(b);
    return { aRate, bRate, winner: bRate > aRate ? 'B' : 'A' };
  }
}
window.AiModelAbTesting = AiModelAbTesting;
