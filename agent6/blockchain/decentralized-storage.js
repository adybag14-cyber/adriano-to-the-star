class DecentralizedStorage {
  constructor() { this.storage = {}; this.replicas = 3; }
  async put(data) {
    const hash = await this.hash(data);
    const key = hash.slice(0, 16);
    this.storage[key] = { data, hash, replicas: this.replicas, timestamp: Date.now() };
    return key;
  }
  async get(key) {
    const item = this.storage[key];
    return item ? item.data : null;
  }
  async hash(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
  replicate(key, nodes) {
    const item = this.storage[key];
    if (!item) return false;
    item.replicas = Math.min(item.replicas + nodes, 10);
    return true;
  }
  garbageCollect(maxAge=86400000) {
    const now = Date.now();
    let removed = 0;
    for (const key in this.storage) {
      if (now - this.storage[key].timestamp > maxAge) {
        delete this.storage[key];
        removed++;
      }
    }
    return removed;
  }
  getStorageInfo() {
    return {
      keys: Object.keys(this.storage).length,
      totalSize: Object.values(this.storage).reduce((sum, item) => sum + JSON.stringify(item.data).length, 0)
    };
  }
}
window.DecentralizedStorage = DecentralizedStorage;