class PrincipalComponentAnalysis {
  constructor() {}
  async init() {}
  firstComponent(data, maxIter=50) {
    const X = Array.isArray(data) ? data.map(row => row.map(Number)) : [];
    const n = X.length; if (!n) return { vector: [], explained: 0 };
    const d = X[0].length;
    const mean = new Array(d).fill(0);
    for (let i=0;i<n;i++) for (let j=0;j<d;j++) mean[j]+=X[i][j];
    for (let j=0;j<d;j++) mean[j]/=n;
    for (let i=0;i<n;i++) for (let j=0;j<d;j++) X[i][j]-=mean[j];
    const cov = Array.from({length:d}, ()=>new Array(d).fill(0));
    for (let i=0;i<n;i++) for (let a=0;a<d;a++) for (let b=0;b<d;b++) cov[a][b]+=X[i][a]*X[i][b];
    for (let a=0;a<d;a++) for (let b=0;b<d;b++) cov[a][b]/= (n-1 || 1);
    let v = Array.from({length:d}, ()=>Math.random());
    const norm = vec => { let s=0; for (let i=0;i<vec.length;i++) s+=vec[i]*vec[i]; s=Math.sqrt(s)||1; return vec.map(x=>x/s); };
    v = norm(v);
    for (let it=0; it<maxIter; it++) {
      const y = new Array(d).fill(0);
      for (let a=0;a<d;a++) for (let b=0;b<d;b++) y[a]+=cov[a][b]*v[b];
      v = norm(y);
    }
    let lambda=0; const Av = new Array(d).fill(0);
    for (let a=0;a<d;a++) for (let b=0;b<d;b++) Av[a]+=cov[a][b]*v[b];
    for (let i=0;i<d;i++) lambda+=v[i]*Av[i];
    let trace=0; for (let a=0;a<d;a++) trace+=cov[a][a];
    const explained = trace ? lambda/trace : 0;
    return { vector: v, explained };
  }
}
window.PrincipalComponentAnalysis = PrincipalComponentAnalysis;
