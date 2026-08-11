class PredictiveMaintenance {
  constructor() {}
  async init() {}
  failureRisk(sensor) {
    const v=Array.isArray(sensor)?sensor.map(Number):[]; if(v.length===0) return 0; const mean=v.reduce((s,x)=>s+x,0)/v.length; const sd=Math.sqrt(v.reduce((s,x)=>s+(x-mean)*(x-mean),0)/v.length)||1; const last=v[v.length-1]; const z=(last-mean)/sd; return Math.min(1, Math.max(0, (z+3)/6));
  }
}
window.PredictiveMaintenance = PredictiveMaintenance;
