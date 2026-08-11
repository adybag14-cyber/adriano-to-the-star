class ClusterAnalysis {
  constructor() {}
  async init() {}
  kMeans(points, k, maxIter) {
    const pts = Array.isArray(points) ? points.map(p=>[Number(p[0]||0), Number(p[1]||0)]) : [];
    const K = Math.max(1, Number(k||1));
    const iters = Math.max(1, Number(maxIter||20));
    const centroids = pts.slice(0,K).map(p=>p.slice());
    const assign = new Array(pts.length).fill(0);
    const dist2 = (a,b)=>{ const dx=a[0]-b[0], dy=a[1]-b[1]; return dx*dx+dy*dy; };
    for (let it=0; it<iters; it++) {
      for (let i=0;i<pts.length;i++) {
        let best=0, bd=Infinity;
        for (let c=0;c<K;c++) { const d=dist2(pts[i], centroids[c]); if (d<bd){ bd=d; best=c; } }
        assign[i]=best;
      }
      const sums = Array.from({length:K}, ()=>[0,0]);
      const counts = new Array(K).fill(0);
      for (let i=0;i<pts.length;i++){ const a=assign[i]; sums[a][0]+=pts[i][0]; sums[a][1]+=pts[i][1]; counts[a]++; }
      for (let c=0;c<K;c++){ if (counts[c]) centroids[c]=[sums[c][0]/counts[c], sums[c][1]/counts[c]]; }
    }
    return { centroids, assign };
  }
}
window.ClusterAnalysis = ClusterAnalysis;
