class SecurityTokenManagement {
  constructor() {
    this.secrets = new Map();
    this.tokens = new Map();
  }
  async init() {}
  async register(appId) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const secret = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
    this.secrets.set(String(appId), secret);
    return secret;
  }
  async issue(appId, payload, ttlMs) {
    const sec = this.secrets.get(String(appId));
    if (!sec) return null;
    const te = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", te.encode(sec), { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]);
    const obj = { appId: String(appId), payload: payload || {}, iat: Date.now(), exp: Date.now() + Number(ttlMs || 60000) };
    const data = te.encode(JSON.stringify(obj));
    const mac = await crypto.subtle.sign("HMAC", key, data);
    const sig = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, "0")).join("");
    const token = btoa(JSON.stringify(obj)) + "." + sig;
    this.tokens.set(token, obj.exp);
    return token;
  }
  async verify(token) {
    const parts = String(token || "").split(".");
    if (parts.length !== 2) return { ok: false };
    let obj;
    try {
      obj = JSON.parse(atob(parts[0]));
    } catch (e) {
      return { ok: false };
    }
    const sec = this.secrets.get(String(obj.appId));
    if (!sec) return { ok: false };
    if (Date.now() > Number(obj.exp)) return { ok: false };
    const te = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", te.encode(sec), { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]);
    const data = te.encode(JSON.stringify(obj));
    const mac = await crypto.subtle.sign("HMAC", key, data);
    const sig = Array.from(new Uint8Array(mac)).map(b => b.toString(16).padStart(2, "0")).join("");
    const ok = sig === parts[1];
    return { ok, payload: ok ? obj.payload : null };
  }
  revoke(token) {
    if (this.tokens.has(token)) this.tokens.delete(token);
  }
}
window.SecurityTokenManagement = SecurityTokenManagement;
