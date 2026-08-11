class CacheWarming {
  constructor() {
    this.cache = new Map();
    this.order = [];
    this.limit = 50;
  }
  async init() {}
  setLimit(n) {
    this.limit = Math.max(1, Number(n || 50));
  }
  get(key) {
    const k = String(key);
    if (!this.cache.has(k)) return null;
    this.touch(k);
    return this.cache.get(k);
  }
  put(key, value) {
    const k = String(key);
    this.cache.set(k, value);
    this.touch(k);
    this.evict();
  }
  touch(k) {
    const i = this.order.indexOf(k);
    if (i >= 0) this.order.splice(i, 1);
    this.order.push(k);
  }
  evict() {
    while (this.order.length > this.limit) {
      const k = this.order.shift();
      if (k != null) this.cache.delete(k);
    }
  }
  async warm(keys, fetcher) {
    const ks = Array.isArray(keys) ? keys : [];
    for (let i = 0; i < ks.length; i++) {
      const k = ks[i];
      if (this.get(k) != null) continue;
      const v = await fetcher(k);
      this.put(k, v);
    }
    return true;
  }
}
window.CacheWarming = CacheWarming;
