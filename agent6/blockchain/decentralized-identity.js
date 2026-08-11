class DecentralizedIdentity {
  constructor() {
    this.store = new Map();
  }
  async init() {}
  register(did, doc) {
    this.store.set(String(did), doc || {});
  }
  resolve(did) {
    return this.store.get(String(did)) || null;
  }
}
window.DecentralizedIdentity = DecentralizedIdentity;
