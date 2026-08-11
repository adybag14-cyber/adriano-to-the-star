class OracleIntegration {
  constructor() {
    this.sources = [];
  }
  async init() {}
  addSource(fn) {
    if (typeof fn === 'function') this.sources.push(fn);
  }
  async aggregate() {
    const values = [];
    for (let i = 0; i < this.sources.length; i++) {
      try {
        const v = await this.sources[i]();
        if (v != null) values.push(Number(v));
      } catch {}
    }
    if (values.length === 0) return null;
    values.sort((a,b)=>a-b);
    const mid = Math.floor(values.length/2);
    return values.length % 2 ? values[mid] : (values[mid-1]+values[mid])/2;
  }
}
window.OracleIntegration = OracleIntegration;
