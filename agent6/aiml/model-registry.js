class ModelRegistry {
  constructor() {
    this.models = new Map();
  }
  async init() {}
  register(name, version, meta) {
    const n = String(name);
    const v = String(version);
    const arr = this.models.get(n) || [];
    arr.push({ version:v, meta: meta || {}, ts: Date.now() });
    this.models.set(n, arr);
  }
  versions(name) {
    return (this.models.get(String(name)) || []).map(m => m.version);
  }
  get(name, version) {
    const arr = this.models.get(String(name)) || [];
    return arr.find(m => m.version === String(version)) || null;
  }
}
window.ModelRegistry = ModelRegistry;
