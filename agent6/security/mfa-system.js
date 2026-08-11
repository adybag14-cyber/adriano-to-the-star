class MfaSystem {
  constructor() {
    this.secrets = new Map();
  }
  async init() {}
  async register(userId) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    const secret = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
    this.secrets.set(String(userId), secret);
    return secret;
  }
  async code(userId, epochSeconds) {
    const sec = this.secrets.get(String(userId));
    if (!sec) return null;
    const te = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", te.encode(sec), { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]);
    let step = Math.floor(Number(epochSeconds != null ? epochSeconds : Date.now() / 1000) / 30);
    const msg = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      msg[i] = step & 0xff;
      step >>>= 8;
    }
    const mac = await crypto.subtle.sign("HMAC", key, msg);
    const h = new Uint8Array(mac);
    const offset = h[h.length - 1] & 0x0f;
    const bin = ((h[offset] & 0x7f) << 24) | (h[offset + 1] << 16) | (h[offset + 2] << 8) | h[offset + 3];
    return (bin % 1000000).toString().padStart(6, "0");
  }
  async verify(userId, code, epochSeconds) {
    const c = await this.code(userId, epochSeconds);
    return String(code) === String(c);
  }
}
window.MfaSystem = MfaSystem;
