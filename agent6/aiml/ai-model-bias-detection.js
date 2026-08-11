class AiModelBiasDetection {
  constructor() {}
  async init() {}
  disparityRate(groupA, groupB) {
    const a = Array.isArray(groupA) ? groupA.map(v=>v?1:0) : [];
    const b = Array.isArray(groupB) ? groupB.map(v=>v?1:0) : [];
    const ra = a.length ? a.reduce((x,y)=>x+y,0)/a.length : 0;
    const rb = b.length ? b.reduce((x,y)=>x+y,0)/b.length : 0;
    return { rateA: ra, rateB: rb, ratio: rb ? ra/rb : 0 };
  }
}
window.AiModelBiasDetection = AiModelBiasDetection;
