class HypothesisTesting {
  constructor() {}
  async init() {}
  twoSampleT(x, y) {
    const a = Array.isArray(x) ? x.map(Number) : [];
    const b = Array.isArray(y) ? y.map(Number) : [];
    const n1 = a.length, n2 = b.length;
    if (n1 === 0 || n2 === 0) return { t:0, df:0 };
    let m1=0,m2=0; for(let i=0;i<n1;i++) m1+=a[i]; for(let j=0;j<n2;j++) m2+=b[j]; m1/=n1; m2/=n2;
    let v1=0,v2=0; for(let i=0;i<n1;i++) v1+=(a[i]-m1)*(a[i]-m1); for(let j=0;j<n2;j++) v2+=(b[j]-m2)*(b[j]-m2);
    v1/= (n1-1||1); v2/= (n2-1||1);
    const sp = Math.sqrt(((n1-1)*v1 + (n2-1)*v2) / (n1+n2-2));
    const t = (m1 - m2) / (sp * Math.sqrt(1/n1 + 1/n2));
    const df = n1 + n2 - 2;
    return { t, df };
  }
}
window.HypothesisTesting = HypothesisTesting;
