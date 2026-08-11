class AiModelDriftDetection {
  constructor() {}
  async init() {}
  meanShift(a, b) {
    const A=(Array.isArray(a)?a.map(Number):[]), B=(Array.isArray(b)?b.map(Number):[]);
    if (!A.length || !B.length) return { shift:0, alert:false };
    const ma=A.reduce((s,x)=>s+x,0)/A.length; const mb=B.reduce((s,x)=>s+x,0)/B.length; const shift=mb-ma; return { shift, alert: Math.abs(shift) > 0.5 };
  }
}
window.AiModelDriftDetection = AiModelDriftDetection;
