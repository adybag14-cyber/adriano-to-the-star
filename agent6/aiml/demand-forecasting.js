class DemandForecasting {
  constructor() {}
  async init() {}
  movingAverage(series, windowSize) {
    const s=Array.isArray(series)?series.map(Number):[]; const w=Math.max(1,Number(windowSize||3)); const out=[]; let sum=0; for(let i=0;i<s.length;i++){ sum+=s[i]; if(i>=w) sum-=s[i-w]; if(i>=w-1) out.push(sum/w); } return out;
  }
}
window.DemandForecasting = DemandForecasting;
