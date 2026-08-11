class FeatureStore {
  constructor() {
    this.store = new Map();
    this.tags = new Map();
  }
  async init() {}
  put(key, value, tagList) {
    const k = String(key);
    this.store.set(k, value);
    if (Array.isArray(tagList)) this.tags.set(k, tagList.map(t=>String(t)));
  }
  get(key) {
    return this.store.get(String(key));
  }
  byTag(tag) {
    const t = String(tag);
    const out = [];
    this.tags.forEach((tags, k) => { if (tags.includes(t)) out.push({ key:k, value:this.store.get(k) }); });
    return out;
  }
}
window.FeatureStore = FeatureStore;
