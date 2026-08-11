class SsoSystem {
  constructor() {
    this.providers = new Map();
  }
  async init() {}
  register(name, fn) { this.providers.set(String(name), fn); }
  async authenticate(name, payload) {
    const fn = this.providers.get(String(name));
    if (!fn) return { ok:false };
    try {
      const res = await fn(payload);
      return { ok: !!res, user: res || null };
    } catch {
      return { ok:false };
    }
  }
}
window.SsoSystem = SsoSystem;
