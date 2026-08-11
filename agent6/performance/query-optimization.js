class QueryOptimization {
  constructor() {}
  async init() {}
  suggestIndexes(query) {
    const q = String(query||'').toLowerCase();
    const m = q.match(/where\s+([a-z_]+)\s*=|where\s+([a-z_]+)\s+in|order\s+by\s+([a-z_]+)/g) || [];
    const set = new Set();
    for (const seg of m) {
      const mm = seg.match(/([a-z_]+)/);
      if (mm) set.add(mm[1]);
    }
    return Array.from(set);
  }
}
window.QueryOptimization = QueryOptimization;
