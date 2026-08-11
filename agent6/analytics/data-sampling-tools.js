class DataSamplingTools {
  constructor() {}
  async init() {}
  reservoir(arr, k) {
    const a = Array.isArray(arr) ? arr.slice() : [];
    const n = a.length;
    const r = [];
    const K = Math.max(0, Math.min(k||0, n));
    for (let i=0;i<K;i++) r[i]=a[i];
    for (let i=K;i<n;i++) {
      const j = Math.floor(Math.random() * (i+1));
      if (j < K) r[j] = a[i];
    }
    return r;
  }
}
window.DataSamplingTools = DataSamplingTools;
