class FactorAnalysis {
  constructor() {}
  async init() {}
  correlationMatrix(data) {
    const X = Array.isArray(data) ? data.map(row => row.map(Number)) : [];
    const n = X.length; if (!n) return [];
    const d = X[0].length;
    const mean = new Array(d).fill(0);
    for (let i=0;i<n;i++) for (let j=0;j<d;j++) mean[j]+=X[i][j];
    for (let j=0;j<d;j++) mean[j]/=n;
    const std = new Array(d).fill(0);
    for (let i=0;i<n;i++) for (let j=0;j<d;j++) std[j]+= (X[i][j]-mean[j])*(X[i][j]-mean[j]);
    for (let j=0;j<d;j++) std[j] = Math.sqrt(std[j]/(n-1||1)) || 1;
    const corr = Array.from({length:d}, ()=>new Array(d).fill(0));
    for (let a=0;a<d;a++) {for (let b=0;b<d;b++) {
      let num=0; for (let i=0;i<n;i++) num += (X[i][a]-mean[a])*(X[i][b]-mean[b]);
      corr[a][b] = num / ((n-1||1) * std[a] * std[b]);
    }}
    return corr;
  }
}
window.FactorAnalysis = FactorAnalysis;
